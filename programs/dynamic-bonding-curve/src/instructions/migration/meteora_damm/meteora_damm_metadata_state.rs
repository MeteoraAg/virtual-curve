use crate::{
    safe_math::SafeMath, state::LiquidityDistributionU64, utils_math::safe_mul_div_cast_u128,
    PoolError,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use dynamic_vault::accounts::Vault;
use num::Zero;
use static_assertions::const_assert_eq;

use super::utils::{
    damm_utils::{calculate_constant_product_virtual_price, BASE_VIRTUAL_PRICE},
    vault_utils::get_amount_by_share,
};

use num_enum::{FromPrimitive, IntoPrimitive};

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, IntoPrimitive, FromPrimitive)]
enum Version {
    V0,
    #[default]
    V1,
}

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
    /// Version
    pub version: u8,
    /// flag to check whether lp is locked for creator
    pub creator_locked_status: u8,
    /// flag to check whether lp is locked for partner
    pub partner_locked_status: u8,
    /// flag to check whether creator has claimed lp token
    pub creator_claim_status: u8,
    /// flag to check whether partner has claimed lp token
    pub partner_claim_status: u8,
    pub _padding_1: [u8; 3],
    /// actual creator locked lp
    pub actual_creator_locked_lp: u64,
    /// actual partner locked lp
    pub actual_partner_locked_lp: u64,
    /// Reserve
    pub _padding: [u8; 88],
}
const_assert_eq!(MeteoraDammMigrationMetadata::INIT_SPACE, 272);

struct MigrationMetadataV1<'a> {
    inner: &'a mut MeteoraDammMigrationMetadata,
}

impl<'a> MigrationMetadataImplementation<'a> for MigrationMetadataV1<'a> {
    fn validate_and_lock_as_creator(&mut self, _accounts: DammAccounts<'_, '_>) -> Result<u64> {
        self.inner.common_validate_creator_lock_lp_action()?;
        self.inner.set_creator_lock_status();
        Ok(self.inner.creator_locked_lp)
    }

    fn validate_and_lock_as_partner(&mut self, _accounts: DammAccounts<'_, '_>) -> Result<u64> {
        self.inner.common_validate_partner_lock_lp_action()?;
        self.inner.set_partner_lock_status();
        Ok(self.inner.partner_locked_lp)
    }

    fn validate_and_lock_as_self_partnered_creator(
        &mut self,
        _accounts: DammAccounts<'_, '_>,
    ) -> Result<u64> {
        self.inner
            .common_validate_self_partnered_creator_lock_lp_action()?;
        self.inner.set_creator_lock_status();
        self.inner.set_partner_lock_status();
        let total_lp_to_lock = self
            .inner
            .creator_locked_lp
            .safe_add(self.inner.partner_locked_lp)?;
        Ok(total_lp_to_lock)
    }

    fn validate_and_claim_as_self_partnered_creator(&mut self) -> Result<u64> {
        self.inner
            .common_validate_self_partnered_creator_claim_lp_action()?;
        self.inner.set_creator_claim_status();
        self.inner.set_partner_claim_status();
        let total_lp_to_claim = self.inner.creator_lp.safe_add(self.inner.partner_lp)?;
        require!(total_lp_to_claim != 0, PoolError::NotPermitToDoThisAction);
        Ok(total_lp_to_claim)
    }

    fn validate_and_claim_as_creator(&mut self) -> Result<u64> {
        self.inner.common_validate_creator_claim_lp_action()?;
        self.inner.set_creator_claim_status();
        let total_lp_to_claim = self.inner.creator_lp;
        require!(total_lp_to_claim != 0, PoolError::NotPermitToDoThisAction);
        Ok(total_lp_to_claim)
    }

    fn validate_and_claim_as_partner(&mut self) -> Result<u64> {
        self.inner.common_validate_partner_claim_lp_action()?;
        self.inner.set_partner_claim_status();
        let total_lp_to_claim = self.inner.partner_lp;
        require!(total_lp_to_claim != 0, PoolError::NotPermitToDoThisAction);
        Ok(total_lp_to_claim)
    }
}

