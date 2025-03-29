use std::u64;

use anchor_lang::solana_program::{program::invoke, system_instruction};
use anchor_spl::{
    token_2022::{set_authority, spl_token_2022::instruction::AuthorityType, SetAuthority},
    token_interface::{TokenAccount, TokenInterface},
};
use damm_v2::types::{AddLiquidityParameters, InitializePoolParameters};

use crate::{
    activation_handler::get_current_point,
    constants::{seeds::POOL_AUTHORITY_PREFIX, MAX_SQRT_PRICE, MIN_SQRT_PRICE},
    curve::get_initial_liquidity_from_delta_quote,
    safe_math::SafeMath,
    state::{MigrationOption, PoolConfig, VirtualPool},
    *,
};

#[derive(Accounts)]
pub struct MigrateDammV2Ctx<'info> {
    /// virtual pool
    #[account(mut, has_one = base_vault, has_one = quote_vault, has_one = config)]
    pub virtual_pool: AccountLoader<'info, VirtualPool>,

    /// migration metadata
    #[account(mut, has_one = virtual_pool)]
    pub migration_metadata: AccountLoader<'info, MeteoraDammV2Metadata>,

    /// virtual pool config key
    pub config: AccountLoader<'info, PoolConfig>,

    /// CHECK: pool authority
    #[account(
        mut,
            seeds = [
                POOL_AUTHORITY_PREFIX.as_ref(),
            ],
            bump,
        )]
    pub pool_authority: UncheckedAccount<'info>,

    /// CHECK: pool
    #[account(mut)]
    pub pool: UncheckedAccount<'info>,

    // CHECK: damm-v2 config key
    // pub damm_config: AccountLoader<'info, damm_v2::accounts::Config>,
    /// CHECK: position nft mint for partner
    #[account(mut)]
    pub first_position_nft_mint: UncheckedAccount<'info>,

    /// CHECK: position nft account for partner
    #[account(mut)]
    pub first_position_nft_account: UncheckedAccount<'info>,

    /// CHECK:
    #[account(mut)]
    pub first_position: UncheckedAccount<'info>,

    /// CHECK: position nft mint for owner
    #[account(mut, constraint = first_position_nft_mint.key().ne(&second_position_nft_mint.key()))]
    pub second_position_nft_mint: Option<UncheckedAccount<'info>>,

    /// CHECK: position nft account for owner
    #[account(mut)]
    pub second_position_nft_account: Option<UncheckedAccount<'info>>,

    /// CHECK:
    #[account(mut)]
    pub second_position: Option<UncheckedAccount<'info>>,

    /// CHECK: damm pool authority
    pub damm_pool_authority: UncheckedAccount<'info>,

    /// CHECK:
    #[account(address = damm_v2::ID)]
    pub amm_program: UncheckedAccount<'info>,

    /// CHECK: base token mint
    #[account(mut)]
    pub base_mint: UncheckedAccount<'info>,
    /// CHECK: quote token mint
    #[account(mut)]
    pub quote_mint: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub token_a_vault: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub token_b_vault: UncheckedAccount<'info>,
    /// CHECK: base_vault
    #[account(
        mut,
        token::mint = base_mint,
        token::token_program = token_base_program
    )]
    pub base_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: quote vault
    #[account(
        mut,
        token::mint = quote_mint,
        token::token_program = token_quote_program
    )]
    pub quote_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: payer
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: token_program
    pub token_base_program: Interface<'info, TokenInterface>,
    /// CHECK: token_program
    pub token_quote_program: Interface<'info, TokenInterface>,
    /// CHECK: token_program
    pub token_2022_program: Interface<'info, TokenInterface>,
    /// CHECK: damm event authority
    pub damm_event_auhthority: UncheckedAccount<'info>,
    /// System program.
    pub system_program: Program<'info, System>,
}

