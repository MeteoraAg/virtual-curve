use crate::*;

/// Metadata for a partner.
#[account]
#[derive(Debug, Default)]
pub struct PartnerMetadata {
    /// fee claimer
    pub fee_claimer: Pubkey,
    /// padding for future use
    pub padding: [u128; 6],
    /// Name of partner.
    pub name: String,
    /// Website of partner.
    pub website: String,
    /// Logo of partner
    pub logo: String,
}

impl PartnerMetadata {
    /// Space that a [PartnerMetadata] takes up.
    pub fn space(metadata: &CreatePartnerMetadataParameters) -> usize {
        std::mem::size_of::<Pubkey>()
            + 16 * 6
            + 4
            + metadata.name.as_bytes().len()
            + 4
            + metadata.website.as_bytes().len()
            + 4
            + metadata.logo.as_bytes().len()
    }
}
