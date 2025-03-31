use crate::{
    constants::{BASIS_POINT_MAX, BIN_STEP_BPS_U128_DEFAULT, ONE_Q64},
    state::fee::DynamicFeeStruct,
};

#[test]
fn test_bin_step_bps_u128() {
    let result = ONE_Q64.checked_div(BASIS_POINT_MAX.into()).unwrap();
    assert_eq!(result, BIN_STEP_BPS_U128_DEFAULT);
}

#[test]
fn test_delta_bin_id_basic() {
    let sqrt_price_a = 1_010_000_000u128; // 101.0
    let sqrt_price_b = 1_000_000_000u128; // 100.0
    let result =
        DynamicFeeStruct::get_delta_bin_id(BIN_STEP_BPS_U128_DEFAULT, sqrt_price_a, sqrt_price_b)
            .unwrap();

    // Assert exact match
    // 101.0 / 100 = 1.01 => delta = (1.01 - 1.0) / (1/10_000) = 0.01 / 0.0001 = 100
    assert_eq!(result, 200);
}

#[test]
fn test_delta_bin_id_zero_movement() {
    let sqrt_price = 1_000_000_000u128;

    let result =
        DynamicFeeStruct::get_delta_bin_id(BIN_STEP_BPS_U128_DEFAULT, sqrt_price, sqrt_price)
            .unwrap();
    assert_eq!(result, 0);
}

#[test]
fn test_delta_bin_id_small_movement() {
    let sqrt_price_a = 1_002_000_000u128;
    let sqrt_price_b = 1_000_000_000u128;

    let result =
        DynamicFeeStruct::get_delta_bin_id(BIN_STEP_BPS_U128_DEFAULT, sqrt_price_a, sqrt_price_b)
            .unwrap();
    // (1.002 - 1.000) = 0.002 → delta = (1.002 - 1.0) / (1/10_000) = 0.002 / 0.0001 = 20
    assert_eq!(result, 40)
}

#[test]
fn test_get_delta_bin_id_overflow() {
    //  overflow in price ratio calculation
    let sqrt_price_a = u128::MAX;
    let sqrt_price_b = 1u128;

    let result =
        DynamicFeeStruct::get_delta_bin_id(BIN_STEP_BPS_U128_DEFAULT, sqrt_price_a, sqrt_price_b);
    assert!(result.is_err());
}
