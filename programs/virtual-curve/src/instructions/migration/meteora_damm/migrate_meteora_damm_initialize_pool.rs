use anchor_spl::token::{Burn, Token, TokenAccount};
use solana_program::{program::invoke, system_instruction};

use crate::{
    activation_handler::get_current_point,
    constants::seeds::POOL_AUTHORITY_PREFIX,
    safe_math::SafeMath,
    state::{
        Config, MeteoraDammMigrationMetadata, MigrationMeteoraDammProgress, MigrationOption,
        VirtualPool,
    },
    utils_math::safe_mul_div_cast_u64,
    *,
};

#[derive(Accounts)]
pub struct MigrateMeteoraDammCtx<'info> {
    /// virtual pool
    #[account(mut, has_one = base_vault, has_one = quote_vault, has_one = config)]
    pub virtual_pool: AccountLoader<'info, VirtualPool>,

    #[account(mut, has_one = virtual_pool)]
    pub migration_metadata: AccountLoader<'info, MeteoraDammMigrationMetadata>,

    pub config: AccountLoader<'info, Config>,

    /// CHECK: pool authority
    #[account(
            seeds = [
                POOL_AUTHORITY_PREFIX.as_ref(),
            ],
            bump,
        )]
    pub pool_authority: UncheckedAccount<'info>,

    /// CHECK: pool
    #[account(mut)]
    pub pool: UncheckedAccount<'info>,

    /// pool config
    pub damm_config: Box<Account<'info, dynamic_amm::Config>>,

    /// CHECK: lp_mint
    #[account(mut)]
    pub lp_mint: UncheckedAccount<'info>,

    /// CHECK: base token mint
    pub token_a_mint: UncheckedAccount<'info>, // match with vault.base_mint
    /// CHECK: quote token mint
    pub token_b_mint: UncheckedAccount<'info>, // match with vault.quote_mint

    /// CHECK: a vault
    #[account(mut)]
    pub a_vault: UncheckedAccount<'info>,
    /// CHECK: b vault
    #[account(mut)]
    pub b_vault: UncheckedAccount<'info>,
    /// CHECK: a token vault
    #[account(mut)]
    pub a_token_vault: UncheckedAccount<'info>,
    /// CHECK: b token vault
    #[account(mut)]
    pub b_token_vault: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: a vault lp mint
    pub a_vault_lp_mint: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: b vault lp mint
    pub b_vault_lp_mint: UncheckedAccount<'info>,
    /// CHECK: a vault lp
    #[account(mut)]
    pub a_vault_lp: UncheckedAccount<'info>,
    /// CHECK: b vault lp
    #[account(mut)]
    pub b_vault_lp: UncheckedAccount<'info>,
    /// CHECK: virtual pool token a
    #[account(mut)]
    pub base_vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: virtual pool token b
    #[account(mut)]
    pub quote_vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: virtual pool lp
    #[account(mut)]
    pub virtual_pool_lp: UncheckedAccount<'info>, // TODO check this address and validate

    /// CHECK: protocol token a fee
    #[account(mut)]
    pub protocol_token_a_fee: UncheckedAccount<'info>,
    /// CHECK: protocol token b fee
    #[account(mut)]
    pub protocol_token_b_fee: UncheckedAccount<'info>,
    /// CHECK: payer
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK:
    pub rent: UncheckedAccount<'info>,
    /// CHECK: mint_metadata
    #[account(mut)]
    pub mint_metadata: UncheckedAccount<'info>,

    /// CHECK: Metadata program
    pub metadata_program: UncheckedAccount<'info>,

    /// CHECK: amm_program
    #[account(address = dynamic_amm::ID)]
    pub amm_program: UncheckedAccount<'info>,

    /// CHECK: vault_program
    pub vault_program: UncheckedAccount<'info>,

    /// token_program
    pub token_program: Program<'info, Token>,

    /// CHECK: Associated token program.
    pub associated_token_program: UncheckedAccount<'info>,
    /// System program.
    pub system_program: Program<'info, System>,
}

impl<'info> MigrateMeteoraDammCtx<'info> {
    fn validate_config_key(&self) -> Result<()> {
        require!(
            self.damm_config.pool_creator_authority == self.pool_authority.key(),
            PoolError::InvalidConfigAccount
        );
        require!(
            self.damm_config.activation_type == 0,
            PoolError::InvalidConfigAccount
        );
        require!(
            self.damm_config.activation_duration == 0,
            PoolError::InvalidConfigAccount
        );
        require!(
            self.damm_config.partner_fee_numerator == 0,
            PoolError::InvalidConfigAccount
        );
        require!(
            self.damm_config.pool_fees.trade_fee_numerator == 1000, // 1%
            PoolError::InvalidConfigAccount
        );
        require!(
            self.damm_config.vault_config_key == Pubkey::default(),
            PoolError::InvalidConfigAccount
        );
        Ok(())
    }

