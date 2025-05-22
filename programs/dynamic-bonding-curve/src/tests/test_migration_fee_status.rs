use crate::state::{VirtualPool, CREATOR_MASK, PARTNER_MASK};

#[test]
fn test_migration_claim_fee_status() {
    let mut pool = VirtualPool::default();

    assert_eq!(pool.eligible_to_withdraw_migration_fee(PARTNER_MASK), true);
    assert_eq!(pool.eligible_to_withdraw_migration_fee(CREATOR_MASK), true);

    pool.update_withdraw_migration_fee(PARTNER_MASK);
    assert_eq!(pool.eligible_to_withdraw_migration_fee(PARTNER_MASK), false);
    assert_eq!(pool.eligible_to_withdraw_migration_fee(CREATOR_MASK), true);

    pool.update_withdraw_migration_fee(CREATOR_MASK);
    assert_eq!(pool.eligible_to_withdraw_migration_fee(PARTNER_MASK), false);
    assert_eq!(pool.eligible_to_withdraw_migration_fee(CREATOR_MASK), false);
}
