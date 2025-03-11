use std::u64;

use anchor_spl::token::{Token, TokenAccount};
use dynamic_amm::{ LockEscrow};
use crate::{constants::seeds::POOL_AUTHORITY_PREFIX, state::{MeteoraDammMigrationMetadata, MigrationMeteoraDammProgress}, *};

/// create lock escrow must be before that transaction
#[derive(Accounts)]
pub struct MigrateMeteoraDammLockLpTokenCtx<'info> {
    /// presale
    #[account(mut, has_one = lp_mint, has_one = owner)]
    pub migration_medata: AccountLoader<'info, MeteoraDammMigrationMetadata>,

    /// CHECK: presale authority
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
        associated_token::mint = migration_medata.load()?.lp_mint,
        associated_token::authority = pool_authority.key()
    )]
    pub source_tokens: Box<Account<'info, TokenAccount>>,

    /// CHECK:
    #[account(mut)]
    pub escrow_vault: UncheckedAccount<'info>,

    /// token_program
    pub token_program: Program<'info, Token>,

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
}

impl<'info> MigrateMeteoraDammLockLpTokenCtx<'info> {
    fn lock(&self, bump: u8) -> Result<()> {
        let pool_authority_seeds = pool_authority_seeds!(bump);

        msg!("lock");
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
            u64::MAX,
        )?;

        Ok(())
    }
}
pub fn handle_migrate_meteora_damm_lock_lp_token<'info>(
    ctx: Context<'_, '_, '_, 'info, MigrateMeteoraDammLockLpTokenCtx<'info>>,
) -> Result<()> {
    let mut migration_medata = ctx.accounts.migration_medata.load_mut()?;
    let migration_progress = MigrationMeteoraDammProgress::try_from(migration_medata.progress)
        .map_err(|_| PoolError::TypeCastFailed)?;

    require!(
        migration_progress == MigrationMeteoraDammProgress::CreatedPool,
        PoolError::NotPermitToDoThisAction
    );

    migration_medata.set_progress(MigrationMeteoraDammProgress::LockLp.into());


    ctx.accounts.lock(ctx.bumps.pool_authority)?;
    Ok(())
}