impl<'info> MigrateDammV2Ctx<'info> {
    fn validate_config_key(&self, damm_config: &damm_v2::accounts::Config) -> Result<()> {
        require!(
            damm_config.pool_creator_authority == self.pool_authority.key(),
            PoolError::InvalidConfigAccount
        );
        require!(
            damm_config.activation_type == self.config.load()?.activation_type,
            PoolError::InvalidConfigAccount
        );
        require!(
            damm_config.pool_fees.partner_fee_percent == 0,
            PoolError::InvalidConfigAccount
        );

        require!(
            damm_config.sqrt_min_price == MIN_SQRT_PRICE,
            PoolError::InvalidConfigAccount
        );

        require!(
            damm_config.sqrt_max_price == MAX_SQRT_PRICE,
            PoolError::InvalidConfigAccount
        );

        require!(
            damm_config.vault_config_key == Pubkey::default(),
            PoolError::InvalidConfigAccount
        );
        Ok(())
    }

    fn create_pool(
        &self,
        pool_config: AccountInfo<'info>,
        liquidity: u128,
        sqrt_price: u128,
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

        damm_v2::cpi::initialize_pool(
            CpiContext::new_with_signer(
                self.amm_program.to_account_info(),
                damm_v2::cpi::accounts::InitializePool {
                    creator: self.pool_authority.to_account_info(),
                    position_nft_mint: self.first_position_nft_mint.to_account_info(),
                    position_nft_account: self.first_position_nft_account.to_account_info(),
                    payer: self.pool_authority.to_account_info(),
                    config: pool_config.to_account_info(),
                    pool_authority: self.damm_pool_authority.to_account_info(),
                    pool: self.pool.to_account_info(),
                    position: self.first_position.to_account_info(),
                    token_a_mint: self.base_mint.to_account_info(),
                    token_b_mint: self.quote_mint.to_account_info(),
                    token_a_vault: self.token_a_vault.to_account_info(),
                    token_b_vault: self.token_b_vault.to_account_info(),
                    payer_token_a: self.base_vault.to_account_info(),
                    payer_token_b: self.quote_vault.to_account_info(),
                    token_a_program: self.token_base_program.to_account_info(),
                    token_b_program: self.token_quote_program.to_account_info(),
                    token_2022_program: self.token_2022_program.to_account_info(),
                    system_program: self.system_program.to_account_info(),
                    event_authority: self.damm_event_auhthority.to_account_info(),
                    program: self.amm_program.to_account_info(),
                },
                &[&pool_authority_seeds[..]],
            ),
            InitializePoolParameters {
                liquidity,
                sqrt_price,
                activation_point,
            },
        )?;

        Ok(())
    }

    fn lock_permanent_liquidity_for_first_position(
        &self,
        permanent_lock_liquidity: u128,
        bump: u8,
    ) -> Result<()> {
        let pool_authority_seeds = pool_authority_seeds!(bump);
        damm_v2::cpi::permanent_lock_position(
            CpiContext::new_with_signer(
                self.amm_program.to_account_info(),
                damm_v2::cpi::accounts::PermanentLockPosition {
                    pool: self.pool.to_account_info(),
                    position: self.first_position.to_account_info(),
                    position_nft_account: self.first_position_nft_account.to_account_info(),
                    owner: self.pool_authority.to_account_info(),
                    event_authority: self.damm_event_auhthority.to_account_info(),
                    program: self.amm_program.to_account_info(),
                },
                &[&pool_authority_seeds[..]],
            ),
            permanent_lock_liquidity,
        )?;
        Ok(())
    }