struct MigrationMetadataV2<'a> {
    inner: &'a mut MeteoraDammMigrationMetadata,
}

impl<'a> MigrationMetadataImplementation<'a> for MigrationMetadataV2<'a> {
    fn validate_and_lock_as_creator(&mut self, accounts: DammAccounts<'_, '_>) -> Result<u64> {
        self.inner.common_validate_creator_lock_lp_action()?;
        self.inner.set_creator_lock_status();
        let actual_lock_amount = exclude_fee_lp_amount(self.inner.creator_locked_lp, accounts)?;
        self.inner.actual_creator_locked_lp = actual_lock_amount;
        Ok(actual_lock_amount)
    }

    fn validate_and_lock_as_partner(&mut self, accounts: DammAccounts<'_, '_>) -> Result<u64> {
        self.inner.common_validate_partner_lock_lp_action()?;
        self.inner.set_partner_lock_status();
        let actual_lock_amount = exclude_fee_lp_amount(self.inner.partner_locked_lp, accounts)?;
        self.inner.actual_partner_locked_lp = actual_lock_amount;
        Ok(actual_lock_amount)
    }

    fn validate_and_lock_as_self_partnered_creator(
        &mut self,
        accounts: DammAccounts<'_, '_>,
    ) -> Result<u64> {
        self.inner
            .common_validate_self_partnered_creator_lock_lp_action()?;

        self.inner.set_creator_lock_status();
        self.inner.set_partner_lock_status();

        let total_lp_to_lock = self
            .inner
            .creator_locked_lp
            .safe_add(self.inner.partner_locked_lp)?;

        // We still set lock status to true even amount is 0
        if total_lp_to_lock.is_zero() {
            return Ok(0);
        }

        let actual_lock_amount = exclude_fee_lp_amount(total_lp_to_lock, accounts)?;

        self.inner.actual_partner_locked_lp = actual_lock_amount
            .safe_mul(self.inner.partner_locked_lp)?
            .safe_div(total_lp_to_lock)?;

        self.inner.actual_creator_locked_lp =
            actual_lock_amount.safe_sub(self.inner.actual_partner_locked_lp)?;

        Ok(actual_lock_amount)
    }

    fn validate_and_claim_as_self_partnered_creator(&mut self) -> Result<u64> {
        self.inner
            .common_validate_self_partnered_creator_claim_lp_action()?;

        let total_lp_to_lock = self
            .inner
            .creator_locked_lp
            .safe_add(self.inner.partner_locked_lp)?;

        let eligible_to_claim = self.inner.is_creator_lp_locked()
            && self.inner.is_partner_lp_locked()
            || total_lp_to_lock.is_zero();

        // Must lock first to know actual locked lp amount
        require!(eligible_to_claim, PoolError::NotPermitToDoThisAction);

        self.inner.set_creator_claim_status();
        self.inner.set_partner_claim_status();

        let suppose_lp_to_claim = self.inner.creator_lp.safe_add(self.inner.partner_lp)?;

        let suppose_total_locked_lp = self
            .inner
            .creator_locked_lp
            .safe_add(self.inner.partner_locked_lp)?;

        let actual_total_locked_lp = self
            .inner
            .actual_creator_locked_lp
            .safe_add(self.inner.actual_partner_locked_lp)?;

        let non_locked_fee_lp_to_claim =
            suppose_total_locked_lp.safe_sub(actual_total_locked_lp)?;

        let actual_lp_to_claim = suppose_lp_to_claim.safe_add(non_locked_fee_lp_to_claim)?;

        require!(actual_lp_to_claim != 0, PoolError::NotPermitToDoThisAction);

        Ok(actual_lp_to_claim)
    }

    fn validate_and_claim_as_creator(&mut self) -> Result<u64> {
        self.inner.common_validate_creator_claim_lp_action()?;

        let eligible_to_claim =
            self.inner.is_creator_lp_locked() || self.inner.creator_locked_lp.is_zero();

        // Must lock first to know actual locked lp amount
        require!(eligible_to_claim, PoolError::NotPermitToDoThisAction);

        self.inner.set_creator_claim_status();

        let non_locked_fee_lp_to_claim = self
            .inner
            .creator_locked_lp
            .safe_sub(self.inner.actual_creator_locked_lp)?;

        let actual_lp_to_claim = self.inner.creator_lp.safe_add(non_locked_fee_lp_to_claim)?;

        require!(actual_lp_to_claim != 0, PoolError::NotPermitToDoThisAction);

        Ok(actual_lp_to_claim)
    }

    fn validate_and_claim_as_partner(&mut self) -> Result<u64> {
        self.inner.common_validate_partner_claim_lp_action()?;

        let eligible_to_claim =
            self.inner.is_partner_lp_locked() || self.inner.partner_locked_lp.is_zero();

        // Must lock first to know actual locked lp amount
        require!(eligible_to_claim, PoolError::NotPermitToDoThisAction);

        self.inner.set_partner_claim_status();

        let non_locked_fee_lp_to_claim = self
            .inner
            .partner_locked_lp
            .safe_sub(self.inner.actual_partner_locked_lp)?;

        let actual_lp_to_claim = self.inner.partner_lp.safe_add(non_locked_fee_lp_to_claim)?;

        require!(actual_lp_to_claim != 0, PoolError::NotPermitToDoThisAction);

        Ok(actual_lp_to_claim)
    }
}

