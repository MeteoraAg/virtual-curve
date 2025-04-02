use anchor_lang::prelude::*;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use static_assertions::const_assert_eq;

use crate::{
    constants::{
        fee::{FEE_DENOMINATOR, MAX_FEE_NUMERATOR},
        MAX_CURVE_POINT, MAX_SQRT_PRICE, MAX_TOKEN_SUPPLY,
    },
    fee_math::get_fee_in_period,
    params::{
        fee_parameters::PoolFeeParamters, liquidity_distribution::LiquidityDistributionParameters,
    },
    safe_math::SafeMath,
    u128x128_math::Rounding,
    utils_math::{safe_mul_div_cast_u128, safe_mul_div_cast_u64},
    PoolError,
};

use super::fee::{FeeOnAmountResult, VolatilityTracker};

/// collect fee mode
#[repr(u8)]
#[derive(
    Clone,
    Copy,
    Debug,
    PartialEq,
    IntoPrimitive,
    TryFromPrimitive,
    AnchorDeserialize,
    AnchorSerialize,
)]
// https://www.desmos.com/calculator/oxdndn2xdx
pub enum FeeSchedulerMode {
    // fee = cliff_fee_numerator - passed_period * reduction_factor
    Linear,
    // fee = cliff_fee_numerator * (1-reduction_factor/10_000)^passed_period
    Exponential,
}

#[zero_copy]
#[derive(Debug, InitSpace, Default)]
pub struct PoolFeesConfig {
    pub base_fee: BaseFeeConfig,
    pub dynamic_fee: DynamicFeeConfig,
    pub padding_0: [u64; 5],
    pub padding_1: [u8; 6],
    pub protocol_fee_percent: u8,
    pub referral_fee_percent: u8,
}

const_assert_eq!(PoolFeesConfig::INIT_SPACE, 128);

impl PoolFeesConfig {
    /// Calculates the total trading fee numerator by combining base fee and dynamic fee.
    /// The base fee is determined by the fee scheduler mode (linear or exponential) and time period.
    /// The dynamic fee is based on price volatility and is only applied if dynamic fees are enabled.
    /// The total fee is capped at MAX_FEE_NUMERATOR (50%) to ensure reasonable trading costs.
    ///
    /// Returns the total fee numerator that will be used to calculate actual trading fees.
    pub fn get_total_trading_fee(
        &self,
        volatility_tracker: &VolatilityTracker,
        current_point: u64,
        activation_point: u64,
    ) -> Result<u64> {
        let base_fee_numerator = self
            .base_fee
            .get_base_fee_numerator(current_point, activation_point)?;

        let total_fee_numerator = self
            .dynamic_fee
            .get_variable_fee_numerator(volatility_tracker)?
            .safe_add(base_fee_numerator.into())?;

        // Cap the total fee at MAX_FEE_NUMERATOR
        let total_fee_numerator = if total_fee_numerator > MAX_FEE_NUMERATOR.into() {
            MAX_FEE_NUMERATOR
        } else {
            total_fee_numerator.try_into().unwrap()
        };

        Ok(total_fee_numerator)
    }

    pub fn get_fee_on_amount(
        &self,
        volatility_tracker: &VolatilityTracker,
        amount: u64,
        has_referral: bool,
        current_point: u64,
        activation_point: u64,
    ) -> Result<FeeOnAmountResult> {
        let trade_fee_numerator =
            self.get_total_trading_fee(volatility_tracker, current_point, activation_point)?;

        let trading_fee: u64 =
            safe_mul_div_cast_u64(amount, trade_fee_numerator, FEE_DENOMINATOR, Rounding::Up)?;
        // update amount
        let amount = amount.safe_sub(trading_fee)?;

        let protocol_fee = safe_mul_div_cast_u64(
            trading_fee,
            self.protocol_fee_percent.into(),
            100,
            Rounding::Down,
        )?;

        // update trading fee
        let trading_fee: u64 = trading_fee.safe_sub(protocol_fee)?;

        let referral_fee = if has_referral {
            safe_mul_div_cast_u64(
                protocol_fee,
                self.referral_fee_percent.into(),
                100,
                Rounding::Down,
            )?
        } else {
            0
        };

        let protocol_fee = protocol_fee.safe_sub(referral_fee)?;

        Ok(FeeOnAmountResult {
            amount,
            protocol_fee,
            referral_fee,
            trading_fee,
        })
    }
}

