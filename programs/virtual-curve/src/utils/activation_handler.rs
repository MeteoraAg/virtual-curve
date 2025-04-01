use anchor_lang::prelude::*;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use std::convert::TryFrom;

use crate::PoolError;

#[derive(
    Copy,
    Clone,
    Debug,
    PartialEq,
    Eq,
    AnchorSerialize,
    AnchorDeserialize,
    IntoPrimitive,
    TryFromPrimitive,
)]
#[repr(u8)]
/// Type of the activation
pub enum ActivationType {
    Slot,
    Timestamp,
}

pub fn get_current_point(activation_type: u8) -> Result<u64> {
    let activation_type =
        ActivationType::try_from(activation_type).map_err(|_| PoolError::InvalidActivationType)?;
    let current_point = match activation_type {
        ActivationType::Slot => Clock::get()?.slot,
        ActivationType::Timestamp => Clock::get()?.unix_timestamp as u64,
    };
    Ok(current_point)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_activation_type_conversion() {
        // Test ActivationType enum conversion
        assert_eq!(ActivationType::Slot as u8, 0);
        assert_eq!(ActivationType::Timestamp as u8, 1);

        assert_eq!(ActivationType::try_from(0).unwrap(), ActivationType::Slot);
        assert_eq!(
            ActivationType::try_from(1).unwrap(),
            ActivationType::Timestamp
        );
        assert!(ActivationType::try_from(2).is_err());
    }

    #[test]
    fn test_get_current_point_invalid_type() {
        // Test with invalid activation type
        let result = get_current_point(2); // Invalid type
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), PoolError::InvalidActivationType.into());
    }

    // Note: We cannot directly test get_current_point with slot/timestamp
    // as it requires access to the Clock sysvar which is not available in unit tests.
    // These tests should be done in integration tests or program tests instead.
}