pub trait MigrationMetadataImplementation<'a> {
    fn validate_and_lock_as_creator(&mut self, accounts: DammAccounts<'_, '_>) -> Result<u64>;
    fn validate_and_lock_as_partner(&mut self, accounts: DammAccounts<'_, '_>) -> Result<u64>;
    fn validate_and_lock_as_self_partnered_creator(
        &mut self,
        accounts: DammAccounts<'_, '_>,
    ) -> Result<u64>;
    fn validate_and_claim_as_self_partnered_creator(&mut self) -> Result<u64>;
    fn validate_and_claim_as_creator(&mut self) -> Result<u64>;
    fn validate_and_claim_as_partner(&mut self) -> Result<u64>;
}

impl MeteoraDammMigrationMetadata {
    pub fn get_versioned_migration_metadata<'a>(
        &'a mut self,
    ) -> Result<Box<dyn MigrationMetadataImplementation<'a> + 'a>> {
        let versioned_migration_metadata: Box<dyn MigrationMetadataImplementation<'a> + 'a> =
            match Version::from(self.version) {
                Version::V0 => Box::new(MigrationMetadataV1 { inner: self }),
                Version::V1 => Box::new(MigrationMetadataV2 { inner: self }),
                #[allow(unreachable_patterns)]
                _ => unreachable!("Invalid migration metadata version"),
            };

        Ok(versioned_migration_metadata)
    }

    pub fn initialize(&mut self, virtual_pool: Pubkey, creator: Pubkey, partner: Pubkey) {
        self.virtual_pool = virtual_pool;
        self.pool_creator = creator;
        self.partner = partner;
        self.version = Version::V1.into();
    }

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

    fn common_validate_creator_lock_lp_action(&self) -> Result<()> {
        require!(
            !self.is_creator_lp_locked(),
            PoolError::NotPermitToDoThisAction
        );
        require!(
            self.creator_locked_lp != 0,
            PoolError::NotPermitToDoThisAction
        );

        Ok(())
    }

    fn common_validate_partner_lock_lp_action(&self) -> Result<()> {
        require!(
            !self.is_partner_lp_locked(),
            PoolError::NotPermitToDoThisAction
        );
        require!(
            self.partner_locked_lp != 0,
            PoolError::NotPermitToDoThisAction
        );

        Ok(())
    }

    fn common_validate_self_partnered_creator_lock_lp_action(&self) -> Result<()> {
        require!(
            !self.is_creator_lp_locked() && !self.is_partner_lp_locked(),
            PoolError::NotPermitToDoThisAction
        );
        require!(
            self.creator_locked_lp != 0 || self.partner_locked_lp != 0,
            PoolError::NotPermitToDoThisAction
        );

        Ok(())
    }

    fn common_validate_creator_claim_lp_action(&self) -> Result<()> {
        require!(
            !self.is_creator_claim_lp(),
            PoolError::NotPermitToDoThisAction
        );

        Ok(())
    }

    fn common_validate_self_partnered_creator_claim_lp_action(&self) -> Result<()> {
        require!(
            !self.is_creator_claim_lp() && !self.is_partner_claim_lp(),
            PoolError::NotPermitToDoThisAction
        );

        Ok(())
    }

    fn common_validate_partner_claim_lp_action(&self) -> Result<()> {
        require!(
            !self.is_partner_claim_lp(),
            PoolError::NotPermitToDoThisAction
        );

        Ok(())
    }

    fn set_partner_lock_status(&mut self) {
        self.partner_locked_status = 1;
    }

    fn set_creator_claim_status(&mut self) {
        self.creator_claim_status = 1;
    }

    fn set_partner_claim_status(&mut self) {
        self.partner_claim_status = 1;
    }

    fn set_creator_lock_status(&mut self) {
        self.creator_locked_status = 1;
    }

    fn is_creator_lp_locked(&self) -> bool {
        self.creator_locked_status == 1
    }

    fn is_partner_lp_locked(&self) -> bool {
        self.partner_locked_status == 1
    }

    fn is_creator_claim_lp(&self) -> bool {
        self.creator_claim_status == 1
    }

    fn is_partner_claim_lp(&self) -> bool {
        self.partner_claim_status == 1
    }
}

