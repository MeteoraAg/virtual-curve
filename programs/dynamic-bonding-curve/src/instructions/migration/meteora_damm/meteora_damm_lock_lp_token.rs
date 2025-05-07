use crate::{
    const_pda,
    state::{MigrationProgress, VirtualPool},
    *,
};
use anchor_spl::token::{Mint, Token, TokenAccount};
use dynamic_amm::accounts::LockEscrow;
use dynamic_amm::accounts::Pool;
use dynamic_vault::accounts::Vault;

/// create lock escrow must be before that transaction
#[derive(Accounts)]
pub struct MigrateMeteoraDammLockLpTokenCtx<'info> {
    pub virtual_pool: AccountLoader<'info, VirtualPool>,

    /// migration_metadata
    #[account(mut, has_one = lp_mint, has_one = virtual_pool)]
    pub migration_metadata: AccountLoader<'info, MeteoraDammMigrationMetadata>,

    /// CHECK: pool authority
    #[account(
        mut,
        address = const_pda::pool_authority::ID
    )]
    pub pool_authority: AccountInfo<'info>,

    /// CHECK: pool
    #[account(
        mut,
        has_one = lp_mint @ PoolError::InvalidMigrationAccounts,
        has_one = a_vault @ PoolError::InvalidMigrationAccounts,
        has_one = b_vault @ PoolError::InvalidMigrationAccounts,
        has_one = a_vault_lp @ PoolError::InvalidMigrationAccounts,
        has_one = b_vault_lp @ PoolError::InvalidMigrationAccounts,
    )]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: lp_mint
    pub lp_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        has_one = pool,
        has_one = owner,
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

    /// Vault account for token a. token a of the pool will be deposit / withdraw from this vault account.
    pub a_vault: Box<Account<'info, Vault>>,
    /// Vault account for token b. token b of the pool will be deposit / withdraw from this vault account.
    pub b_vault: Box<Account<'info, Vault>>,
    /// LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault.
    #[account(
        token::mint = a_vault_lp_mint.key()
    )]
    pub a_vault_lp: Box<Account<'info, TokenAccount>>,
    /// LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault.
    #[account(
        token::mint = b_vault_lp_mint.key()
    )]
    pub b_vault_lp: Box<Account<'info, TokenAccount>>,
    /// LP token mint of vault a
    pub a_vault_lp_mint: Box<Account<'info, Mint>>,
    /// LP token mint of vault b
    pub b_vault_lp_mint: Box<Account<'info, Mint>>,

    /// token_program
    pub token_program: Program<'info, Token>,
}

impl<'info> MigrateMeteoraDammLockLpTokenCtx<'info> {
    fn lock(&self, bump: u8, max_amount: u64) -> Result<()> {
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
pub fn handle_migrate_meteora_damm_lock_lp_token<'info>(
    ctx: Context<'_, '_, '_, 'info, MigrateMeteoraDammLockLpTokenCtx<'info>>,
) -> Result<()> {
    let virtual_pool = ctx.accounts.virtual_pool.load()?;

    require!(
        virtual_pool.get_migration_progress()? == MigrationProgress::CreatedPool,
        PoolError::NotPermitToDoThisAction
    );

    let mut migration_metadata = ctx.accounts.migration_metadata.load_mut()?;

    let is_partner = ctx.accounts.owner.key() == migration_metadata.partner;
    let is_creator = ctx.accounts.owner.key() == migration_metadata.pool_creator;

    let damm_migration_accounts = DammAccounts {
        lp_mint: &ctx.accounts.lp_mint,
        a_vault: &ctx.accounts.a_vault,
        b_vault: &ctx.accounts.b_vault,
        a_vault_lp: &ctx.accounts.a_vault_lp,
        b_vault_lp: &ctx.accounts.b_vault_lp,
        a_vault_lp_mint: &ctx.accounts.a_vault_lp_mint,
        b_vault_lp_mint: &ctx.accounts.b_vault_lp_mint,
    };

    let mut version_migration_metadata = migration_metadata.get_versioned_migration_metadata()?;

    let lp_to_lock = match (is_partner, is_creator) {
        (true, true) => version_migration_metadata
            .validate_and_lock_as_self_partnered_creator(damm_migration_accounts)?,
        (true, false) => {
            version_migration_metadata.validate_and_lock_as_partner(damm_migration_accounts)?
        }
        (false, true) => {
            version_migration_metadata.validate_and_lock_as_creator(damm_migration_accounts)?
        }
        (false, false) => return Err(PoolError::InvalidOwnerAccount.into()),
    };

    ctx.accounts
        .lock(const_pda::pool_authority::BUMP, lp_to_lock)
}