    fn create_pool(
        &self,
        initial_base_amount: u64,
        initial_quote_amount: u64,
        activation_point: Option<u64>,
        bump: u8,
    ) -> Result<()> {
        let pool_authority_seeds = pool_authority_seeds!(bump);

        // Send some lamport to presale to pay rent fee?
        msg!("transfer lamport to pool_authority");
        invoke(
            &system_instruction::transfer(
                &self.payer.key(),
                &self.pool_authority.key(),
                50_000_000, // TODO calculate correct lamport here
            ),
            &[
                self.payer.to_account_info(),
                self.pool_authority.to_account_info(),
                self.system_program.to_account_info(),
            ],
        )?;

        // Vault authority create pool
        msg!("create pool");
        dynamic_amm::cpi::initialize_permissionless_constant_product_pool_with_config2(
            CpiContext::new_with_signer(
                self.amm_program.to_account_info(),
                dynamic_amm::cpi::accounts::InitializePermissionlessConstantProductPoolWithConfig2 {
                    pool: self.pool.to_account_info(),
                    config: self.damm_config.to_account_info(),
                    lp_mint: self.lp_mint.to_account_info(),
                    token_a_mint: self.token_a_mint.to_account_info(),
                    token_b_mint: self.token_b_mint.to_account_info(),
                    a_vault: self.a_vault.to_account_info(),
                    b_vault: self.b_vault.to_account_info(),
                    a_token_vault: self.a_token_vault.to_account_info(),
                    b_token_vault: self.b_token_vault.to_account_info(),
                    a_vault_lp_mint: self.a_vault_lp_mint.to_account_info(),
                    b_vault_lp_mint: self.b_vault_lp_mint.to_account_info(),
                    a_vault_lp: self.a_vault_lp.to_account_info(),
                    b_vault_lp: self.b_vault_lp.to_account_info(),
                    payer_token_a: self.base_vault.to_account_info(),
                    payer_token_b: self.quote_vault.to_account_info(),
                    payer_pool_lp: self.virtual_pool_lp.to_account_info(), // ? 
                    protocol_token_a_fee: self.protocol_token_a_fee.to_account_info(),
                    protocol_token_b_fee: self.protocol_token_b_fee.to_account_info(),
                    payer: self.pool_authority.to_account_info(),
                    rent: self.rent.to_account_info(),
                    metadata_program: self.metadata_program.to_account_info(),
                    mint_metadata: self.mint_metadata.to_account_info(),
                    vault_program: self.vault_program.to_account_info(),
                    token_program: self.token_program.to_account_info(),
                    associated_token_program: self.associated_token_program.to_account_info(),
                    system_program: self.system_program.to_account_info(),
                },
                &[&pool_authority_seeds[..]],
            ),
            initial_base_amount,
            initial_quote_amount,
            activation_point,
        )?;

        Ok(())
    }
}

pub fn handle_migrate_meteora_damm<'info>(
    ctx: Context<'_, '_, '_, 'info, MigrateMeteoraDammCtx<'info>>,
) -> Result<()> {
    ctx.accounts.validate_config_key()?;
    let mut migration_metadata = ctx.accounts.migration_metadata.load_mut()?;
    let migration_progress = MigrationMeteoraDammProgress::try_from(migration_metadata.progress)
        .map_err(|_| PoolError::TypeCastFailed)?;

    require!(
        migration_progress == MigrationMeteoraDammProgress::Init,
        PoolError::NotPermitToDoThisAction
    );

    let mut virtual_pool = ctx.accounts.virtual_pool.load_mut()?;

    let config = ctx.accounts.config.load()?;
    require!(
        virtual_pool.is_curve_complete(config.migration_quote_threshold),
        PoolError::PoolIsIncompleted
    );

    let migration_option = MigrationOption::try_from(config.migration_option)
        .map_err(|_| PoolError::InvalidMigrationOption)?;
    require!(
        migration_option == MigrationOption::MeteoraDamm,
        PoolError::InvalidMigrationOption
    );

    let base_reserve = config.migration_base_threshold;
    let quote_reserve = config.migration_quote_threshold;

    ctx.accounts.create_pool(
        base_reserve,
        quote_reserve,
        Some(get_current_point(config.activation_type)?),
        ctx.bumps.pool_authority,
    )?;

    virtual_pool.update_after_create_pool();

    // burn the rest of token in pool authority
    let left_base_token = ctx.accounts.base_vault.amount.safe_sub(base_reserve)?;
    if left_base_token > 0 {
        let seeds = pool_authority_seeds!(ctx.bumps.pool_authority);
        anchor_spl::token::burn(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.token_a_mint.to_account_info(),
                    from: ctx.accounts.base_vault.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                &[&seeds[..]],
            ),
            left_base_token,
        )?;
    }

    let lp_minted_amount = anchor_spl::token::accessor::amount(&ctx.accounts.virtual_pool_lp)?;

    let lp_minted_amount_for_creator = safe_mul_div_cast_u64(
        lp_minted_amount,
        config.creator_post_migration_fee_percentage.into(),
        100,
    )?;
    let lp_minted_amount_for_partner = lp_minted_amount.safe_sub(lp_minted_amount_for_creator)?;
    migration_metadata.set_lp_minted(
        ctx.accounts.lp_mint.key(),
        lp_minted_amount_for_creator,
        lp_minted_amount_for_partner,
    );
    migration_metadata.set_progress(MigrationMeteoraDammProgress::CreatedPool.into());

    // TODO emit event

    Ok(())
}
