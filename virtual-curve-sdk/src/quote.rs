use anyhow::{ensure, Context, Result};
use virtual_curve::{
    activation_handler::ActivationType,
    params::swap::TradeDirection,
    state::{PoolConfig, SwapResult, VirtualPool},
};

pub fn quote_exact_in(
    virtual_pool: &VirtualPool,
    config: &PoolConfig,
    swap_base_for_quote: bool,
    current_timestamp: u64,
    current_slot: u64,
    transfer_fee_excluded_amount_in: u64, // must be calculated from outside
    is_referral: bool,
) -> Result<SwapResult> {
    let mut virtual_pool = *virtual_pool;

    ensure!(
        !virtual_pool.is_curve_complete(config.migration_quote_threshold),
        "virtual pool is completed"
    );

    ensure!(transfer_fee_excluded_amount_in > 0, "amount is zero");

    virtual_pool.update_pre_swap(current_timestamp)?;
    let activation_type =
        ActivationType::try_from(config.activation_type).context("invalid activation type")?;
    let current_point = match activation_type {
        ActivationType::Slot => current_slot,
        ActivationType::Timestamp => current_timestamp,
    };

    let trade_direction = if swap_base_for_quote {
        TradeDirection::BasetoQuote
    } else {
        TradeDirection::QuotetoBase
    };
    let swap_result = virtual_pool.get_swap_result(
        &config,
        transfer_fee_excluded_amount_in,
        is_referral,
        trade_direction,
        current_point,
    )?;

    Ok(swap_result)
}
