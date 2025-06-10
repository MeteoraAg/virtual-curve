use crate::{
    constants::{
        damm_v2::{MAX_FEE_NUMERATOR, MIN_FEE_NUMERATOR},
        seeds::DAMM_V2_WITH_DYNAMIC_CONFIG_PREDEFINED_PARAMETERS_PREFIX,
        MAX_SQRT_PRICE, MIN_SQRT_PRICE,
    },
    state::DammV2MigrationPredefinedParameters,
    EvtCreateDammV2MigrationPredefinedParameters, PoolError,
};
use anchor_lang::prelude::*;
use damm_v2::types::{BaseFeeParameters, DynamicFeeParameters};

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct CreateDammV2DynamicConfigPredefinedParametersArgs {
    pub config: Pubkey,
    /// sqrt min
    pub sqrt_min_price: u128,
    /// sqrt max
    pub sqrt_max_price: u128,
    /// collect fee mode
    pub collect_fee_mode: u8,
    /// Base fee
    pub base_fee: BaseFeeParameters,
    /// dynamic fee
    pub dynamic_fee: Option<DynamicFeeParameters>,
}

fn validate_base_fee_parameters(base_fee: &BaseFeeParameters) -> Result<()> {
    let BaseFeeParameters {
        cliff_fee_numerator,
        number_of_period,
        period_frequency,
        reduction_factor,
        fee_scheduler_mode,
    } = *base_fee;

    // Only support linear mode with fixed fee rate
    require!(fee_scheduler_mode == 0, PoolError::InvalidInput);
    require!(period_frequency == 0, PoolError::InvalidInput);
    require!(number_of_period == 0, PoolError::InvalidInput);
    require!(reduction_factor == 0, PoolError::InvalidInput);

    require!(
        cliff_fee_numerator >= MIN_FEE_NUMERATOR && cliff_fee_numerator <= MAX_FEE_NUMERATOR,
        PoolError::InvalidInput
    );

    Ok(())
}

impl CreateDammV2DynamicConfigPredefinedParametersArgs {
    pub fn validate(&self) -> Result<()> {
        // 1. Validate price range
        require!(
            self.sqrt_min_price >= MIN_SQRT_PRICE && self.sqrt_max_price <= MAX_SQRT_PRICE,
            PoolError::InvalidInput
        );

        require!(
            self.sqrt_min_price < self.sqrt_max_price,
            PoolError::InvalidInput
        );

        // 2. Validate fees
        validate_base_fee_parameters(&self.base_fee)?;
        // Dynamic fee is not supported for now
        require!(self.dynamic_fee.is_none(), PoolError::InvalidInput);

        // 3. Validate collect fee mode
        require!(
            self.collect_fee_mode == 0 || self.collect_fee_mode == 1,
            PoolError::InvalidInput
        );

        Ok(())
    }
}

#[event_cpi]
#[derive(Accounts)]
#[instruction(args: CreateDammV2DynamicConfigPredefinedParametersArgs)]
pub struct CreateDammV2DynamicConfigPredefinedParameters<'info> {
    #[account(
        init,
        seeds = [
            DAMM_V2_WITH_DYNAMIC_CONFIG_PREDEFINED_PARAMETERS_PREFIX,
            args.config.as_ref(),
        ],
        bump,
        payer = payer,
        space = 8 + DammV2MigrationPredefinedParameters::INIT_SPACE,
    )]
    pub damm_v2_dynamic_config_predefined_parameters:
        AccountLoader<'info, DammV2MigrationPredefinedParameters>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Integrator need to create predefined parameters first before DBC's PoolConfig
// Prerequisite: CP-AMM admin need to issue a DynamicConfig for DBC's PoolAuthority
pub fn handle_create_damm_v2_dynamic_config_predefined_parameters(
    ctx: Context<CreateDammV2DynamicConfigPredefinedParameters>,
    args: CreateDammV2DynamicConfigPredefinedParametersArgs,
) -> Result<()> {
    let mut predefined_parameters = ctx
        .accounts
        .damm_v2_dynamic_config_predefined_parameters
        .load_init()?;

    args.validate()?;

    let CreateDammV2DynamicConfigPredefinedParametersArgs {
        sqrt_max_price,
        sqrt_min_price,
        collect_fee_mode,
        base_fee,
        dynamic_fee,
        config,
    } = args;

    predefined_parameters.init(
        config,
        sqrt_min_price,
        sqrt_max_price,
        collect_fee_mode,
        base_fee,
        dynamic_fee,
    );

    emit_cpi!(EvtCreateDammV2MigrationPredefinedParameters {
        config,
        predefined_parameters: ctx
            .accounts
            .damm_v2_dynamic_config_predefined_parameters
            .key(),
        sqrt_min_price,
        sqrt_max_price,
        collect_fee_mode,
        base_fee,
        dynamic_fee
    });

    Ok(())
}