#[zero_copy]
#[derive(Debug, InitSpace, Default)]
pub struct BaseFeeConfig {
    pub cliff_fee_numerator: u64,
    pub period_frequency: u64,
    pub reduction_factor: u64,
    pub number_of_period: u16,
    pub fee_scheduler_mode: u8,
    pub padding_0: [u8; 5],
}

const_assert_eq!(BaseFeeConfig::INIT_SPACE, 32);

impl BaseFeeConfig {
    pub fn get_max_base_fee_numerator(&self) -> u64 {
        self.cliff_fee_numerator
    }

    pub fn get_min_base_fee_numerator(&self) -> Result<u64> {
        // trick to force current_point < activation_point (in order to get the lowest fee)
        self.get_base_fee_numerator(0, 1)
    }

    pub fn get_base_fee_numerator(&self, current_point: u64, activation_point: u64) -> Result<u64> {
        if self.period_frequency == 0 {
            return Ok(self.cliff_fee_numerator);
        }

        // When trading before activation point (this won't happpen), use the maximum
        // number of periods to ensure the lowest fee is charged. After activation, calculate
        // periods based on time elapsed, capped by the maximum number of periods.
        let period = if current_point < activation_point {
            self.number_of_period.into()
        } else {
            let period = current_point
                .safe_sub(activation_point)?
                .safe_div(self.period_frequency)?;
            period.min(self.number_of_period.into())
        };

        let fee_scheduler_mode = FeeSchedulerMode::try_from(self.fee_scheduler_mode)
            .map_err(|_| PoolError::TypeCastFailed)?;

        match fee_scheduler_mode {
            FeeSchedulerMode::Linear => {
                let fee_numerator = self
                    .cliff_fee_numerator
                    .safe_sub(self.reduction_factor.safe_mul(period)?)?;
                Ok(fee_numerator)
            }
            FeeSchedulerMode::Exponential => {
                let period = u16::try_from(period).map_err(|_| PoolError::MathOverflow)?;
                let fee_numerator =
                    get_fee_in_period(self.cliff_fee_numerator, self.reduction_factor, period)?;
                Ok(fee_numerator)
            }
        }
    }
}

#[zero_copy]
#[derive(Debug, InitSpace, Default)]
pub struct DynamicFeeConfig {
    pub initialized: u8, // 0, ignore for dynamic fee
    pub padding: [u8; 7],
    pub max_volatility_accumulator: u32,
    pub variable_fee_control: u32,
    pub bin_step: u16,
    pub filter_period: u16,
    pub decay_period: u16,
    pub reduction_factor: u16,
    pub padding2: [u8; 8], // Add padding for u128 alignment
    pub bin_step_u128: u128,
}

const_assert_eq!(DynamicFeeConfig::INIT_SPACE, 48);

impl DynamicFeeConfig {
    pub fn is_dynamic_fee_enable(&self) -> bool {
        self.initialized != 0
    }

    pub fn get_variable_fee_numerator(
        &self,
        volatility_tracker: &VolatilityTracker,
    ) -> Result<u128> {
        if !self.is_dynamic_fee_enable() {
            return Ok(0);
        }

        // 1. Computing the squared price movement (volatility_accumulator * bin_step)^2
        let square_vfa_bin: u128 = volatility_tracker
            .volatility_accumulator
            .safe_mul(self.bin_step.into())?
            .checked_pow(2)
            .ok_or(PoolError::MathOverflow)?;

        // 2. Multiplying by the fee control factor
        let v_fee = square_vfa_bin.safe_mul(self.variable_fee_control.into())?;

        // 3. Scaling down the result to fit within u64 range (dividing by 1e11 and rounding up)
        let scaled_v_fee = v_fee.safe_add(99_999_999_999)?.safe_div(100_000_000_000)?;

        Ok(scaled_v_fee)
    }
}

