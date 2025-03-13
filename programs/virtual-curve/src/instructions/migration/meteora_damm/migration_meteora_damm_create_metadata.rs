use anchor_lang::prelude::*;

use crate::state::{Config, MigrationMeteoraDammProgress};
use crate::{
    constants::seeds::METEORA_METADATA_PREFIX,
    state::{MeteoraDammMigrationMetadata, VirtualPool},
    EvtCreateMeteoraMigrationMetadata,
};

#[event_cpi]
#[derive(Accounts)]
pub struct MigrationMeteoraDammCreateMetadataCtx<'info> {
    #[account(has_one=config)]
    pub virtual_pool: AccountLoader<'info, VirtualPool>,

    pub config: AccountLoader<'info, Config>,

    #[account(
        init,
        payer = payer,
        seeds = [
            METEORA_METADATA_PREFIX.as_ref(),
            virtual_pool.key().as_ref(),
        ],
        bump,
        space = 8 + MeteoraDammMigrationMetadata::INIT_SPACE
    )]
    pub migration_metadata: AccountLoader<'info, MeteoraDammMigrationMetadata>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_migration_meteora_damm_create_metadata(
    ctx: Context<MigrationMeteoraDammCreateMetadataCtx>,
) -> Result<()> {
    let virtual_pool = ctx.accounts.virtual_pool.load()?;
    let config = ctx.accounts.config.load()?;
    let mut migration_metadata = ctx.accounts.migration_metadata.load_init()?;
    migration_metadata.virtual_pool = ctx.accounts.virtual_pool.key();
    migration_metadata.owner = virtual_pool.creator;
    migration_metadata.partner = config.fee_claimer;

    migration_metadata.set_progress(MigrationMeteoraDammProgress::Init.into());

    emit_cpi!(EvtCreateMeteoraMigrationMetadata {
        virtual_pool: ctx.accounts.virtual_pool.key(),
    });

    Ok(())
}
