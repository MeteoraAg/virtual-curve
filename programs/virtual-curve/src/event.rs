//! Event module includes information about events of the program
use anchor_lang::prelude::*;

use crate::{
    params::{
        fee_parameters::PoolFeeParamters, liquidity_distribution::LiquidityDistributionParameters,
    },
    state::SwapResult,
    SwapParameters,
};

/// Create config
#[event]
pub struct EvtCreateConfig {
    pub config: Pubkey,
    pub quote_mint: Pubkey,
    pub fee_claimer: Pubkey,
    pub owner: Pubkey,
    pub pool_fees: PoolFeeParamters,
    pub collect_fee_mode: u8,
    pub migration_option: u8,
    pub activation_type: u8,
    pub token_decimal: u8,
    pub token_type: u8,
    pub swap_base_amount: u64,
    pub migration_quote_threshold: u64,
    pub migration_base_amount: u64,
    pub sqrt_start_price: u128,
    pub curve: Vec<LiquidityDistributionParameters>,
}

/// Create claim fee operator
#[event]
pub struct EvtCreateClaimFeeOperator {
    pub operator: Pubkey,
}

/// Close claim fee operator
#[event]
pub struct EvtCloseClaimFeeOperator {
    pub claim_fee_operator: Pubkey,
    pub operator: Pubkey,
}

#[event]
pub struct EvtInitializePool {
    pub pool: Pubkey,
    pub config: Pubkey,
    pub creator: Pubkey,
    pub base_mint: Pubkey,
    pub pool_type: u8,
    pub activation_point: u64,
}

#[event]
pub struct EvtSwap {
    pub pool: Pubkey,
    pub config: Pubkey,
    pub trade_direction: u8,
    pub is_referral: bool,
    pub params: SwapParameters,
    pub swap_result: SwapResult,
    pub transfer_fee_excluded_amount_in: u64,
    pub current_timestamp: u64,
}

#[event]
pub struct EvtCurveComplete {
    pub pool: Pubkey,
    pub config: Pubkey,
    pub base_reserve: u64,
    pub quote_reserve: u64,
}

#[event]
pub struct EvtClaimProtocolFee {
    pub pool: Pubkey,
    pub token_base_amount: u64,
    pub token_quote_amount: u64,
}

#[event]
pub struct EvtClaimTradingFee {
    pub pool: Pubkey,
    pub token_base_amount: u64,
    pub token_quote_amount: u64,
}

#[event]
pub struct EvtCreateMeteoraMigrationMetadata {
    pub virtual_pool: Pubkey,
}

#[event]
pub struct EvtProtocolWithdrawSurplus {
    pub pool: Pubkey,
    pub surplus_amount: u64,
}

#[event]
pub struct EvtPartnerWithdrawSurplus {
    pub pool: Pubkey,
    pub surplus_amount: u64,
}
