use anchor_lang::prelude::Pubkey;

use crate::{
    constants::{MAX_CURVE_POINT, MAX_SQRT_PRICE},
    params::{
        liquidity_distribution::{
            get_minimum_base_token_for_curve, LiquidityDistributionParameters,
        },
        swap::TradeDirection,
    },
    state::{CollectFeeMode, Config, LiquidityDistributionConfig, VirtualPool},
};

use super::price_math::get_price_from_id;

#[test]
fn test_swap() {
    let migration_quote_threshold = 50_000_000_000; // 50k usdc
    let bin_step = 80; // 80bps
    let sqrt_active_id = -100;
    // price = (1+bin_step/10000)^(sqrt_active_id*2)
    let sqrt_start_price: u128 = get_price_from_id(sqrt_active_id, bin_step).unwrap(); // price = 0.20
    let curve = vec![LiquidityDistributionParameters {
        sqrt_price: MAX_SQRT_PRICE,
        liquidity: 1_000_000_000_000_000_000_000_000u128
            .checked_shl(64)
            .unwrap(),
    }];

    let mut config = Config {
        migration_quote_threshold,
        sqrt_start_price,
        collect_fee_mode: CollectFeeMode::BothToken.into(),
        ..Default::default()
    };
    let curve_length = curve.len();
    for i in 0..MAX_CURVE_POINT {
        if i < curve_length {
            config.curve[i] = curve[i].to_liquidity_distribution_config();
        } else {
            config.curve[i] = LiquidityDistributionConfig {
                sqrt_price: MAX_SQRT_PRICE, // set max
                liquidity: 0,
            }
        }
    }

    let (swap_base_amount, migration_base_amount) =
        get_minimum_base_token_for_curve(migration_quote_threshold, sqrt_start_price, &curve)
            .unwrap();
    println!(
        "swap_base_amount {} migration_base_amount {}",
        swap_base_amount, migration_base_amount
    );

    let mut pool = VirtualPool::default();
    pool.initialize(
        config.pool_fees.to_pool_fees_struct(),
        Pubkey::default(),
        Pubkey::default(),
        Pubkey::default(),
        Pubkey::default(),
        Pubkey::default(),
        config.sqrt_start_price,
        0,
        0,
    );
    let amount_in = 1_000_000_000; // 1k
    let result = pool
        .get_swap_result(&config, amount_in, false, TradeDirection::QuotetoBase, 0)
        .unwrap();
    println!("{:?}", result);
}
