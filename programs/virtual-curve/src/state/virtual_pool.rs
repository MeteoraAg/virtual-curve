use anchor_lang::prelude::*;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use ruint::aliases::U256;
use static_assertions::const_assert_eq;

use crate::{
    constants::{MAX_CURVE_POINT, PARTNER_SURPLUS_SHARE},
    curve::{
        get_delta_amount_base_unsigned, get_delta_amount_base_unsigned_256,
        get_delta_amount_quote_unsigned, get_delta_amount_quote_unsigned_256,
        get_next_sqrt_price_from_input,
    },
    params::swap::TradeDirection,
    safe_math::SafeMath,
    state::fee::{DynamicFeeStruct, FeeOnAmountResult, PoolFeesStruct},
    state::PoolConfig,
    u128x128_math::Rounding,
    PoolError,
};

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
pub enum CollectFeeMode {
    /// Only token B, we just need token B, because if user want to collect fee in token A, they just need to flip order of tokens
    OnlyB,
    /// Both token, in this mode only out token is collected
    BothToken,
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
pub enum PoolType {
    SplToken,
    Token2022,
}

#[account(zero_copy)]
#[derive(InitSpace, Debug, Default)]
pub struct VirtualPool {
    /// Pool fee
    pub pool_fees: PoolFeesStruct,
    /// config key
    pub config: Pubkey,
    /// creator
    pub creator: Pubkey,
    /// base mint
    pub base_mint: Pubkey,
    /// base vault
    pub base_vault: Pubkey,
    /// quote vault
    pub quote_vault: Pubkey,
    /// base reserve
    pub base_reserve: u64,
    /// quote reserve
    pub quote_reserve: u64,
    /// protocol base fee
    pub protocol_base_fee: u64,
    /// protocol quote fee
    pub protocol_quote_fee: u64,
    /// trading base fee
    pub trading_base_fee: u64,
    /// trading quote fee
    pub trading_quote_fee: u64,
    /// current price
    pub sqrt_price: u128,
    /// Activation point
    pub activation_point: u64,
    /// pool type, spl token or token2022
    pub pool_type: u8,
    /// is migrated
    pub is_migrated: u8,
    /// is partner withdraw surplus
    pub is_partner_withdraw_surplus: u8,
    /// is protocol withdraw surplus
    pub is_procotol_withdraw_surplus: u8,
    /// padding
    pub _padding_0: [u8; 4],
    /// pool metrics
    pub metrics: PoolMetrics,
    /// Padding for further use
    pub _padding_1: [u64; 10],
}

const_assert_eq!(VirtualPool::INIT_SPACE, 512);

#[zero_copy]
#[derive(Debug, InitSpace, Default)]
pub struct PoolMetrics {
    pub total_protocol_base_fee: u64,
    pub total_protocol_quote_fee: u64,
    pub total_trading_base_fee: u64,
    pub total_trading_quote_fee: u64,
}

const_assert_eq!(PoolMetrics::INIT_SPACE, 32);

impl PoolMetrics {
    pub fn accumulate_fee(
        &mut self,
        protocol_fee: u64,
        trading_fee: u64,
        is_base_token: bool,
    ) -> Result<()> {
        if is_base_token {
            self.total_protocol_base_fee = self.total_protocol_base_fee.safe_add(protocol_fee)?;
            self.total_trading_base_fee = self.total_trading_base_fee.safe_add(trading_fee)?;
        } else {
            self.total_protocol_quote_fee = self.total_protocol_quote_fee.safe_add(protocol_fee)?;
            self.total_trading_quote_fee = self.total_trading_quote_fee.safe_add(trading_fee)?;
        }

        Ok(())
    }
}

impl VirtualPool {
    pub fn initialize(
        &mut self,
        pool_fees: PoolFeesStruct,
        config: Pubkey,
        creator: Pubkey,
        base_mint: Pubkey,
        base_vault: Pubkey,
        quote_vault: Pubkey,
        sqrt_price: u128,
        pool_type: u8,
        activation_point: u64,
        base_reverse: u64,
    ) {
        self.pool_fees = pool_fees;
        self.config = config;
        self.creator = creator;
        self.base_mint = base_mint;
        self.base_vault = base_vault;
        self.quote_vault = quote_vault;
        self.sqrt_price = sqrt_price;
        self.pool_type = pool_type;
        self.activation_point = activation_point;
        self.base_reserve = base_reverse;
    }

