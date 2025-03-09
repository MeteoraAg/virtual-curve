use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, MintTo, Token, TokenAccount},
    token_interface::{
        Mint as MintInterface, TokenAccount as TokenAccountInterface, TokenInterface,
    },
};
use std::cmp::{max, min};

use crate::{
    activation_handler::get_current_point,
    constants::seeds::{POOL_AUTHORITY_PREFIX, POOL_PREFIX, TOKEN_VAULT_PREFIX},
    process_create_token_metadata,
    state::{Config, Pool, PoolType},
    ProcessCreateTokenMetadataParams,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializePoolParameters {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

#[event_cpi]
#[derive(Accounts)]
pub struct InitializePoolWithSplTokenCtx<'info> {
    /// Which config the pool belongs to.
    #[account(has_one = quote_mint)]
    pub config: AccountLoader<'info, Config>,

    #[account(
        init,
        payer = payer,
        mint::decimals = config.load()?.token_decimal,
        mint::authority = pool_authority,
        mint::token_program = token_program,
    )]
    pub base_mint: Box<Account<'info, Mint>>,

    #[account(
        mint::token_program = token_quote_program,
    )]
    pub quote_mint: Box<InterfaceAccount<'info, MintInterface>>,

    /// Initialize an account to store the pool state
    #[account(
        init,
        seeds = [
            POOL_PREFIX.as_ref(),
            config.key().as_ref(),
            max(base_mint.key(), quote_mint.key()).as_ref(),
            min(base_mint.key(), quote_mint.key()).as_ref(),
        ],
        bump,
        payer = payer,
        space = 8 + Pool::INIT_SPACE
    )]
    pub pool: AccountLoader<'info, Pool>,

    /// CHECK: Pool creator
    pub creator: UncheckedAccount<'info>,

    /// Address paying to create the pool. Can be anyone
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: pool authority
    #[account(
        seeds = [
            POOL_AUTHORITY_PREFIX.as_ref(),
        ],
        bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    /// Token a vault for the pool
    #[account(
        init,
        seeds = [
            TOKEN_VAULT_PREFIX.as_ref(),
            base_mint.key().as_ref(),
            pool.key().as_ref(),
        ],
        token::mint = base_mint,
        token::authority = pool_authority,
        token::token_program = token_program,
        payer = payer,
        bump,
    )]
    pub base_vault: Box<Account<'info, TokenAccount>>,

    /// Token b vault for the pool
    #[account(
        init,
        seeds = [
            TOKEN_VAULT_PREFIX.as_ref(),
            quote_mint.key().as_ref(),
            pool.key().as_ref(),
        ],
        token::mint = quote_mint,
        token::authority = pool_authority,
        token::token_program = token_quote_program,
        payer = payer,
        bump,
    )]
    pub quote_vault: Box<InterfaceAccount<'info, TokenAccountInterface>>,

    /// Program to create mint account and mint tokens
    pub token_quote_program: Interface<'info, TokenInterface>,

    pub token_program: Program<'info, Token>,

    /// CHECK: mint_metadata
    #[account(mut)]
    pub mint_metadata: UncheckedAccount<'info>,

    /// CHECK: Metadata program
    #[account(address = mpl_token_metadata::ID)]
    pub metadata_program: UncheckedAccount<'info>,

    // Sysvar for program account
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_pool_with_spl_token<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, InitializePoolWithSplTokenCtx<'info>>,
    params: InitializePoolParameters,
) -> Result<()> {
    let InitializePoolParameters { name, symbol, uri } = params;

    // create token metadata
    process_create_token_metadata(ProcessCreateTokenMetadataParams {
        system_program: ctx.accounts.system_program.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        pool_authority: ctx.accounts.pool_authority.to_account_info(),
        mint: ctx.accounts.base_mint.to_account_info(),
        metadata_program: ctx.accounts.metadata_program.to_account_info(),
        mint_metadata: ctx.accounts.mint_metadata.to_account_info(),
        name: &name,
        symbol: &symbol,
        uri: &uri,
        pool_authority_bump: ctx.bumps.pool_authority,
    })?;

    let config = ctx.accounts.config.load()?;

    // mint token
    let seeds = pool_authority_seeds!(ctx.bumps.pool_authority);
    anchor_spl::token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.base_mint.to_account_info(),
                to: ctx.accounts.base_vault.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&seeds[..]],
        ),
        config.total_supply,
    )?;

    // init pool
    let mut pool = ctx.accounts.pool.load_init()?;

    let activation_point = get_current_point(config.activation_type)?;

    pool.initialize(
        config.pool_fees.to_pool_fees_struct(),
        ctx.accounts.config.key(),
        ctx.accounts.creator.key(),
        ctx.accounts.base_mint.key(),
        ctx.accounts.base_vault.key(),
        ctx.accounts.quote_vault.key(),
        config.sqrt_start_price,
        PoolType::SplToken.into(),
        activation_point,
    );

    // TODO emit event
    Ok(())
}
