use anchor_lang::prelude::*;
use mpl_token_metadata::types::DataV2;

use crate::state::TokenUpdateAuthorityOption;
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
    pub update_authority: TokenUpdateAuthorityOption,
    pub partner: Pubkey,
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
    let is_mutable = params.update_authority != TokenUpdateAuthorityOption::Immutable;
    builder.is_mutable(is_mutable);
    match params.update_authority {
        TokenUpdateAuthorityOption::Creator => {
            // temporarily use pool_authority as update authority firstly before transferring to partner
            builder.update_authority(&params.creator, false);
        }
        TokenUpdateAuthorityOption::Partner => {
            builder.update_authority(&params.pool_authority, false);
        }
        TokenUpdateAuthorityOption::Immutable => {
            builder.update_authority(&params.system_program, false);
        }
    }

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

    // update new update authority to partner
    if params.update_authority == TokenUpdateAuthorityOption::Partner {
        let mut update_authority_builder =
            mpl_token_metadata::instructions::UpdateMetadataAccountV2CpiBuilder::new(
                &params.metadata_program,
            );

        update_authority_builder.metadata(&params.mint_metadata);
        update_authority_builder.update_authority(&params.pool_authority);
        update_authority_builder.new_update_authority(params.partner);
        update_authority_builder.invoke_signed(&[&seeds[..]])?;
    }

    Ok(())
}