    pub fn get_swap_result(
        &self,
        config: &PoolConfig,
        amount_in: u64,
        is_referral: bool,
        trade_direction: TradeDirection,
        current_point: u64,
    ) -> Result<SwapResult> {
        let collect_fee_mode = CollectFeeMode::try_from(config.collect_fee_mode)
            .map_err(|_| PoolError::InvalidCollectFeeMode)?;

        match collect_fee_mode {
            CollectFeeMode::BothToken => match trade_direction {
                TradeDirection::BasetoQuote => self.get_swap_result_from_base_to_quote(
                    config,
                    amount_in,
                    is_referral,
                    current_point,
                ),
                TradeDirection::QuotetoBase => self.get_swap_result_from_quote_to_base(
                    config,
                    amount_in,
                    is_referral,
                    false,
                    current_point,
                ),
            },
            CollectFeeMode::OnlyB => match trade_direction {
                TradeDirection::BasetoQuote => self.get_swap_result_from_base_to_quote(
                    config,
                    amount_in,
                    is_referral,
                    current_point,
                ), // this is fine since we still collect fee in token out
                TradeDirection::QuotetoBase => {
                    // fee will be in token b
                    let FeeOnAmountResult {
                        amount,
                        protocol_fee,
                        trading_fee,
                        referral_fee,
                    } = self.pool_fees.get_fee_on_amount(
                        amount_in,
                        is_referral,
                        current_point,
                        self.activation_point,
                    )?;
                    // skip fee
                    let swap_result = self.get_swap_result_from_quote_to_base(
                        config,
                        amount,
                        is_referral,
                        true,
                        current_point,
                    )?;

                    Ok(SwapResult {
                        output_amount: swap_result.output_amount,
                        next_sqrt_price: swap_result.next_sqrt_price,
                        protocol_fee,
                        trading_fee,
                        referral_fee,
                    })
                }
            },
        }
    }
    fn get_swap_result_from_base_to_quote(
        &self,
        config: &PoolConfig,
        amount_in: u64,
        is_referral: bool,
        current_point: u64,
    ) -> Result<SwapResult> {
        // finding new target price
        let mut total_output_amount = 0u64;
        let mut current_sqrt_price = self.sqrt_price;
        let mut amount_left = amount_in;
        for i in (0..MAX_CURVE_POINT - 1).rev() {
            if config.curve[i].sqrt_price < current_sqrt_price {
                let max_amount_in = get_delta_amount_base_unsigned_256(
                    config.curve[i].sqrt_price,
                    current_sqrt_price,
                    config.curve[i + 1].liquidity,
                    Rounding::Up, // TODO check whether we should use round down or round up
                )?;
                if U256::from(amount_left) < max_amount_in {
                    let next_sqrt_price = get_next_sqrt_price_from_input(
                        current_sqrt_price,
                        config.curve[i + 1].liquidity,
                        amount_left,
                        true,
                    )?;

                    let output_amount = get_delta_amount_quote_unsigned(
                        next_sqrt_price,
                        current_sqrt_price,
                        config.curve[i + 1].liquidity,
                        Rounding::Down,
                    )?;
                    total_output_amount = total_output_amount.safe_add(output_amount)?;
                    current_sqrt_price = next_sqrt_price;
                    amount_left = 0;
                    break;
                } else {
                    let next_sqrt_price = config.curve[i].sqrt_price;
                    let output_amount = get_delta_amount_quote_unsigned(
                        next_sqrt_price,
                        current_sqrt_price,
                        config.curve[i + 1].liquidity,
                        Rounding::Down,
                    )?;
                    total_output_amount = total_output_amount.safe_add(output_amount)?;
                    current_sqrt_price = next_sqrt_price;
                    amount_left = amount_left.safe_sub(
                        max_amount_in
                            .try_into()
                            .map_err(|_| PoolError::TypeCastFailed)?,
                    )?;
                }
            }
        }
        if amount_left != 0 {
            let next_sqrt_price = get_next_sqrt_price_from_input(
                current_sqrt_price,
                config.curve[0].liquidity,
                amount_left,
                true,
            )?;

            let output_amount = get_delta_amount_quote_unsigned(
                next_sqrt_price,
                current_sqrt_price,
                config.curve[0].liquidity,
                Rounding::Down,
            )?;
            total_output_amount = total_output_amount.safe_add(output_amount)?;
            current_sqrt_price = next_sqrt_price;
        }

        let FeeOnAmountResult {
            amount,
            protocol_fee,
            trading_fee,
            referral_fee,
        } = self.pool_fees.get_fee_on_amount(
            total_output_amount,
            is_referral,
            current_point,
            self.activation_point,
        )?;
        Ok(SwapResult {
            output_amount: amount,
            protocol_fee,
            trading_fee,
            referral_fee,
            next_sqrt_price: current_sqrt_price,
        })
    }

