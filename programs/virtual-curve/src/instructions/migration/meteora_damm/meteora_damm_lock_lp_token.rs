use std::u64;

use anchor_spl::token::{Token, TokenAccount};
use dynamic_amm::LockEscrow;
use crate::{constants::seeds::POOL_AUTHORITY_PREFIX, state::{MeteoraDammMigrationMetadata, MigrationMeteoraDammProgress}, *};

/// create lock escrow must be before that transaction
#[derive(Accounts)]
pub struct MigrateMeteoraDammLockLpTokenCtx<'info> {
    /// presale
    #[account(mut, has_one = lp_mint)]
    pub migration_metadata: AccountLoader<'info, MeteoraDammMigrationMetadata>,

    /// CHECK: presale authority
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

    /// CHECK: lp_mint
    pub lp_mint: UncheckedAccount<'info>,

    #[account(
        mut,
        has_one=pool,
        has_one=owner, 
    )]
    pub lock_escrow: Box<Account<'info, LockEscrow>>,

    /// CHECK: owner
    pub owner: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        mut,
        associated_token::mint = migration_metadata.load()?.lp_mint,
        associated_token::authority = pool_authority.key()
    )]
    pub source_tokens: Box<Account<'info, TokenAccount>>,

    /// CHECK:
    #[account(mut)]
    pub escrow_vault: UncheckedAccount<'info>,

    /// CHECK: amm_program
    #[account(address = dynamic_amm::ID)]
    pub amm_program: UncheckedAccount<'info>,

    /// CHECK: Vault account for token a. token a of the pool will be deposit / withdraw from this vault account.
    pub a_vault: UncheckedAccount<'info>,
    /// CHECK: Vault account for token b. token b of the pool will be deposit / withdraw from this vault account.
    pub b_vault: UncheckedAccount<'info>,
    /// CHECK: LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault.
    pub a_vault_lp: UncheckedAccount<'info>,
    /// CHECK: LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault.
    pub b_vault_lp: UncheckedAccount<'info>,
    /// CHECK: LP token mint of vault a
    pub a_vault_lp_mint: UncheckedAccount<'info>,
    /// CHECK: LP token mint of vault b
    pub b_vault_lp_mint: UncheckedAccount<'info>,

    /// token_program
    pub token_program: Program<'info, Token>,
}

impl<'info> MigrateMeteoraDammLockLpTokenCtx<'info> {
    fn lock(&self, bump: u8, max_amount: u64,) -> Result<()> {
        let pool_authority_seeds = pool_authority_seeds!(bump);

        dynamic_amm::cpi::lock(
            CpiContext::new_with_signer(
                self.amm_program.to_account_info(),
                dynamic_amm::cpi::accounts::Lock {
                    pool: self.pool.to_account_info(),
                    lp_mint: self.lp_mint.to_account_info(),
                    a_vault: self.a_vault.to_account_info(),
                    b_vault: self.b_vault.to_account_info(),
                    a_vault_lp_mint: self.a_vault_lp_mint.to_account_info(),
                    b_vault_lp_mint: self.b_vault_lp_mint.to_account_info(),
                    a_vault_lp: self.a_vault_lp.to_account_info(),
                    b_vault_lp: self.b_vault_lp.to_account_info(),
                    token_program: self.token_program.to_account_info(),
                    escrow_vault: self.escrow_vault.to_account_info(),
                    lock_escrow: self.lock_escrow.to_account_info(),
                    owner: self.pool_authority.to_account_info(),
                    source_tokens: self.source_tokens.to_account_info(),
                },
                &[&pool_authority_seeds[..]],
            ),
            max_amount,
        )?;

        Ok(())
    }
}
pub fn handle_migrate_meteora_damm_lock_lp_token_for_partner<'info>(
    ctx: Context<'_, '_, '_, 'info, MigrateMeteoraDammLockLpTokenCtx<'info>>,
) -> Result<()> {
    let mut migration_metadata = ctx.accounts.migration_metadata.load_mut()?;
    require!(!migration_metadata.is_partner_lp_locked(),   PoolError::NotPermitToDoThisAction);
    // check partner address
    require!(migration_metadata.partner.eq(ctx.accounts.owner.key), PoolError::InvalidPartnerAccount);

    let migration_progress = MigrationMeteoraDammProgress::try_from(migration_metadata.progress)
        .map_err(|_| PoolError::TypeCastFailed)?;
 
    require!(
        migration_progress == MigrationMeteoraDammProgress::CreatedPool,
        PoolError::NotPermitToDoThisAction
    );
    migration_metadata.set_partner_lock_status();
    ctx.accounts.lock(ctx.bumps.pool_authority, migration_metadata.lp_minted_amount_for_partner)?;
    Ok(())
}


pub fn handle_migrate_meteora_damm_lock_lp_token_for_creator<'info>(
    ctx: Context<'_, '_, '_, 'info, MigrateMeteoraDammLockLpTokenCtx<'info>>,
) -> Result<()> {
    let mut migration_metadata = ctx.accounts.migration_metadata.load_mut()?;
    require!(!migration_metadata.is_creator_lp_locked(),   PoolError::NotPermitToDoThisAction);
    // check partner address
    require!(migration_metadata.owner.eq(ctx.accounts.owner.key), PoolError::InvalidOwnerAccount);

    let migration_progress = MigrationMeteoraDammProgress::try_from(migration_metadata.progress)
        .map_err(|_| PoolError::TypeCastFailed)?;

    require!(
        migration_progress == MigrationMeteoraDammProgress::CreatedPool,
        PoolError::NotPermitToDoThisAction
    );

    migration_metadata.set_creator_lock_status();

    ctx.accounts.lock(ctx.bumps.pool_authority, migration_metadata.lp_minted_amount_for_creator)?;
    Ok(())
}
