use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    constants::seeds::POOL_AUTHORITY_PREFIX,
    state::{Config, MeteoraDammMigrationMetadata, MigrationMeteoraDammProgress, VirtualPool},
    token::transfer_from_pool,
    EvtPartnerWithdrawSurplus, PoolError,
};

/// Accounts for partner to claim fees
#[event_cpi]
#[derive(Accounts)]
pub struct PartnerWithdrawSurplusCtx<'info> {
    /// CHECK: pool authority
    #[account(seeds = [POOL_AUTHORITY_PREFIX.as_ref()], bump)]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(has_one = virtual_pool)]
    pub migration_metadata: AccountLoader<'info, MeteoraDammMigrationMetadata>,

    #[account(has_one = quote_mint, has_one=fee_claimer)]
    pub config: AccountLoader<'info, Config>,

    #[account(
        mut,
        has_one = quote_vault,
        has_one = config,
    )]
    pub virtual_pool: AccountLoader<'info, VirtualPool>,

    /// The receiver token account
    #[account(mut)]
    pub token_quote_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The vault token account for output token
    #[account(mut, token::token_program = token_quote_program, token::mint = quote_mint)]
    pub quote_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The mint of quote token
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    pub fee_claimer: Signer<'info>,

    /// Token b program
    pub token_quote_program: Interface<'info, TokenInterface>,
}

pub fn handle_partner_withdraw_surplus(ctx: Context<PartnerWithdrawSurplusCtx>) -> Result<()> {
    let migration_metadata = ctx.accounts.migration_metadata.load()?;
    let config = ctx.accounts.config.load()?;
    let mut pool = ctx.accounts.virtual_pool.load_mut()?;

    let migration_progress = MigrationMeteoraDammProgress::try_from(migration_metadata.progress)
        .map_err(|_| PoolError::TypeCastFailed)?;

    // Make sure migrate pool has been created
    require!(
        migration_progress == MigrationMeteoraDammProgress::CreatedPool,
        PoolError::NotPermitToDoThisAction
    );

    // Ensure the partner has never been withdrawn
    require!(
        pool.is_procotol_withdraw_surplus == 0,
        PoolError::SurplusHasBeenWithdraw
    );

    let partner_surplus_amount = pool.get_partner_surplus(config.migration_quote_threshold)?;

    transfer_from_pool(
        ctx.accounts.pool_authority.to_account_info(),
        &ctx.accounts.quote_mint,
        &ctx.accounts.quote_vault,
        &ctx.accounts.token_quote_account,
        &ctx.accounts.token_quote_program,
        partner_surplus_amount,
        ctx.bumps.pool_authority,
    )?;

    emit_cpi!(EvtPartnerWithdrawSurplus {
        pool: ctx.accounts.virtual_pool.key(),
        surplus_amount: partner_surplus_amount
    });
    Ok(())
}
