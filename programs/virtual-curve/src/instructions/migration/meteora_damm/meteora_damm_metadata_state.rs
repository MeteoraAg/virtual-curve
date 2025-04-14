use crate::state::LiquidityDistributionU64;
use anchor_lang::prelude::*;
use static_assertions::const_assert_eq;

#[account(zero_copy)]
#[derive(InitSpace, Debug)]
pub struct MeteoraDammMigrationMetadata {
    /// pool
    pub virtual_pool: Pubkey,
    /// pool creator
    pub pool_creator: Pubkey,
    /// partner
    pub partner: Pubkey,
    /// lp mint
    pub lp_mint: Pubkey,

    /// partner locked lp
    pub partner_locked_lp: u64,
    /// partner lp
    pub partner_lp: u64,
    /// creator locked lp
    pub creator_locked_lp: u64,
    /// creator lp
    pub creator_lp: u64,
    /// padding
    pub _padding_0: u8,
    /// flag to check whether lp is locked for creator
    pub creator_locked_status: u8,
    /// flag to check whether lp is locked for partner
    pub partner_locked_status: u8,
    /// flag to check whether creator has claimed lp token
    pub creator_claim_status: u8,
    /// flag to check whether partner has claimed lp token
    pub partner_claim_status: u8,
    /// Reserve
    pub _padding: [u8; 107],
}
const_assert_eq!(MeteoraDammMigrationMetadata::INIT_SPACE, 272);

impl MeteoraDammMigrationMetadata {
    pub fn set_lp_minted(&mut self, lp_mint: Pubkey, lp_distribution: &LiquidityDistributionU64) {
        self.lp_mint = lp_mint;
        let &LiquidityDistributionU64 {
            partner_locked_lp,
            partner_lp,
            creator_locked_lp,
            creator_lp,
        } = lp_distribution;
        self.partner_locked_lp = partner_locked_lp;
        self.partner_lp = partner_lp;
        self.creator_locked_lp = creator_locked_lp;
        self.creator_lp = creator_lp;
    }

    pub fn set_creator_lock_status(&mut self) {
        self.creator_locked_status = 1;
    }

    pub fn set_partner_lock_status(&mut self) {
        self.partner_locked_status = 1;
    }

    pub fn set_creator_claim_status(&mut self) {
        self.creator_claim_status = 1;
    }

    pub fn set_partner_claim_status(&mut self) {
        self.partner_claim_status = 1;
    }

    pub fn is_creator_lp_locked(&self) -> bool {
        self.creator_locked_status == 1
    }

    pub fn is_partner_lp_locked(&self) -> bool {
        self.partner_locked_status == 1
    }

    pub fn is_creator_claim_lp(&self) -> bool {
        self.creator_claim_status == 1
    }

    pub fn is_partner_claim_lp(&self) -> bool {
        self.partner_claim_status == 1
    }
}