    fn get_swap_result_from_quote_to_base(
        &self,
        config: &PoolConfig,
        amount_in: u64,
        is_referral: bool,
        is_skip_fee: bool,
        current_point: u64,
    ) -> Result<SwapResult> {
        // finding new target price
        let mut total_output_amount = 0u64;
        let mut current_sqrt_price = self.sqrt_price;
        let mut amount_left = amount_in;
        for i in 0..MAX_CURVE_POINT {
            if config.curve[i].sqrt_price > current_sqrt_price {
                let max_amount_in = get_delta_amount_quote_unsigned_256(
                    current_sqrt_price,
                    config.curve[i].sqrt_price,
                    config.curve[i].liquidity,
                    Rounding::Up, // TODO check whether we should use round down or round up
                )?;
                if U256::from(amount_left) < max_amount_in {
                    let next_sqrt_price = get_next_sqrt_price_from_input(
                        current_sqrt_price,
                        config.curve[i].liquidity,
                        amount_left,
                        false,
                    )?;

                    let output_amount = get_delta_amount_base_unsigned(
                        current_sqrt_price,
                        next_sqrt_price,
                        config.curve[i].liquidity,
                        Rounding::Down,
                    )?;
                    total_output_amount = total_output_amount.safe_add(output_amount)?;
                    current_sqrt_price = next_sqrt_price;
                    amount_left = 0;
                    break;
                } else {
                    let next_sqrt_price = config.curve[i].sqrt_price;
                    let output_amount = get_delta_amount_base_unsigned(
                        current_sqrt_price,
                        next_sqrt_price,
                        config.curve[i].liquidity,
                        Rounding::Down,
                    )?;
                    total_output_amount = total_output_amount.safe_add(output_amount)?;
                    current_sqrt_price = next_sqrt_price;
                    amount_left = amount_left.safe_sub(
                        max_amount_in
                            .try_into()
                            .map_err(|_| PoolError::TypeCastFailed)?,
                    )?;
                }
            }
        }

        require!(amount_left == 0, PoolError::NotEnoughLiquidity);

        if is_skip_fee {
            Ok(SwapResult {
                output_amount: total_output_amount,
                protocol_fee: 0,
                trading_fee: 0,
                referral_fee: 0,
                next_sqrt_price: current_sqrt_price,
            })
        } else {
            let FeeOnAmountResult {
                amount,
                protocol_fee,
                trading_fee,
                referral_fee,
            } = self.pool_fees.get_fee_on_amount(
                total_output_amount,
                is_referral,
                current_point,
                self.activation_point,
            )?;
            Ok(SwapResult {
                output_amount: amount,
                protocol_fee,
                trading_fee,
                referral_fee,
                next_sqrt_price: current_sqrt_price,
            })
        }
    }

    pub fn apply_swap_result(
        &mut self,
        config: &PoolConfig,
        amount_in: u64,
        swap_result: &SwapResult,
        trade_direction: TradeDirection,
        current_timestamp: u64,
    ) -> Result<()> {
        let &SwapResult {
            output_amount,
            next_sqrt_price,
            protocol_fee,
            trading_fee,
            referral_fee: _referral_fee,
        } = swap_result;

        let old_sqrt_price = self.sqrt_price;
        self.sqrt_price = next_sqrt_price;

        let collect_fee_mode = CollectFeeMode::try_from(config.collect_fee_mode)
            .map_err(|_| PoolError::InvalidCollectFeeMode)?;

        if collect_fee_mode == CollectFeeMode::OnlyB
            || trade_direction == TradeDirection::BasetoQuote
        {
            self.trading_quote_fee = self.trading_quote_fee.safe_add(trading_fee)?;
            self.protocol_quote_fee = self.protocol_quote_fee.safe_add(protocol_fee)?;

            self.metrics
                .accumulate_fee(protocol_fee, trading_fee, false)?;
        } else {
            self.trading_base_fee = self.trading_base_fee.safe_add(trading_fee)?;
            self.protocol_base_fee = self.protocol_base_fee.safe_add(protocol_fee)?;
            self.metrics
                .accumulate_fee(protocol_fee, trading_fee, true)?;
        }

        // update reserve
        // fee is in input token
        let actual_amount_in_reserve = if collect_fee_mode == CollectFeeMode::OnlyB
            && trade_direction == TradeDirection::QuotetoBase
        {
            amount_in
                .safe_sub(swap_result.trading_fee)?
                .safe_sub(swap_result.protocol_fee)?
                .safe_sub(swap_result.referral_fee)?
        } else {
            amount_in
        };

        if trade_direction == TradeDirection::BasetoQuote {
            self.base_reserve = self.base_reserve.safe_add(actual_amount_in_reserve)?;
            self.quote_reserve = self.quote_reserve.safe_sub(output_amount)?;
        } else {
            self.quote_reserve = self.quote_reserve.safe_add(actual_amount_in_reserve)?;
            self.base_reserve = self.base_reserve.safe_sub(output_amount)?;
        }

        self.update_post_swap(old_sqrt_price, current_timestamp)?;
        Ok(())
    }

