use anchor_lang::prelude::*;
use damm_v2::types::{BaseFeeConfig, BaseFeeParameters, DynamicFeeConfig, DynamicFeeParameters};

#[account(zero_copy)]
#[derive(Debug, Default)]
pub struct DammV2MigrationPredefinedParameters {
    pub config: Pubkey,
    pub base_fee_config: BaseFeeConfig,
    pub dynamic_fee_config: DynamicFeeConfig,
    pub sqrt_min_price: u128,
    pub sqrt_max_price: u128,
    pub collect_fee_mode: u8,
    pub _padding_0: [u8; 15],
    pub _padding_1: [u64; 4],
}

impl Space for DammV2MigrationPredefinedParameters {
    // This is safe due to no hidden padding
    const INIT_SPACE: usize = std::mem::size_of::<DammV2MigrationPredefinedParameters>();
}

impl DammV2MigrationPredefinedParameters {
    pub fn init(
        &mut self,
        config: Pubkey,
        sqrt_min_price: u128,
        sqrt_max_price: u128,
        collect_fee_mode: u8,
        base_fee: BaseFeeParameters,
        dynamic_fee: Option<DynamicFeeParameters>,
    ) {
        self.config = config;
        self.sqrt_max_price = sqrt_max_price;
        self.sqrt_min_price = sqrt_min_price;
        self.collect_fee_mode = collect_fee_mode;

        let BaseFeeParameters {
            cliff_fee_numerator,
            number_of_period,
            period_frequency,
            reduction_factor,
            fee_scheduler_mode,
        } = base_fee;

        self.base_fee_config = BaseFeeConfig {
            cliff_fee_numerator,
            fee_scheduler_mode,
            period_frequency,
            number_of_period,
            reduction_factor,
            ..Default::default()
        };

        if let Some(DynamicFeeParameters {
            bin_step,
            bin_step_u128,
            filter_period,
            decay_period,
            reduction_factor,
            max_volatility_accumulator,
            variable_fee_control,
        }) = dynamic_fee
        {
            self.dynamic_fee_config = DynamicFeeConfig {
                initialized: true.into(),
                bin_step,
                bin_step_u128,
                filter_period,
                decay_period,
                reduction_factor,
                max_volatility_accumulator,
                variable_fee_control,
                ..Default::default()
            };
        }
    }
}
