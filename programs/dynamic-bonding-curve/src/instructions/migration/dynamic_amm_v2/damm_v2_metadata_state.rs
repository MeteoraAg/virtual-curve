use anchor_lang::prelude::*;
use static_assertions::const_assert_eq;

#[account(zero_copy)]
#[derive(InitSpace, Debug)]
pub struct MeteoraDammV2Metadata {
    /// pool
    pub virtual_pool: Pubkey,
    /// pool creator
    pub pool_creator: Pubkey,
    /// partner
    pub partner: Pubkey,
    /// Reserve
    pub _padding: [u8; 126],
}
// TODO add assertion
const_assert_eq!(MeteoraDammV2Metadata::INIT_SPACE, 222);
