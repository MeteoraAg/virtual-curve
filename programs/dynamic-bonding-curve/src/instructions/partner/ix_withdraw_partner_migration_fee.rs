use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    const_pda,
    state::{MigrationFeeDistribution, PoolConfig, VirtualPool, PARTNER_MASK},
    token::transfer_from_pool,
    EvtPartnerWithdrawMigrationFee, PoolError,
};

/// Accounts for partner withdraw migration fee
#[event_cpi]
#[derive(Accounts)]
pub struct PartnerWithdrawMigrationFeeCtx<'info> {
    /// CHECK: pool authority
    #[account(
        address = const_pda::pool_authority::ID
    )]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(has_one = quote_mint, has_one = fee_claimer)]
    pub config: AccountLoader<'info, PoolConfig>,

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

pub fn handle_partner_withdraw_migration_fee(
    ctx: Context<PartnerWithdrawMigrationFeeCtx>,
) -> Result<()> {
    let config = ctx.accounts.config.load()?;
    let mut pool = ctx.accounts.virtual_pool.load_mut()?;

    // Make sure pool has been completed
    require!(
        pool.is_curve_complete(config.migration_quote_threshold),
        PoolError::NotPermitToDoThisAction
    );

    let mask = PARTNER_MASK;

    // Ensure the partner has never been withdrawn
    require!(
        pool.eligible_to_withdraw_migration_fee(mask),
        PoolError::MigrationFeeHasBeenWithdraw
    );

    let MigrationFeeDistribution { partner: fee, .. } = config.get_migration_fee_distribution()?;

    transfer_from_pool(
        ctx.accounts.pool_authority.to_account_info(),
        &ctx.accounts.quote_mint,
        &ctx.accounts.quote_vault,
        &ctx.accounts.token_quote_account,
        &ctx.accounts.token_quote_program,
        fee,
        const_pda::pool_authority::BUMP,
    )?;

    // update partner withdraw migration fee
    pool.update_withdraw_migration_fee(mask);

    emit_cpi!(EvtPartnerWithdrawMigrationFee {
        pool: ctx.accounts.virtual_pool.key(),
        fee
    });
    Ok(())
}
