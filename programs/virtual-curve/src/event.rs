//! Event module includes information about events of the program
use anchor_lang::prelude::*;

use crate::{
    params::{
        fee_parameters::PoolFeeParameters, liquidity_distribution::LiquidityDistributionParameters,
    },
    state::SwapResult,
    SwapParameters,
};

/// Create partner metadata
#[event]
pub struct EvtPartnerMetadata {
    pub partner_metadata: Pubkey,
    pub fee_claimer: Pubkey,
}

/// Create virtual pool metadata
#[event]
pub struct EvtVirtualPoolMetadata {
    pub virtual_pool_metadata: Pubkey,
    pub virtual_pool: Pubkey,
}
/// Create config
#[event]
pub struct EvtCreateConfig {
    pub config: Pubkey,
    pub quote_mint: Pubkey,
    pub fee_claimer: Pubkey,
    pub owner: Pubkey,
    pub pool_fees: PoolFeeParameters,
    pub collect_fee_mode: u8,
    pub migration_option: u8,
    pub activation_type: u8,
    pub token_decimal: u8,
    pub token_type: u8,
    pub partner_locked_lp_percentage: u8,
    pub partner_lp_percentage: u8,
    pub creator_locked_lp_percentage: u8,
    pub creator_lp_percentage: u8,
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
    pub has_referral: bool,
    pub params: SwapParameters,
    pub swap_result: SwapResult,
    pub amount_in: u64,
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
pub struct EvtCreateDammV2MigrationMetadata {
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

#[event]
pub struct EvtMigrateMeteoraPool {
    pub virtual_pool: Pubkey,
    pub pool: Pubkey,
    pub base_amount: u64,
    pub quote_amount: u64,
    pub sqrt_price: u128,
    pub partner_lp: u64,
    pub creator_lp: u64,
    pub partner_locked_lp: u64,
    pub creator_locked_lp: u64,
}

#[event]
pub struct EvtMeteoraLockLp {
    pub virtual_pool: Pubkey,
    pub pool: Pubkey,
    pub lp_amount: u64,
    pub owner: Pubkey,
}

#[event]
pub struct EvtMigrateDammV2Pool {
    pub virtual_pool: Pubkey,
    pub pool: Pubkey,
    pub base_amount: u64,
    pub quote_amount: u64,
    pub sqrt_price: u128,
    pub partner_liquidity: u128,
    pub creator_liquidity: u128,
    pub partner_locked_liquidity: u128,
    pub creator_locked_liquidity: u128,
}

#[event]
pub struct EvtDammV2LockLp {
    pub virtual_pool: Pubkey,
    pub pool: Pubkey,
    pub liquidity: u128,
    pub owner: Pubkey,
}
