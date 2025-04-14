use anchor_lang::prelude::*;

use crate::constants::seeds::DAMM_V2_METADATA_PREFIX;
use crate::state::MigrationOption;
use crate::state::PoolConfig;
use crate::state::VirtualPool;
use crate::EvtCreateDammV2MigrationMetadata;
use crate::PoolError;

use super::MeteoraDammV2Metadata;

#[event_cpi]
#[derive(Accounts)]
pub struct MigrationDammV2CreateMetadataCtx<'info> {
    #[account(has_one=config)]
    pub virtual_pool: AccountLoader<'info, VirtualPool>,

    pub config: AccountLoader<'info, PoolConfig>,

    #[account(
        init,
        payer = payer,
        seeds = [
            DAMM_V2_METADATA_PREFIX.as_ref(),
            virtual_pool.key().as_ref(),
        ],
        bump,
        space = 8 + MeteoraDammV2Metadata::INIT_SPACE
    )]
    pub migration_metadata: AccountLoader<'info, MeteoraDammV2Metadata>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_migration_damm_v2_create_metadata(
    ctx: Context<MigrationDammV2CreateMetadataCtx>,
) -> Result<()> {
    let virtual_pool = ctx.accounts.virtual_pool.load()?;
    let config = ctx.accounts.config.load()?;
    let migration_option = MigrationOption::try_from(config.migration_option)
        .map_err(|_| PoolError::InvalidMigrationOption)?;
    require!(
        migration_option == MigrationOption::DammV2,
        PoolError::InvalidMigrationOption
    );
    let mut migration_metadata = ctx.accounts.migration_metadata.load_init()?;
    migration_metadata.virtual_pool = ctx.accounts.virtual_pool.key();
    migration_metadata.pool_creator = virtual_pool.creator;
    migration_metadata.partner = config.fee_claimer;

    emit_cpi!(EvtCreateDammV2MigrationMetadata {
        virtual_pool: ctx.accounts.virtual_pool.key(),
    });

    Ok(())
}
