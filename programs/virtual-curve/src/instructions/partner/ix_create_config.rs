use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{
    activation_handler::ActivationType,
    constants::{DEFAULT_QUOTE_MINTS, DEFAULT_QUOTE_THRESHOLD, MAX_SQRT_PRICE, MIN_SQRT_PRICE},
    params::{
        fee_parameters::PoolFeeParamters,
        liquidity_distribution::{
            get_max_delta_quote_token, get_minimum_base_token_for_curve,
            LiquidityDistributionParameters,
        },
    },
    state::{CollectFeeMode, Config, MigrationOption, TokenType},
    EvtCreateConfig, PoolError,
};

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct ConfigParameters {
    pub pool_fees: PoolFeeParamters,
    pub collect_fee_mode: u8,
    pub migration_option: u8,
    pub activation_type: u8,
    pub token_type: u8,
    pub token_decimal: u8,
    pub creator_post_migration_fee_percentage: u8,
    pub migration_quote_threshold: u64,
    pub sqrt_start_price: u128,
    /// padding for future use
    pub padding: [u64; 6],
    pub curve: Vec<LiquidityDistributionParameters>,
}

impl ConfigParameters {
    pub fn validate(&self, quote_mint: Pubkey) -> Result<()> {
        // validate fee
        self.pool_fees.validate()?;

        // validate collect fee mode
        require!(
            CollectFeeMode::try_from(self.collect_fee_mode).is_ok(),
            PoolError::InvalidCollectFeeMode
        );
        // validate migration option and token type
        let migration_option_value = MigrationOption::try_from(self.migration_option)
            .map_err(|_| PoolError::InvalidMigrationOption)?;
        let token_type_value =
            TokenType::try_from(self.token_type).map_err(|_| PoolError::InvalidTokenType)?;

        if migration_option_value == MigrationOption::MeteoraDamm {
            require!(
                token_type_value == TokenType::SplToken,
                PoolError::InvalidTokenType
            );
        }

        // validate activation type
        require!(
            ActivationType::try_from(self.activation_type).is_ok(),
            PoolError::InvalidActivationType
        );

        // validate token decimals
        require!(
            self.token_decimal >= 6 && self.token_decimal <= 9,
            PoolError::InvalidTokenDecimals
        );

        require!(
            self.creator_post_migration_fee_percentage <= 100,
            PoolError::InvalidFeePercentage
        );

        // validate total_supply/migration_quote_threshold and curve and quote_mint
        require!(
            is_whitelisted_quote_token(&quote_mint),
            PoolError::InvalidQuoteMint
        );
        // validate quote threshold
        for i in 0..DEFAULT_QUOTE_MINTS.len() {
            if DEFAULT_QUOTE_MINTS[i].eq(&quote_mint) {
                // TODO validate upper
                require!(
                    self.migration_quote_threshold >= DEFAULT_QUOTE_THRESHOLD[i],
                    PoolError::InvalidQuoteThreshold
                );
            }
        }

        require!(
            self.sqrt_start_price >= MIN_SQRT_PRICE && self.sqrt_start_price < MAX_SQRT_PRICE,
            PoolError::InvalidCurve
        );
        require!(self.curve.len() > 0, PoolError::InvalidCurve);
        require!(
            self.curve[0].sqrt_price > self.sqrt_start_price
                && self.curve[0].liquidity > 0
                && self.curve[0].sqrt_price <= MAX_SQRT_PRICE,
            PoolError::InvalidCurve
        );

        for i in 1..self.curve.len() {
            require!(
                self.curve[i].sqrt_price > self.curve[i - 1].sqrt_price
                    && self.curve[i].liquidity > 0,
                PoolError::InvalidCurve
            );
        }

        let max_quote_delta = get_max_delta_quote_token(self.sqrt_start_price, &self.curve)?;

        // TODO we need to add more threshold here
        require!(
            max_quote_delta >= self.migration_quote_threshold,
            PoolError::InvalidCurve
        );

        Ok(())
    }
}

#[event_cpi]
#[derive(Accounts)]
#[instruction(config_parameters: ConfigParameters)]
pub struct CreateConfigCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Config::INIT_SPACE
    )]
    pub config: AccountLoader<'info, Config>,

    /// CHECK: fee_claimer
    pub fee_claimer: UncheckedAccount<'info>,
    /// CHECK: owner of the config
    pub owner: UncheckedAccount<'info>,
    /// quote mint
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_config(
    ctx: Context<CreateConfigCtx>,
    config_parameters: ConfigParameters,
) -> Result<()> {
    config_parameters.validate(ctx.accounts.quote_mint.key())?;
    let ConfigParameters {
        pool_fees,
        collect_fee_mode,
        migration_option,
        activation_type,
        token_type,
        token_decimal,
        creator_post_migration_fee_percentage,
        migration_quote_threshold,
        sqrt_start_price,
        curve,
        ..
    } = config_parameters;

    let (swap_base_amount, migration_base_amount) =
        get_minimum_base_token_for_curve(migration_quote_threshold, sqrt_start_price, &curve)?;

    let mut config = ctx.accounts.config.load_init()?;
    config.init(
        &ctx.accounts.quote_mint.key(),
        ctx.accounts.fee_claimer.key,
        ctx.accounts.owner.key,
        &pool_fees,
        collect_fee_mode,
        migration_option,
        activation_type,
        token_decimal,
        token_type,
        creator_post_migration_fee_percentage,
        swap_base_amount,
        migration_quote_threshold,
        migration_base_amount,
        sqrt_start_price,
        &curve,
    );

    emit_cpi!(EvtCreateConfig {
        config: ctx.accounts.config.key(),
        fee_claimer: ctx.accounts.fee_claimer.key(),
        quote_mint: ctx.accounts.quote_mint.key(),
        owner: ctx.accounts.owner.key(),
        pool_fees,
        collect_fee_mode,
        migration_option,
        activation_type,
        token_decimal,
        token_type,
        swap_base_amount,
        migration_quote_threshold,
        migration_base_amount,
        sqrt_start_price,
        curve
    });

    Ok(())
}

fn is_whitelisted_quote_token(mint: &Pubkey) -> bool {
    for i in 0..DEFAULT_QUOTE_MINTS.len() {
        if DEFAULT_QUOTE_MINTS[i].eq(mint) {
            return true;
        }
    }
    false
}