    fn set_authority_for_first_position(&self, new_authority: Pubkey, bump: u8) -> Result<()> {
        let pool_authority_seeds = pool_authority_seeds!(bump);
        set_authority(
            CpiContext::new_with_signer(
                self.token_2022_program.to_account_info(),
                SetAuthority {
                    current_authority: self.pool_authority.to_account_info(),
                    account_or_mint: self.first_position_nft_account.to_account_info(),
                },
                &[&pool_authority_seeds[..]],
            ),
            AuthorityType::AccountOwner,
            Some(new_authority),
        )?;
        Ok(())
    }
    fn create_second_position(
        &self,
        owner: Pubkey,
        liquidity: u128,
        locked_liquidity: u128,
        bump: u8,
    ) -> Result<()> {
        let pool_authority_seeds = pool_authority_seeds!(bump);
        msg!("create position");
        damm_v2::cpi::create_position(CpiContext::new_with_signer(
            self.amm_program.to_account_info(),
            damm_v2::cpi::accounts::CreatePosition {
                owner: self.pool_authority.to_account_info(),
                pool: self.pool.to_account_info(),
                position_nft_mint: self
                    .second_position_nft_mint
                    .clone()
                    .unwrap()
                    .to_account_info(),
                position_nft_account: self
                    .second_position_nft_account
                    .clone()
                    .unwrap()
                    .to_account_info(),
                position: self.second_position.clone().unwrap().to_account_info(),
                pool_authority: self.damm_pool_authority.to_account_info(),
                payer: self.payer.to_account_info(),
                token_program: self.token_2022_program.to_account_info(),
                system_program: self.system_program.to_account_info(),
                event_authority: self.damm_event_auhthority.to_account_info(),
                program: self.amm_program.to_account_info(),
            },
            &[&pool_authority_seeds[..]],
        ))?;

        msg!("add liquidity");
        let total_liquidity = liquidity.safe_add(locked_liquidity)?;
        damm_v2::cpi::add_liquidity(
            CpiContext::new_with_signer(
                self.amm_program.to_account_info(),
                damm_v2::cpi::accounts::AddLiquidity {
                    pool: self.pool.to_account_info(),
                    position: self.second_position.clone().unwrap().to_account_info(),
                    token_a_account: self.base_vault.to_account_info(),
                    token_b_account: self.quote_vault.to_account_info(),
                    token_a_vault: self.token_a_vault.to_account_info(),
                    token_b_vault: self.token_b_vault.to_account_info(),
                    token_a_mint: self.base_mint.to_account_info(),
                    token_b_mint: self.quote_mint.to_account_info(),
                    position_nft_account: self
                        .second_position_nft_account
                        .clone()
                        .unwrap()
                        .to_account_info(),
                    owner: self.pool_authority.to_account_info(),
                    token_a_program: self.token_base_program.to_account_info(),
                    token_b_program: self.token_quote_program.to_account_info(),
                    event_authority: self.damm_event_auhthority.to_account_info(),
                    program: self.amm_program.to_account_info(),
                },
                &[&pool_authority_seeds[..]],
            ),
            AddLiquidityParameters {
                liquidity_delta: total_liquidity,
                token_a_amount_threshold: u64::MAX, // TODO should we take care for that
                token_b_amount_threshold: u64::MAX,
            },
        )?;

        if locked_liquidity > 0 {
            msg!("lock liquidity");
            damm_v2::cpi::permanent_lock_position(
                CpiContext::new_with_signer(
                    self.amm_program.to_account_info(),
                    damm_v2::cpi::accounts::PermanentLockPosition {
                        pool: self.pool.to_account_info(),
                        position: self.second_position.clone().unwrap().to_account_info(),
                        position_nft_account: self
                            .second_position_nft_account
                            .clone()
                            .unwrap()
                            .to_account_info(),
                        owner: self.pool_authority.to_account_info(),
                        event_authority: self.damm_event_auhthority.to_account_info(),
                        program: self.amm_program.to_account_info(),
                    },
                    &[&pool_authority_seeds[..]],
                ),
                locked_liquidity,
            )?;
        }

        msg!("set authority");
        set_authority(
            CpiContext::new_with_signer(
                self.token_2022_program.to_account_info(),
                SetAuthority {
                    current_authority: self.pool_authority.to_account_info(),
                    account_or_mint: self
                        .second_position_nft_account
                        .clone()
                        .unwrap()
                        .to_account_info(),
                },
                &[&pool_authority_seeds[..]],
            ),
            AuthorityType::AccountOwner,
            Some(owner),
        )?;

        Ok(())
    }
}

