use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;
use locker::types::CreateVestingEscrowParameters;

use crate::{
    activation_handler::ActivationType,
    constants::{MAX_CURVE_POINT, MAX_SQRT_PRICE, MIN_SQRT_PRICE},
    params::{
        fee_parameters::PoolFeeParameters,
        liquidity_distribution::{
            get_base_token_for_swap, get_migration_base_token, get_migration_threshold_price,
            LiquidityDistributionParameters,
        },
    },
    safe_math::SafeMath,
    state::{
        CollectFeeMode, LockedVestingConfig, MigrationFeeOption, MigrationOption, PoolConfig,
        TokenType,
    },
    token::{get_token_program_flags, is_supported_quote_mint},
    EvtCreateConfig, PoolError,
};

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct ConfigParameters {
    pub pool_fees: PoolFeeParameters,
    pub collect_fee_mode: u8,
    pub migration_option: u8,
    pub activation_type: u8,
    pub token_type: u8,
    pub token_decimal: u8,
    pub partner_lp_percentage: u8,
    pub partner_locked_lp_percentage: u8,
    pub creator_lp_percentage: u8,
    pub creator_locked_lp_percentage: u8,
    pub migration_quote_threshold: u64,
    pub sqrt_start_price: u128,
    pub locked_vesting: LockedVestingParams,
    pub migration_fee_option: u8,
    pub token_supply: Option<TokenSupplyParams>,
    /// padding for future use
    pub padding: [u64; 8],
    pub curve: Vec<LiquidityDistributionParameters>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, PartialEq)]
pub struct TokenSupplyParams {
    /// pre migration token supply
    pub pre_migration_token_supply: u64,
    /// post migration token supply
    pub post_migration_token_supply: u64,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, PartialEq)]
pub struct LockedVestingParams {
    pub amount_per_period: u64,
    pub cliff_duration_from_migration_time: u64,
    pub frequency: u64,
    pub number_of_period: u64,
    pub cliff_unlock_amount: u64,
}

impl LockedVestingParams {
    pub fn to_locked_vesting_config(&self) -> LockedVestingConfig {
        LockedVestingConfig {
            amount_per_period: self.amount_per_period,
            cliff_duration_from_migration_time: self.cliff_duration_from_migration_time,
            frequency: self.frequency,
            number_of_period: self.number_of_period,
            cliff_unlock_amount: self.cliff_unlock_amount,
            ..Default::default()
        }
    }

    pub fn to_create_vesting_escrow_params(
        &self,
        finish_curve_timestamp: u64,
    ) -> Result<CreateVestingEscrowParameters> {
        let cliff_time =
            finish_curve_timestamp.safe_add(self.cliff_duration_from_migration_time)?;
        Ok(CreateVestingEscrowParameters {
            vesting_start_time: finish_curve_timestamp,
            cliff_time,
            frequency: self.frequency,
            cliff_unlock_amount: self.cliff_unlock_amount,
            amount_per_period: self.amount_per_period,
            number_of_period: self.number_of_period,
            update_recipient_mode: 1, // only creator
            cancel_mode: 1,           // only creator
        })
    }

    pub fn get_total_amount(&self) -> Result<u64> {
        let total_amount = self
            .cliff_unlock_amount
            .safe_add(self.amount_per_period.safe_mul(self.number_of_period)?)?;
        Ok(total_amount)
    }

    pub fn has_vesting(&self) -> bool {
        *self != LockedVestingParams::default()
    }
    pub fn validate(&self) -> Result<()> {
        if self.has_vesting() {
            let total_amount = self.get_total_amount()?;
            require!(
                self.frequency != 0 && total_amount != 0,
                PoolError::InvalidVestingParameters
            );
        }
        Ok(())
    }
}

impl ConfigParameters {
    pub fn validate<'info>(&self, quote_mint: &InterfaceAccount<'info, Mint>) -> Result<()> {
        // validate quote mint
        require!(
            is_supported_quote_mint(quote_mint)?,
            PoolError::InvalidQuoteMint
        );

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

        match migration_option_value {
            MigrationOption::MeteoraDamm => {
                require!(
                    token_type_value == TokenType::SplToken,
                    PoolError::InvalidTokenType
                );
                require!(
                    *quote_mint.to_account_info().owner == anchor_spl::token::Token::id(),
                    PoolError::InvalidQuoteMint
                );
            }
            MigrationOption::DammV2 => {
                // nothing to check
            }
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

        let sum_lp_percentage = self
            .partner_lp_percentage
            .safe_add(self.partner_locked_lp_percentage)?
            .safe_add(self.creator_lp_percentage)?
            .safe_add(self.creator_locked_lp_percentage)?;
        require!(sum_lp_percentage == 100, PoolError::InvalidFeePercentage);

        require!(
            self.migration_quote_threshold > 0,
            PoolError::InvalidQuoteThreshold
        );

        // validate vesting params
        self.locked_vesting.validate()?;

        // validate migrate fee option
        require!(
            MigrationFeeOption::try_from(self.migration_fee_option).is_ok(),
            PoolError::InvalidMigrationFeeOption
        );

        // validate price and liquidity
        require!(
            self.sqrt_start_price >= MIN_SQRT_PRICE && self.sqrt_start_price < MAX_SQRT_PRICE,
            PoolError::InvalidCurve
        );
        require!(
            self.curve.len() > 0 && self.curve.len() <= MAX_CURVE_POINT,
            PoolError::InvalidCurve
        );
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

        // the last price in curve must be max price
        require!(
            self.curve[self.curve.len() - 1].sqrt_price == MAX_SQRT_PRICE,
            PoolError::InvalidCurve
        );

        Ok(())
    }
}

