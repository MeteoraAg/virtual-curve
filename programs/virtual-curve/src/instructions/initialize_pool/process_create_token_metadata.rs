use anchor_lang::prelude::*;
use mpl_token_metadata::types::DataV2;
pub struct ProcessCreateTokenMetadataParams<'a, 'info> {
    pub system_program: AccountInfo<'info>,
    pub payer: AccountInfo<'info>,          // signer
    pub pool_authority: AccountInfo<'info>, // signer
    pub mint: AccountInfo<'info>,           // signer
    pub metadata_program: AccountInfo<'info>,
    pub mint_metadata: AccountInfo<'info>,
    pub creator: AccountInfo<'info>,
    pub name: &'a str,
    pub symbol: &'a str,
    pub uri: &'a str,
    pub pool_authority_bump: u8,
}

pub fn process_create_token_metadata(params: ProcessCreateTokenMetadataParams) -> Result<()> {
    // create token metadata
    msg!("create token metadata");
    let seeds = pool_authority_seeds!(params.pool_authority_bump);
    let mut builder = mpl_token_metadata::instructions::CreateMetadataAccountV3CpiBuilder::new(
        &params.metadata_program,
    );
    builder.mint(&params.mint);
    builder.mint_authority(&params.pool_authority);
    builder.metadata(&params.mint_metadata);
    builder.is_mutable(true);
    builder.update_authority(&params.creator, false);
    builder.payer(&params.payer);
    builder.system_program(&params.system_program);
    let data = DataV2 {
        collection: None,
        creators: None,
        name: params.name.to_string(),
        symbol: params.symbol.to_string(),
        seller_fee_basis_points: 0,
        uses: None,
        uri: params.uri.to_string(),
    };
    builder.data(data);

    builder.invoke_signed(&[&seeds[..]])?;

    // re-validate on local
    #[cfg(feature = "local")]
    {
        use crate::PoolError;
        let metadata = mpl_token_metadata::accounts::Metadata::safe_deserialize(
            &params.mint_metadata.try_borrow_data().unwrap(),
        )
        .unwrap();
        require!(
            metadata.update_authority == params.creator.key(),
            PoolError::InvalidParameters
        );
        require!(metadata.is_mutable, PoolError::InvalidParameters);
    }

    Ok(())
}
