use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    const_pda,
    state::{MigrationFeeDistribution, PoolConfig, VirtualPool, CREATOR_MASK},
    token::transfer_from_pool,
    EvtCreatorWithdrawMigrationFee, PoolError,
};

/// Accounts for creator withdraw migration fee
#[event_cpi]
#[derive(Accounts)]
pub struct CreatorWithdrawMigrationFeeCtx<'info> {
    /// CHECK: pool authority
    #[account(
        address = const_pda::pool_authority::ID
    )]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(has_one = quote_mint)]
    pub config: AccountLoader<'info, PoolConfig>,

    #[account(
        mut,
        has_one = quote_vault,
        has_one = config,
        has_one = creator,
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

    pub creator: Signer<'info>,

    /// Token b program
    pub token_quote_program: Interface<'info, TokenInterface>,
}

pub fn handle_creator_withdraw_migration_fee(
    ctx: Context<CreatorWithdrawMigrationFeeCtx>,
) -> Result<()> {
    let config = ctx.accounts.config.load()?;
    let mut pool = ctx.accounts.virtual_pool.load_mut()?;

    // Make sure pool has been completed
    require!(
        pool.is_curve_complete(config.migration_quote_threshold),
        PoolError::NotPermitToDoThisAction
    );

    let mask = CREATOR_MASK;

    // Ensure the creator has never been withdrawn
    require!(
        pool.eligible_to_withdraw_migration_fee(mask),
        PoolError::MigrationFeeHasBeenWithdraw
    );

    let MigrationFeeDistribution { creator: fee, .. } = config.get_migration_fee_distribution()?;

    transfer_from_pool(
        ctx.accounts.pool_authority.to_account_info(),
        &ctx.accounts.quote_mint,
        &ctx.accounts.quote_vault,
        &ctx.accounts.token_quote_account,
        &ctx.accounts.token_quote_program,
        fee,
        const_pda::pool_authority::BUMP,
    )?;

    // update creator withdraw migration fee
    pool.update_withdraw_migration_fee(mask);

    emit_cpi!(EvtCreatorWithdrawMigrationFee {
        pool: ctx.accounts.virtual_pool.key(),
        fee
    });
    Ok(())
}
