use std::u64;

use crate::{constants::seeds::POOL_AUTHORITY_PREFIX, *};
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct MigrateMeteoraDammClaimLpTokenCtx<'info> {
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

    /// CHECK:
    #[account(
        mut,
        associated_token::mint = migration_metadata.load()?.lp_mint,
        associated_token::authority = pool_authority.key()
    )]
    pub source_token: Box<Account<'info, TokenAccount>>,

    /// CHECK: destination token account
    #[account(mut)]
    pub destination_token: UncheckedAccount<'info>,

    /// CHECK: signer
    pub sender: Signer<'info>,

    /// token_program
    pub token_program: Program<'info, Token>,
}

impl<'info> MigrateMeteoraDammClaimLpTokenCtx<'info> {
    fn transfer(&self, bump: u8, amount: u64) -> Result<()> {
        let pool_authority_seeds = pool_authority_seeds!(bump);

        transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                Transfer {
                    from: self.source_token.to_account_info(),
                    to: self.destination_token.to_account_info(),
                    authority: self.pool_authority.to_account_info(),
                },
                &[&pool_authority_seeds[..]],
            ),
            amount,
        )?;

        Ok(())
    }
}
pub fn handle_migrate_meteora_damm_partner_claim_lp_token<'info>(
    ctx: Context<'_, '_, '_, 'info, MigrateMeteoraDammClaimLpTokenCtx<'info>>,
) -> Result<()> {
    let mut migration_metadata = ctx.accounts.migration_metadata.load_mut()?;
    require!(
        !migration_metadata.is_partner_claim_lp(),
        PoolError::NotPermitToDoThisAction
    );
    require!(
        migration_metadata.partner_lp != 0,
        PoolError::NotPermitToDoThisAction
    );
    // check partner address
    require!(
        migration_metadata.partner.eq(ctx.accounts.sender.key),
        PoolError::InvalidPartnerAccount
    );

    let migration_progress = MigrationMeteoraDammProgress::try_from(migration_metadata.progress)
        .map_err(|_| PoolError::TypeCastFailed)?;

    require!(
        migration_progress == MigrationMeteoraDammProgress::CreatedPool,
        PoolError::NotPermitToDoThisAction
    );
    migration_metadata.set_partner_claim_status();
    ctx.accounts
        .transfer(ctx.bumps.pool_authority, migration_metadata.partner_lp)?;
    Ok(())
}
pub fn handle_migrate_meteora_damm_creator_claim_lp_token<'info>(
    ctx: Context<'_, '_, '_, 'info, MigrateMeteoraDammClaimLpTokenCtx<'info>>,
) -> Result<()> {
    let mut migration_metadata = ctx.accounts.migration_metadata.load_mut()?;
    require!(
        !migration_metadata.is_creator_claim_lp(),
        PoolError::NotPermitToDoThisAction
    );
    require!(
        migration_metadata.creator_lp != 0,
        PoolError::NotPermitToDoThisAction
    );
    // check creator address
    require!(
        migration_metadata.pool_creator.eq(ctx.accounts.sender.key),
        PoolError::InvalidPartnerAccount
    );

    let migration_progress = MigrationMeteoraDammProgress::try_from(migration_metadata.progress)
        .map_err(|_| PoolError::TypeCastFailed)?;

    require!(
        migration_progress == MigrationMeteoraDammProgress::CreatedPool,
        PoolError::NotPermitToDoThisAction
    );
    migration_metadata.set_creator_claim_status();
    ctx.accounts
        .transfer(ctx.bumps.pool_authority, migration_metadata.creator_lp)?;
    Ok(())
}
