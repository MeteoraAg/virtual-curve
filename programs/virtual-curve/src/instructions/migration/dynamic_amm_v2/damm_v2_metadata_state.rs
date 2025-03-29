use anchor_lang::prelude::*;
use num_enum::{IntoPrimitive, TryFromPrimitive};

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
pub enum MeteoraDammV2MetadataProgress {
    Init,
    CreatedPool,
}

#[account(zero_copy)]
#[derive(InitSpace, Debug)]
pub struct MeteoraDammV2Metadata {
    /// pool
    pub virtual_pool: Pubkey,
    /// pool creator
    pub pool_creator: Pubkey,
    /// partner
    pub partner: Pubkey,
    /// progress
    pub progress: u8,
    /// Reserve
    pub _padding: [u8; 125],
}
// TODO add assertion
// const_assert_eq!(MeteoraDammV2Metadata::INIT_SPACE, 272);

impl MeteoraDammV2Metadata {
    pub fn set_progress(&mut self, progress: u8) {
        self.progress = progress;
    }
}
