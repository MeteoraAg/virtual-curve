use anchor_lang::prelude::*;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use static_assertions::const_assert_eq;

#[repr(u8)]
#[derive(
    Clone,
    Copy,
    Debug,
    PartialEq,
    IntoPrimitive,
    TryFromPrimitive,
    AnchorDeserialize,
    AnchorSerialize,
)]
pub enum MigrationMeteoraDammProgress {
    Init,
    CreatedPool,
}

#[account(zero_copy)]
#[derive(InitSpace, Debug)]
pub struct MeteoraDammMigrationMetadata {
    /// operator
    pub virtual_pool: Pubkey,
    /// owner
    pub owner: Pubkey,
    /// partner
    pub partner: Pubkey,
    /// lp mint
    pub lp_mint: Pubkey,
    /// minted lp amount for creator
    pub lp_minted_amount_for_creator: u64,
    /// minted lp amount for partner
    pub lp_minted_amount_for_partner: u64,
    /// progress
    pub progress: u8,
    /// flag to check whether lp is locked for creator
    pub creator_locked_status: u8,
    /// flag to check whether lp is locked for partner
    pub partner_locked_status: u8,
    /// Reserve
    pub _padding: [u8; 125],
}
const_assert_eq!(MeteoraDammMigrationMetadata::INIT_SPACE, 272);

impl MeteoraDammMigrationMetadata {
    pub fn set_progress(&mut self, progress: u8) {
        self.progress = progress;
    }

    pub fn set_lp_minted(
        &mut self,
        lp_mint: Pubkey,
        lp_minted_amount_for_creator: u64,
        lp_minted_amount_for_partner: u64,
    ) {
        self.lp_mint = lp_mint;
        self.lp_minted_amount_for_creator = lp_minted_amount_for_creator;
        self.lp_minted_amount_for_partner = lp_minted_amount_for_partner;
    }

    pub fn set_creator_lock_status(&mut self) {
        self.creator_locked_status = 1;
    }

    pub fn set_partner_lock_status(&mut self) {
        self.partner_locked_status = 1;
    }

    pub fn is_creator_lp_locked(&self) -> bool {
        self.creator_locked_status == 1
    }

    pub fn is_partner_lp_locked(&self) -> bool {
        self.partner_locked_status == 1
    }
}