    pub fn update_pre_swap(&mut self, current_timestamp: u64) -> Result<()> {
        if self.pool_fees.dynamic_fee.is_dynamic_fee_enable() {
            self.pool_fees
                .dynamic_fee
                .update_references(self.sqrt_price, current_timestamp)?;
        }
        Ok(())
    }

    pub fn update_post_swap(&mut self, old_sqrt_price: u128, current_timestamp: u64) -> Result<()> {
        if self.pool_fees.dynamic_fee.is_dynamic_fee_enable() {
            self.pool_fees
                .dynamic_fee
                .update_volatility_accumulator(self.sqrt_price)?;

            // update only last_update_timestamp if bin is crossed
            let delta_price = DynamicFeeStruct::get_delta_bin_id(
                self.pool_fees.dynamic_fee.bin_step_u128,
                old_sqrt_price,
                self.sqrt_price,
            )?;
            if delta_price > 0 {
                self.pool_fees.dynamic_fee.last_update_timestamp = current_timestamp;
            }
        }
        Ok(())
    }

    pub fn claim_protocol_fee(&mut self) -> (u64, u64) {
        let token_base_amount = self.protocol_base_fee;
        let token_quote_amount = self.protocol_quote_fee;
        self.protocol_base_fee = 0;
        self.protocol_quote_fee = 0;
        (token_base_amount, token_quote_amount)
    }

    pub fn claim_trading_fee(
        &mut self,
        max_base_amount: u64,
        max_quote_amount: u64,
    ) -> Result<(u64, u64)> {
        let token_base_amount = self.trading_base_fee.min(max_base_amount);
        let token_quote_amount = self.trading_quote_fee.min(max_quote_amount);
        self.trading_base_fee = self.trading_base_fee.safe_sub(token_base_amount)?;
        self.trading_quote_fee = self.trading_quote_fee.safe_sub(token_quote_amount)?;
        Ok((token_base_amount, token_quote_amount))
    }

    pub fn is_curve_complete(&self, migration_threshold: u64) -> bool {
        self.quote_reserve >= migration_threshold
    }

    pub fn update_after_create_pool(&mut self) {
        self.is_migrated = 1;
    }

    pub fn get_total_surplus(&self, migration_threshold: u64) -> Result<u64> {
        Ok(self.quote_reserve.safe_sub(migration_threshold)?)
    }

    pub fn get_partner_surplus(&self, total_surplus: u64) -> Result<u64> {
        let partner_surplus: u128 = u128::from(total_surplus)
            .safe_mul(PARTNER_SURPLUS_SHARE.into())?
            .safe_div(100u128)?;

        Ok(u64::try_from(partner_surplus).map_err(|_| PoolError::MathOverflow)?)
    }

    pub fn get_protocol_surplus(&self, migration_threshold: u64) -> Result<u64> {
        let total_surplus: u64 = self.get_total_surplus(migration_threshold)?;
        let partner_surplus_amount = self.get_partner_surplus(total_surplus)?;

        Ok(total_surplus.safe_sub(partner_surplus_amount)?)
    }

    pub fn update_partner_withdraw_surplus(&mut self) {
        self.is_partner_withdraw_surplus = 1;
    }

    pub fn update_protocol_withdraw_surplus(&mut self) {
        self.is_procotol_withdraw_surplus = 1;
    }
}

/// Encodes all results of swapping
#[derive(Debug, PartialEq, AnchorDeserialize, AnchorSerialize)]
pub struct SwapResult {
    pub output_amount: u64,
    pub next_sqrt_price: u128,
    pub trading_fee: u64,
    pub protocol_fee: u64,
    pub referral_fee: u64,
}

#[derive(Debug, PartialEq)]
pub struct ModifyLiquidityResult {
    pub amount_a: u64,
    pub amount_b: u64,
}