#[repr(u8)]
#[derive(
    Clone,
    Copy,
    Debug,
    PartialEq,
    IntoPrimitive,
    TryFromPrimitive,
    AnchorDeserialize,
    AnchorSerialize,
)]
pub enum MigrationOption {
    MeteoraDamm,
    DammV2,
}

#[repr(u8)]
#[derive(
    Clone,
    Copy,
    Debug,
    PartialEq,
    IntoPrimitive,
    TryFromPrimitive,
    AnchorDeserialize,
    AnchorSerialize,
)]
pub enum TokenType {
    SplToken,
    Token2022,
}

#[account(zero_copy)]
#[derive(InitSpace, Debug, Default)]
pub struct PoolConfig {
    /// quote mint
    pub quote_mint: Pubkey,
    /// Address to get the fee
    pub fee_claimer: Pubkey,
    /// Owner of that config key
    pub owner: Pubkey,
    /// Pool fee
    pub pool_fees: PoolFeesConfig,
    /// Collect fee mode
    pub collect_fee_mode: u8,
    /// migration option
    pub migration_option: u8,
    /// whether mode slot or timestamp
    pub activation_type: u8,
    /// token decimals
    pub token_decimal: u8,
    /// version
    pub version: u8,
    /// token type of base token
    pub token_type: u8,
    /// quote token flag
    pub quote_token_flag: u8,
    /// partner locked lp percentage
    pub partner_locked_lp_percentage: u8,
    /// partner lp percentage
    pub partner_lp_percentage: u8,
    /// creator post migration fee percentage
    pub creator_locked_lp_percentage: u8,
    /// creator lp percentage
    pub creator_lp_percentage: u8,
    /// padding 0
    pub _padding_0: [u8; 5],
    /// padding 1
    pub _padding_1: [u8; 8],
    /// swap base amount
    pub swap_base_amount: u64,
    /// migration quote threshold (in quote token)
    pub migration_quote_threshold: u64,
    /// migration base threshold (in base token)
    pub migration_base_threshold: u64,
    /// migration sqrt price
    pub migration_sqrt_price: u128,
    /// padding 2
    pub _padding_2: [u128; 6],
    /// minimum price
    pub sqrt_start_price: u128,
    /// curve, only use 20 point firstly, we can extend that latter
    // each distribution will include curve[i].sqrt_price + curve[i+1].sqrt_price + curve[i+1].liquidity
    // for the first: sqrt_start_price + curve[0].sqrt_price + curve[0].liquidity
    pub curve: [LiquidityDistributionConfig; MAX_CURVE_POINT],
}

const_assert_eq!(PoolConfig::INIT_SPACE, 1040);

#[zero_copy]
#[derive(InitSpace, Debug, Default)]
pub struct LiquidityDistributionConfig {
    pub sqrt_price: u128,
    pub liquidity: u128,
}

impl PoolConfig {
    pub fn init(
        &mut self,
        quote_mint: &Pubkey,
        fee_claimer: &Pubkey,
        owner: &Pubkey,
        pool_fees: &PoolFeeParamters,
        collect_fee_mode: u8,
        migration_option: u8,
        activation_type: u8,
        token_decimal: u8,
        token_type: u8,
        quote_token_flag: u8,
        partner_locked_lp_percentage: u8,
        partner_lp_percentage: u8,
        creator_locked_lp_percentage: u8,
        creator_lp_percentage: u8,
        swap_base_amount: u64,
        migration_quote_threshold: u64,
        migration_base_threshold: u64,
        migration_sqrt_price: u128,
        sqrt_start_price: u128,
        curve: &Vec<LiquidityDistributionParameters>,
    ) {
        self.version = 0;
        self.quote_mint = *quote_mint;
        self.fee_claimer = *fee_claimer;
        self.owner = *owner;
        self.pool_fees = pool_fees.to_pool_fees_config();
        self.collect_fee_mode = collect_fee_mode;
        self.migration_option = migration_option;
        self.activation_type = activation_type;
        self.token_decimal = token_decimal;
        self.swap_base_amount = swap_base_amount;
        self.migration_quote_threshold = migration_quote_threshold;
        self.migration_base_threshold = migration_base_threshold;
        self.migration_sqrt_price = migration_sqrt_price;
        self.sqrt_start_price = sqrt_start_price;
        self.token_type = token_type;
        self.quote_token_flag = quote_token_flag;

        self.partner_lp_percentage = partner_lp_percentage;
        self.partner_locked_lp_percentage = partner_locked_lp_percentage;

        self.creator_lp_percentage = creator_lp_percentage;
        self.creator_locked_lp_percentage = creator_locked_lp_percentage;

        let curve_length = curve.len();
        for i in 0..MAX_CURVE_POINT {
            if i < curve_length {
                self.curve[i] = curve[i].to_liquidity_distribution_config();
            } else {
                self.curve[i] = LiquidityDistributionConfig {
                    sqrt_price: MAX_SQRT_PRICE, // set max
                    liquidity: 0,
                }
            }
        }
    }

