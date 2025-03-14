use std::u64;

use anchor_lang::prelude::*;
use ruint::aliases::U256;

use crate::{
    curve::{
        get_delta_amount_base_unsigned, get_delta_amount_quote_unsigned_256,
        get_next_sqrt_price_from_input,
    },
    safe_math::SafeMath,
    state::LiquidityDistributionConfig,
    u128x128_math::Rounding,
    PoolError,
};

#[derive(Copy, Clone, Debug, AnchorSerialize, AnchorDeserialize, InitSpace, Default)]
pub struct LiquidityDistributionParameters {
    pub sqrt_price: u128,
    pub liquidity: u128,
}

impl LiquidityDistributionParameters {
    pub fn to_liquidity_distribution_config(&self) -> LiquidityDistributionConfig {
        LiquidityDistributionConfig {
            sqrt_price: self.sqrt_price,
            liquidity: self.liquidity,
        }
    }
}

pub fn get_minimum_base_token_for_curve(
    migration_threshold: u64,
    sqrt_start_price: u128,
    curve: &[LiquidityDistributionParameters],
) -> Result<(u64, u64)> {
    let sqrt_migration_price =
        get_migration_threshold_price(migration_threshold, sqrt_start_price, curve)?;
    let migration_base_amount =
        get_migration_base_token_for_constant_product(migration_threshold, sqrt_migration_price)?;
    let swap_base_amount = get_base_token_for_swap(sqrt_start_price, sqrt_migration_price, curve)?;

    Ok((swap_base_amount, migration_base_amount))
}

fn get_base_token_for_swap(
    sqrt_start_price: u128,
    sqrt_migration_price: u128,
    curve: &[LiquidityDistributionParameters],
) -> Result<u64> {
    let mut total_amount = 0u64;
    for i in 0..curve.len() {
        let lower_sqrt_price = if i == 0 {
            sqrt_start_price
        } else {
            curve[i - 1].sqrt_price
        };
        if curve[i].sqrt_price > sqrt_migration_price {
            let delta_amount = get_delta_amount_base_unsigned(
                lower_sqrt_price,
                sqrt_migration_price,
                curve[i].liquidity,
                Rounding::Up, // TODO check whether we should use round down or round up
            )?;
            total_amount = total_amount.safe_add(delta_amount)?;
            break;
        } else {
            let delta_amount = get_delta_amount_base_unsigned(
                lower_sqrt_price,
                curve[i].sqrt_price,
                curve[i].liquidity,
                Rounding::Up, // TODO check whether we should use round down or round up
            )?;
            total_amount = total_amount.safe_add(delta_amount)?;
        }
    }
    Ok(total_amount)
}

fn get_migration_base_token_for_constant_product(
    migration_threshold: u64,
    sqrt_migration_price: u128,
) -> Result<u64> {
    let sqrt_migration_price = U256::from(sqrt_migration_price);
    // price = quote / base for constant-product
    // base = quote / price
    let price = sqrt_migration_price.safe_mul(sqrt_migration_price)?;
    let quote = U256::from(migration_threshold).safe_shl(128)?;
    let base = quote.safe_div(price)?;
    require!(base <= U256::from(u64::MAX), PoolError::MathOverflow);
    return Ok(base.try_into().map_err(|_| PoolError::TypeCastFailed)?);
}

fn get_migration_threshold_price(
    migration_threshold: u64,
    sqrt_start_price: u128,
    curve: &[LiquidityDistributionParameters],
) -> Result<u128> {
    let mut next_sqrt_price = sqrt_start_price;

    let total_amount = get_delta_amount_quote_unsigned_256(
        next_sqrt_price,
        curve[0].sqrt_price,
        curve[0].liquidity,
        Rounding::Up, // TODO check whether we should use round down or round up
    )?;
    if total_amount > U256::from(migration_threshold) {
        next_sqrt_price = get_next_sqrt_price_from_input(
            next_sqrt_price,
            curve[0].liquidity,
            migration_threshold,
            false,
        )?;
    } else {
        let total_amount = total_amount
            .try_into()
            .map_err(|_| PoolError::TypeCastFailed)?;
        let mut amount_left = migration_threshold.safe_sub(total_amount)?;
        next_sqrt_price = curve[0].sqrt_price;
        for i in 1..curve.len() {
            let max_amount = get_delta_amount_quote_unsigned_256(
                next_sqrt_price,
                curve[i].sqrt_price,
                curve[i].liquidity,
                Rounding::Up, // TODO check whether we should use round down or round up
            )?;
            if max_amount > U256::from(amount_left) {
                next_sqrt_price = get_next_sqrt_price_from_input(
                    next_sqrt_price,
                    curve[i].liquidity,
                    amount_left,
                    false,
                )?;
                break;
            } else {
                amount_left = amount_left.safe_sub(
                    max_amount
                        .try_into()
                        .map_err(|_| PoolError::TypeCastFailed)?,
                )?;
                next_sqrt_price = curve[i].sqrt_price
            }
        }
    }
    Ok(next_sqrt_price)
}
