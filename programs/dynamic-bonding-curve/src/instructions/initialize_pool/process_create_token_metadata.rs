use anchor_lang::prelude::*;
use mpl_token_metadata::types::DataV2;

use crate::state::TokenAuthorityOption;
pub struct ProcessCreateTokenMetadataParams<'a, 'info> {
    pub system_program: AccountInfo<'info>,
    pub payer: AccountInfo<'info>,
    pub pool_authority: AccountInfo<'info>,
    pub mint: AccountInfo<'info>,
    pub metadata_program: AccountInfo<'info>,
    pub mint_metadata: AccountInfo<'info>,
    pub creator: AccountInfo<'info>,
    pub name: &'a str,
    pub symbol: &'a str,
    pub uri: &'a str,
    pub pool_authority_bump: u8,
    pub token_authority: TokenAuthorityOption,
    pub partner: Pubkey,
}

pub fn process_create_token_metadata(params: ProcessCreateTokenMetadataParams) -> Result<()> {
    // create token metadata
    msg!("create token metadata");
    let seeds = pool_authority_seeds!(params.pool_authority_bump);
    let mut builder = mpl_token_metadata::instructions::CreateMetadataAccountV3CpiBuilder::new(
        &params.metadata_program,
    );

    let is_mutable = params.token_authority != TokenAuthorityOption::Immutable;

    builder.mint(&params.mint);
    builder.update_authority(&params.pool_authority, false);
    builder.mint_authority(&params.pool_authority);
    builder.metadata(&params.mint_metadata);
    builder.is_mutable(is_mutable);
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

    // update update_authority
    let token_update_authority = params
        .token_authority
        .get_update_authority(params.creator.key(), params.partner.key());

    let token_update_authority = token_update_authority.unwrap_or(params.system_program.key());

    let mut update_authority_builder =
        mpl_token_metadata::instructions::UpdateMetadataAccountV2CpiBuilder::new(
            &params.metadata_program,
        );
    update_authority_builder.metadata(&params.mint_metadata);
    update_authority_builder.update_authority(&params.pool_authority);
    update_authority_builder.new_update_authority(token_update_authority);
    update_authority_builder.invoke_signed(&[&seeds[..]])?;

    Ok(())
}
