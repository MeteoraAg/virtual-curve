use crate::{
    constants::fee::{FEE_DENOMINATOR, MAX_FEE_NUMERATOR},
    params::{fee_parameters::to_numerator, swap::TradeDirection},
    safe_math::SafeMath,
    state::CollectFeeMode,
    u128x128_math::Rounding,
    utils_math::safe_mul_div_cast_u64,
    PoolError,
};

use super::BaseFeeHandler;
use anchor_lang::prelude::*;
use num::Integer;

#[derive(Debug, Default)]
pub struct FeeRateLimiter {
    pub cliff_fee_numerator: u64,
    pub reference_amount: u64,
    pub max_limiter_duration: u64,
    pub fee_increment_bps: u16,
}

impl FeeRateLimiter {
    fn is_zero_rate_limiter(&self) -> bool {
        self.reference_amount == 0 && self.max_limiter_duration == 0 && self.fee_increment_bps == 0
    }

    fn is_non_zero_rate_limiter(&self) -> bool {
        self.reference_amount != 0 && self.max_limiter_duration != 0 && self.fee_increment_bps != 0
    }

    fn get_max_index(&self) -> Result<u64> {
        let delta_numerator = MAX_FEE_NUMERATOR.safe_sub(self.cliff_fee_numerator)?;
        let fee_increment_numetator =
            to_numerator(self.fee_increment_bps.into(), FEE_DENOMINATOR.into())?;
        let max_index = delta_numerator.safe_div(fee_increment_numetator)?;
        Ok(max_index)
    }

    fn get_fee_on_amount(&self, input_amount: u64) -> Result<u64> {
        let (count_index, left_amount) = input_amount.div_rem(&self.reference_amount);
        let trading_fee: u64 = if count_index == 0 {
            safe_mul_div_cast_u64(
                input_amount,
                self.cliff_fee_numerator,
                FEE_DENOMINATOR,
                Rounding::Up,
            )?
        } else {
            let max_index = self.get_max_index()?;
            if count_index > max_index {
            } else {
                // 0 < count index <= max_index
            }
        };
        Ok(0)
    }
}

impl BaseFeeHandler for FeeRateLimiter {
    fn validate(&self, collect_fee_mode: u8) -> Result<()> {
        let collect_fee_mode = CollectFeeMode::try_from(collect_fee_mode)
            .map_err(|_| PoolError::InvalidCollectFeeMode)?;
        // can only be apllied in quote token collect fee mode
        require!(
            collect_fee_mode == CollectFeeMode::QuoteToken,
            PoolError::InvalidFeeRateLimiter
        );

        if !self.is_zero_rate_limiter() {
            require!(
                self.is_non_zero_rate_limiter(),
                PoolError::InvalidFeeRateLimiter
            );
        }
        // todo add more validation here
        Ok(())
    }
    fn get_base_fee_numerator(
        &self,
        current_point: u64,
        activation_point: u64,
        trade_direction: TradeDirection,
        input_amount: u64,
    ) -> Result<u64> {
        if self.is_zero_rate_limiter() {
            return Ok(self.cliff_fee_numerator);
        }

        // only handle for the case quote to base and collect fee mode in quote token
        if trade_direction == TradeDirection::BaseToQuote {
            return Ok(self.cliff_fee_numerator);
        }

        let last_effective_rate_limiter_point =
            u128::from(activation_point).safe_add(self.max_limiter_duration.into())?;
        if u128::from(current_point) > last_effective_rate_limiter_point {
            return Ok(self.cliff_fee_numerator);
        }

        self.get_fee_on_amount(input_amount)
    }
}