pub fn handle_migrate_damm_v2<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, MigrateDammV2Ctx<'info>>,
) -> Result<()> {
    {
        require!(
            ctx.remaining_accounts.len() == 1,
            PoolError::MissingPoolConfigInRemaningAccount
        );
        let damm_config_loader: AccountLoader<'_, damm_v2::accounts::Config> =
            AccountLoader::try_from(&ctx.remaining_accounts[0])?; // TODO fix damm config in remaning accounts
        let damm_config = damm_config_loader.load()?;
        ctx.accounts.validate_config_key(&damm_config)?;
    }

    let mut migration_metadata = ctx.accounts.migration_metadata.load_mut()?;
    let migration_progress = MeteoraDammV2MetadataProgress::try_from(migration_metadata.progress)
        .map_err(|_| PoolError::TypeCastFailed)?;

    require!(
        migration_progress == MeteoraDammV2MetadataProgress::Init,
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
        migration_option == MigrationOption::DammV2,
        PoolError::InvalidMigrationOption
    );
    let migration_sqrt_price = config.migration_sqrt_price;
    let quote_reserve = config.migration_quote_threshold;

    // calculate liquidity
    let liquidity = get_initial_liquidity_from_delta_quote(
        quote_reserve,
        MIN_SQRT_PRICE,
        migration_sqrt_price,
    )?;

    let liquidity_distribution = config.get_liquidity_distribution(liquidity)?;

    let partner_liquidity = liquidity_distribution
        .partner_locked_lp
        .safe_add(liquidity_distribution.partner_lp)?;
    let creator_liquidity = liquidity_distribution
        .creator_lp
        .safe_add(liquidity_distribution.creator_locked_lp)?;

    if partner_liquidity > creator_liquidity {
        // create pool
        msg!("create pool");
        ctx.accounts.create_pool(
            ctx.remaining_accounts[0].clone(),
            partner_liquidity,
            config.migration_sqrt_price,
            Some(get_current_point(config.activation_type)?),
            ctx.bumps.pool_authority,
        )?;

        // lock permanent liquidity
        if liquidity_distribution.partner_locked_lp > 0 {
            msg!("lock permanent liquidity for partner");
            ctx.accounts.lock_permanent_liquidity_for_first_position(
                liquidity_distribution.partner_locked_lp,
                ctx.bumps.pool_authority,
            )?;
        }

        // transfer to partner
        msg!("set position account nft to partner");
        ctx.accounts.set_authority_for_first_position(
            migration_metadata.partner,
            ctx.bumps.pool_authority,
        )?;

        if creator_liquidity > 0 {
            msg!("create a new position for creator");
            ctx.accounts.create_second_position(
                migration_metadata.pool_creator,
                liquidity_distribution.creator_lp,
                liquidity_distribution.creator_locked_lp,
                ctx.bumps.pool_authority,
            )?;
        }
    } else {
        // create pool
        msg!("create pool");
        ctx.accounts.create_pool(
            ctx.remaining_accounts[0].clone(),
            creator_liquidity,
            config.migration_sqrt_price,
            Some(get_current_point(config.activation_type)?),
            ctx.bumps.pool_authority,
        )?;

        // lock permanent liquidity
        if liquidity_distribution.creator_locked_lp > 0 {
            msg!("lock permanent liquidity for creator");
            ctx.accounts.lock_permanent_liquidity_for_first_position(
                liquidity_distribution.creator_locked_lp,
                ctx.bumps.pool_authority,
            )?;
        }

        // transfer to partner
        msg!("set position account nft to creator");
        ctx.accounts.set_authority_for_first_position(
            migration_metadata.pool_creator,
            ctx.bumps.pool_authority,
        )?;

        if partner_liquidity > 0 {
            msg!("create a new position for partner");
            ctx.accounts.create_second_position(
                migration_metadata.partner,
                liquidity_distribution.partner_lp,
                liquidity_distribution.partner_locked_lp,
                ctx.bumps.pool_authority,
            )?;
        }
    }

    virtual_pool.update_after_create_pool();

    // burn the rest of token in pool authority after migrated amount and fee
    ctx.accounts.base_vault.reload()?;
    let left_base_token = ctx
        .accounts
        .base_vault
        .amount
        .safe_sub(virtual_pool.get_protocol_and_partner_base_fee()?)?;

    if left_base_token > 0 {
        let seeds = pool_authority_seeds!(ctx.bumps.pool_authority);
        anchor_spl::token_interface::burn(
            CpiContext::new_with_signer(
                ctx.accounts.token_base_program.to_account_info(),
                anchor_spl::token_interface::Burn {
                    mint: ctx.accounts.base_mint.to_account_info(),
                    from: ctx.accounts.base_vault.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                &[&seeds[..]],
            ),
            left_base_token,
        )?;
    }

    migration_metadata.set_progress(MigrationMeteoraDammProgress::CreatedPool.into());

    // TODO emit event

    Ok(())
}