#[event_cpi]
#[derive(Accounts)]
pub struct CreateConfigCtx<'info> {
    #[account(
        init,
        signer,
        payer = payer,
        space = 8 + PoolConfig::INIT_SPACE
    )]
    pub config: AccountLoader<'info, PoolConfig>,

    /// CHECK: fee_claimer
    pub fee_claimer: UncheckedAccount<'info>,
    /// CHECK: owner extra base token in case token is fixed supply
    pub leftover_receiver: UncheckedAccount<'info>,
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
    config_parameters.validate(&ctx.accounts.quote_mint)?;

    let ConfigParameters {
        pool_fees,
        collect_fee_mode,
        migration_option,
        activation_type,
        token_type,
        token_decimal,
        partner_lp_percentage,
        partner_locked_lp_percentage,
        creator_lp_percentage,
        creator_locked_lp_percentage,
        migration_quote_threshold,
        sqrt_start_price,
        locked_vesting,
        migration_fee_option,
        token_supply,
        curve,
        ..
    } = config_parameters;

    let sqrt_migration_price =
        get_migration_threshold_price(migration_quote_threshold, sqrt_start_price, &curve)?;

    let swap_base_amount_256 =
        get_base_token_for_swap(sqrt_start_price, sqrt_migration_price, &curve)?;
    let swap_base_amount: u64 = swap_base_amount_256
        .try_into()
        .map_err(|_| PoolError::TypeCastFailed)?;
    let swap_base_amount_buffer =
        PoolConfig::get_swap_amount_with_buffer(swap_base_amount, sqrt_start_price, &curve)?;

    let migration_base_amount = get_migration_base_token(
        migration_quote_threshold,
        sqrt_migration_price,
        MigrationOption::try_from(migration_option)
            .map_err(|_| PoolError::InvalidMigrationOption)?,
    )?;

    let minimum_base_supply_with_buffer = PoolConfig::get_total_token_supply(
        swap_base_amount_buffer,
        migration_base_amount,
        &locked_vesting,
    )?;

    let minimum_base_supply_without_buffer = PoolConfig::get_total_token_supply(
        swap_base_amount,
        migration_base_amount,
        &locked_vesting,
    )?;

    let (fixed_token_supply_flag, pre_migration_token_supply, post_migration_token_supply) =
        if let Some(TokenSupplyParams {
            pre_migration_token_supply,
            post_migration_token_supply,
        }) = token_supply
        {
            require!(
                ctx.accounts.leftover_receiver.key() != Pubkey::default(),
                PoolError::InvalidLeftoverAddress
            );
            require!(
                minimum_base_supply_without_buffer <= post_migration_token_supply
                    && post_migration_token_supply <= pre_migration_token_supply
                    && minimum_base_supply_with_buffer <= pre_migration_token_supply,
                PoolError::InvalidTokenSupply
            );
            (1, pre_migration_token_supply, post_migration_token_supply)
        } else {
            (0, 0, 0)
        };

    let mut config = ctx.accounts.config.load_init()?;
    config.init(
        &ctx.accounts.quote_mint.key(),
        ctx.accounts.fee_claimer.key,
        ctx.accounts.leftover_receiver.key,
        &pool_fees,
        collect_fee_mode,
        migration_option,
        activation_type,
        token_decimal,
        token_type,
        get_token_program_flags(&ctx.accounts.quote_mint).into(),
        partner_locked_lp_percentage,
        partner_lp_percentage,
        creator_locked_lp_percentage,
        creator_lp_percentage,
        &locked_vesting,
        migration_fee_option,
        swap_base_amount,
        migration_quote_threshold,
        migration_base_amount,
        sqrt_migration_price,
        sqrt_start_price,
        fixed_token_supply_flag,
        pre_migration_token_supply,
        post_migration_token_supply,
        &curve,
    );

    emit_cpi!(EvtCreateConfig {
        config: ctx.accounts.config.key(),
        fee_claimer: ctx.accounts.fee_claimer.key(),
        quote_mint: ctx.accounts.quote_mint.key(),
        owner: ctx.accounts.leftover_receiver.key(),
        pool_fees,
        collect_fee_mode,
        migration_option,
        activation_type,
        token_decimal,
        token_type,
        partner_locked_lp_percentage,
        partner_lp_percentage,
        creator_locked_lp_percentage,
        creator_lp_percentage,
        swap_base_amount,
        migration_quote_threshold,
        migration_base_amount,
        sqrt_start_price,
        fixed_token_supply_flag,
        pre_migration_token_supply,
        post_migration_token_supply,
        locked_vesting,
        migration_fee_option,
        curve
    });

    Ok(())
}