    pub fn total_amount_with_buffer(
        swap_base_amount: u64,
        migration_base_threshold: u64,
    ) -> Result<u128> {
        let total_amount: u128 =
            u128::from(migration_base_threshold).safe_add(swap_base_amount.into())?;
        let max_amount = 5u128.safe_mul(total_amount.into())?.safe_div(4)?;
        Ok(max_amount)
    }

    pub fn get_max_supply(token_decimal: u8) -> Result<u128> {
        let max_supply = 10u128
            .pow(token_decimal.into())
            .safe_mul(MAX_TOKEN_SUPPLY.into())?;
        Ok(max_supply)
    }

    pub fn get_initial_base_supply(&self) -> Result<u64> {
        let total_amount = PoolConfig::total_amount_with_buffer(
            self.swap_base_amount,
            self.migration_base_threshold,
        )?;
        Ok(u64::try_from(total_amount).map_err(|_| PoolError::MathOverflow)?)
    }

    pub fn get_lp_distribution(&self, lp_amount: u64) -> Result<LpDistribution> {
        let partner_locked_lp = safe_mul_div_cast_u64(
            lp_amount,
            self.partner_locked_lp_percentage.into(),
            100,
            Rounding::Down,
        )?;
        let partner_lp = safe_mul_div_cast_u64(
            lp_amount,
            self.partner_lp_percentage.into(),
            100,
            Rounding::Down,
        )?;
        let creator_locked_lp = safe_mul_div_cast_u64(
            lp_amount,
            self.creator_locked_lp_percentage.into(),
            100,
            Rounding::Down,
        )?;

        let creator_lp = lp_amount
            .safe_sub(partner_locked_lp)?
            .safe_sub(partner_lp)?
            .safe_sub(creator_locked_lp)?;
        Ok(LpDistribution {
            partner_locked_lp,
            partner_lp,
            creator_locked_lp,
            creator_lp,
        })
    }

    pub fn get_liquidity_distribution(&self, liquidity: u128) -> Result<LiquidityDistribution> {
        let partner_locked_lp =
            safe_mul_div_cast_u128(liquidity, self.partner_locked_lp_percentage.into(), 100)?;
        let partner_lp = safe_mul_div_cast_u128(liquidity, self.partner_lp_percentage.into(), 100)?;
        let creator_locked_lp =
            safe_mul_div_cast_u128(liquidity, self.creator_locked_lp_percentage.into(), 100)?;

        let creator_lp = liquidity
            .safe_sub(partner_locked_lp)?
            .safe_sub(partner_lp)?
            .safe_sub(creator_locked_lp)?;
        Ok(LiquidityDistribution {
            partner_locked_lp,
            partner_lp,
            creator_locked_lp,
            creator_lp,
        })
    }
}

pub struct LpDistribution {
    pub partner_locked_lp: u64,
    pub partner_lp: u64,
    pub creator_locked_lp: u64,
    pub creator_lp: u64,
}

pub struct LiquidityDistribution {
    pub partner_locked_lp: u128,
    pub partner_lp: u128,
    pub creator_locked_lp: u128,
    pub creator_lp: u128,
}