pub struct DammAccounts<'c, 'info> {
    pub lp_mint: &'c Account<'info, Mint>,
    pub a_vault: &'c Account<'info, Vault>,
    pub b_vault: &'c Account<'info, Vault>,
    pub a_vault_lp: &'c Account<'info, TokenAccount>,
    pub b_vault_lp: &'c Account<'info, TokenAccount>,
    pub a_vault_lp_mint: &'c Account<'info, Mint>,
    pub b_vault_lp_mint: &'c Account<'info, Mint>,
}

fn get_damm_virtual_price(accounts: DammAccounts<'_, '_>) -> Result<u128> {
    let DammAccounts {
        lp_mint,
        a_vault,
        b_vault,
        a_vault_lp,
        b_vault_lp,
        a_vault_lp_mint,
        b_vault_lp_mint,
        ..
    } = accounts;

    let current_time: u64 = Clock::get()?
        .unix_timestamp
        .try_into()
        .map_err(|_| PoolError::MathOverflow)?;

    let token_a_amount = get_amount_by_share(
        current_time,
        &a_vault,
        a_vault_lp.amount,
        a_vault_lp_mint.supply,
    )
    .ok_or_else(|| PoolError::MathOverflow)?;

    let token_b_amount = get_amount_by_share(
        current_time,
        &b_vault,
        b_vault_lp.amount,
        b_vault_lp_mint.supply,
    )
    .ok_or_else(|| PoolError::MathOverflow)?;

    let vp =
        calculate_constant_product_virtual_price(token_a_amount, token_b_amount, lp_mint.supply)
            .ok_or_else(|| PoolError::MathOverflow)?;

    Ok(vp)
}

fn exclude_fee_lp_amount(lp_to_lock: u64, accounts: DammAccounts<'_, '_>) -> Result<u64> {
    let vp = get_damm_virtual_price(accounts)?;

    let vp_delta = vp.safe_sub(BASE_VIRTUAL_PRICE)?;

    let fee_lp_amount = safe_mul_div_cast_u128(lp_to_lock.into(), vp_delta, vp)?
        .try_into()
        .map_err(|_| PoolError::MathOverflow)?;

    Ok(lp_to_lock.safe_sub(fee_lp_amount)?)
}
