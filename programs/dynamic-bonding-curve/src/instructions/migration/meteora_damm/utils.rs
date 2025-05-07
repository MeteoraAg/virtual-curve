pub mod damm_utils {
    use crate::u128x128_math::{shl_div, Rounding};
    use num::integer::Roots;

    const SCALE_OFFSET: u8 = 64;
    pub const BASE_VIRTUAL_PRICE: u128 = 1 << SCALE_OFFSET;

    pub fn calculate_constant_product_virtual_price(
        token_a_amount: u64,
        token_b_amount: u64,
        lp_supply: u64,
    ) -> Option<u128> {
        if lp_supply == 0 {
            return None;
        }
        let token_a_amount: u128 = token_a_amount.into();
        let token_b_amount: u128 = token_b_amount.into();
        let k = token_a_amount.checked_mul(token_b_amount)?;
        let d = k.sqrt();
        shl_div(d, lp_supply.into(), SCALE_OFFSET, Rounding::Down)
    }
}

pub mod vault_utils {
    use dynamic_vault::accounts::Vault;

    const LOCKED_PROFIT_DEGRADATION_DENOMINATOR: u128 = 1_000_000_000_000;

    pub fn get_amount_by_share(
        current_time: u64,
        vault: &Vault,
        lp_amount: u64,
        lp_supply: u64,
    ) -> Option<u64> {
        let total_amount = get_unlocked_amount(vault, current_time)?;
        u64::try_from(
            u128::from(lp_amount)
                .checked_mul(u128::from(total_amount))?
                .checked_div(u128::from(lp_supply))?,
        )
        .ok()
    }

    pub fn get_unlocked_amount(vault: &Vault, current_time: u64) -> Option<u64> {
        vault
            .total_amount
            .checked_sub(calculate_locked_profit(vault, current_time)?)
    }

    pub fn calculate_locked_profit(vault: &Vault, current_time: u64) -> Option<u64> {
        let locked_profit_tracker = &vault.locked_profit_tracker;
        let duration = u128::from(current_time.checked_sub(locked_profit_tracker.last_report)?);
        let locked_profit_degradation = u128::from(locked_profit_tracker.locked_profit_degradation);
        let locked_fund_ratio = duration.checked_mul(locked_profit_degradation)?;

        if locked_fund_ratio > LOCKED_PROFIT_DEGRADATION_DENOMINATOR {
            return Some(0);
        }
        let locked_profit = u128::from(locked_profit_tracker.last_updated_locked_profit);

        let locked_profit = (locked_profit
            .checked_mul(LOCKED_PROFIT_DEGRADATION_DENOMINATOR.checked_sub(locked_fund_ratio)?)?)
        .checked_div(LOCKED_PROFIT_DEGRADATION_DENOMINATOR)?;
        u64::try_from(locked_profit).ok()
    }
}
