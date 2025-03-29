use crate::{
    constants::MAX_SQRT_PRICE,
    params::liquidity_distribution::{
        get_base_token_for_swap, get_migration_base_token, get_migration_threshold_price,
        LiquidityDistributionParameters,
    },
    state::MigrationOption,
};

use super::price_math::get_price_from_id;

#[test]
fn test_create_config() {
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
    let sqrt_migration_price =
        get_migration_threshold_price(migration_quote_threshold, sqrt_start_price, &curve).unwrap();
    let swap_base_amount =
        get_base_token_for_swap(sqrt_start_price, sqrt_migration_price, &curve).unwrap();
    let migration_base_amount = get_migration_base_token(
        migration_quote_threshold,
        sqrt_migration_price,
        MigrationOption::MeteoraDamm,
    )
    .unwrap();

    println!("{} {}", swap_base_amount, migration_base_amount);
}
