use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    constants::{seeds::POOL_AUTHORITY_PREFIX, treasury},
    state::{
        ClaimFeeOperator, Config, MeteoraDammMigrationMetadata, MigrationMeteoraDammProgress,
        VirtualPool,
    },
    token::transfer_from_pool,
    EvtProtocolWithdrawSurplus, PoolError,
};

/// Accounts for protocol withdraw surplus
#[event_cpi]
#[derive(Accounts)]
pub struct ProtocolWithdrawSurplusCtx<'info> {
    /// CHECK: pool authority
    #[account(seeds = [POOL_AUTHORITY_PREFIX.as_ref()], bump)]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(has_one = virtual_pool)]
    pub migration_metadata: AccountLoader<'info, MeteoraDammMigrationMetadata>,

    #[account(has_one = quote_mint)]
    pub config: AccountLoader<'info, Config>,

    #[account(
        mut,
        has_one = quote_vault,
        has_one = config,
    )]
    pub virtual_pool: AccountLoader<'info, VirtualPool>,

    /// The treasury quote token account
    #[account(
        mut,
        associated_token::authority = treasury::ID,
        associated_token::mint = quote_mint,
        associated_token::token_program = token_quote_program,
    )]
    pub token_quote_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The vault token account for quote token
    #[account(mut, token::token_program = token_quote_program, token::mint = quote_mint)]
    pub quote_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The mint of of token
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    /// Claim fee operator
    #[account(has_one = operator)]
    pub claim_fee_operator: AccountLoader<'info, ClaimFeeOperator>,

    /// Operator
    pub operator: Signer<'info>,

    /// Token b program
    pub token_quote_program: Interface<'info, TokenInterface>,
}

pub fn handle_protocol_withdraw_surplus(ctx: Context<ProtocolWithdrawSurplusCtx>) -> Result<()> {
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

    // Make sure protocol is not withdraw
    require!(
        pool.is_procotol_withdraw_surplus == 0,
        PoolError::SurplusHasBeenWithdraw
    );

    let protocol_surplus_amount = pool.get_protocol_surplus(config.migration_quote_threshold)?;

    transfer_from_pool(
        ctx.accounts.pool_authority.to_account_info(),
        &ctx.accounts.quote_mint,
        &ctx.accounts.quote_vault,
        &ctx.accounts.token_quote_account,
        &ctx.accounts.token_quote_program,
        protocol_surplus_amount,
        ctx.bumps.pool_authority,
    )?;

    emit_cpi!(EvtProtocolWithdrawSurplus {
        pool: ctx.accounts.virtual_pool.key(),
        surplus_amount: protocol_surplus_amount
    });

    Ok(())
}
