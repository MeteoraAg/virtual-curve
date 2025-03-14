use anchor_lang::prelude::*;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use static_assertions::const_assert_eq;

use crate::{
    constants::{MAX_CURVE_POINT, MAX_SQRT_PRICE, MAX_TOKEN_SUPPLY},
    params::{
        fee_parameters::{BaseFeeParameters, DynamicFeeParameters, PoolFeeParamters},
        liquidity_distribution::LiquidityDistributionParameters,
    },
    safe_math::SafeMath,
    state::fee::{BaseFeeStruct, DynamicFeeStruct, PoolFeesStruct},
    PoolError,
};

#[zero_copy]
#[derive(Debug, InitSpace, Default)]
pub struct PoolFeesConfig {
    pub base_fee: BaseFeeConfig,
    pub protocol_fee_percent: u8,
    pub referral_fee_percent: u8,
    pub padding_0: [u8; 6],
    /// dynamic fee
    pub dynamic_fee: DynamicFeeConfig,
    pub padding_1: [u64; 2],
}

const_assert_eq!(PoolFeesConfig::INIT_SPACE, 96);

#[zero_copy]
#[derive(Debug, InitSpace, Default)]
pub struct BaseFeeConfig {
    pub cliff_fee_numerator: u64,
    pub fee_scheduler_mode: u8,
    pub padding: [u8; 5],
    pub number_of_period: u16,
    pub period_frequency: u64,
    pub reduction_factor: u64,
}

const_assert_eq!(BaseFeeConfig::INIT_SPACE, 32);

impl BaseFeeConfig {
    fn to_base_fee_parameters(&self) -> BaseFeeParameters {
        BaseFeeParameters {
            cliff_fee_numerator: self.cliff_fee_numerator,
            number_of_period: self.number_of_period,
            period_frequency: self.period_frequency,
            reduction_factor: self.reduction_factor,
            fee_scheduler_mode: self.fee_scheduler_mode,
        }
    }

    fn to_base_fee_struct(&self) -> BaseFeeStruct {
        BaseFeeStruct {
            cliff_fee_numerator: self.cliff_fee_numerator,
            number_of_period: self.number_of_period,
            period_frequency: self.period_frequency,
            reduction_factor: self.reduction_factor,
            fee_scheduler_mode: self.fee_scheduler_mode,
            ..Default::default()
        }
    }
}

impl PoolFeesConfig {
    pub fn to_pool_fee_parameters(&self) -> PoolFeeParamters {
        let &PoolFeesConfig {
            base_fee,
            protocol_fee_percent: _protocol_fee_percent,
            referral_fee_percent: _referral_fee_percent,
            dynamic_fee:
                DynamicFeeConfig {
                    initialized,
                    bin_step,
                    bin_step_u128,
                    filter_period,
                    decay_period,
                    reduction_factor,
                    max_volatility_accumulator,
                    variable_fee_control,
                    ..
                },
            ..
        } = self;
        if initialized == 1 {
            PoolFeeParamters {
                base_fee: base_fee.to_base_fee_parameters(),
                dynamic_fee: Some(DynamicFeeParameters {
                    bin_step,
                    bin_step_u128,
                    filter_period,
                    decay_period,
                    reduction_factor,
                    max_volatility_accumulator,
                    variable_fee_control,
                }),
            }
        } else {
            PoolFeeParamters {
                base_fee: base_fee.to_base_fee_parameters(),
                ..Default::default()
            }
        }
    }

    pub fn to_pool_fees_struct(&self) -> PoolFeesStruct {
        let &PoolFeesConfig {
            base_fee,
            protocol_fee_percent,
            referral_fee_percent,
            dynamic_fee,
            ..
        } = self;

        PoolFeesStruct {
            base_fee: base_fee.to_base_fee_struct(),
            protocol_fee_percent,
            referral_fee_percent,
            dynamic_fee: dynamic_fee.to_dynamic_fee_struct(),
            ..Default::default()
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
    pub bin_step_u128: u128,
}

const_assert_eq!(DynamicFeeConfig::INIT_SPACE, 40);

impl DynamicFeeConfig {
    fn to_dynamic_fee_struct(&self) -> DynamicFeeStruct {
        if self.initialized == 0 {
            DynamicFeeStruct::default()
        } else {
            DynamicFeeStruct {
                initialized: 1,
                bin_step: self.bin_step,
                bin_step_u128: self.bin_step_u128,
                filter_period: self.filter_period,
                decay_period: self.decay_period,
                reduction_factor: self.reduction_factor,
                max_volatility_accumulator: self.max_volatility_accumulator,
                variable_fee_control: self.variable_fee_control,
                ..Default::default()
            }
        }
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
pub struct Config {
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
    /// token type
    pub token_type: u8,
    /// creator post migration fee percentage
    pub creator_post_migration_fee_percentage: u8,
    /// padding 0
    pub _padding_0: [u8; 2],
    /// swap base amount
    pub swap_base_amount: u64,
    /// migration quote threshold (in quote token)
    pub migration_quote_threshold: u64,
    /// migration base threshold (in base token)
    pub migration_base_threshold: u64,
    /// padding
    pub padding: [u128; 8],
    /// minimum price
    pub sqrt_start_price: u128,
    /// curve, only use 20 point firstly, we can extend that latter
    // each distribution will include curve[i].sqrt_price + curve[i+1].sqrt_price + curve[i+1].liquidity
    // for the first: sqrt_start_price + curve[0].sqrt_price + curve[0].liquidity
    pub curve: [LiquidityDistributionConfig; MAX_CURVE_POINT],
}

const_assert_eq!(Config::INIT_SPACE, 1008);

#[zero_copy]
#[derive(InitSpace, Debug, Default)]
pub struct LiquidityDistributionConfig {
    pub sqrt_price: u128,
    pub liquidity: u128,
}

impl Config {
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
        creator_post_migration_fee_percentage: u8,
        swap_base_amount: u64,
        migration_quote_threshold: u64,
        migration_base_threshold: u64,
        sqrt_start_price: u128,
        curve: &Vec<LiquidityDistributionParameters>,
    ) {
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
        self.sqrt_start_price = sqrt_start_price;
        self.token_type = token_type;
        self.creator_post_migration_fee_percentage = creator_post_migration_fee_percentage;

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
        let total_amount =
            Config::total_amount_with_buffer(self.swap_base_amount, self.migration_base_threshold)?;
        Ok(u64::try_from(total_amount).map_err(|_| PoolError::MathOverflow)?)
    }
}
