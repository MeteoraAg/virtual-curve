use anchor_lang::prelude::*;

use crate::{
    state::{MigrationProgress, VirtualPool},
    EvtUpdatePoolCreator, PoolError,
};

/// Accounts for transfer pool creator
#[event_cpi]
#[derive(Accounts)]
pub struct TransferPoolCreatorCtx<'info> {
    #[account(
        mut,
        has_one = creator,
    )]
    pub virtual_pool: AccountLoader<'info, VirtualPool>,

    pub creator: Signer<'info>,

    /// CHECK: new creator address, can be anything except old creator
    #[account(
        constraint = new_creator.key().ne(creator.key) @ PoolError::InvalidNewCreator,
    )]
    pub new_creator: UncheckedAccount<'info>,
}

pub fn handle_transfer_pool_creator(ctx: Context<TransferPoolCreatorCtx>) -> Result<()> {
    let mut pool = ctx.accounts.virtual_pool.load_mut()?;

    let migration_progress = pool.get_migration_progress()?;
    // avoid pool creator to do update between 2 periods
    require!(
        migration_progress == MigrationProgress::PreBondingCurve
            || migration_progress == MigrationProgress::CreatedPool,
        PoolError::NotPermitToDoThisAction
    );

    pool.creator = ctx.accounts.new_creator.key();

    emit_cpi!(EvtUpdatePoolCreator {
        pool: ctx.accounts.virtual_pool.key(),
        creator: ctx.accounts.creator.key(),
        new_creator: ctx.accounts.new_creator.key(),
    });
    Ok(())
}
