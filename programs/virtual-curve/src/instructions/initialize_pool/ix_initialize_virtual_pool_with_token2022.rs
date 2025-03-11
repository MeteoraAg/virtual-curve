use crate::{
    activation_handler::get_current_point,
    constants::seeds::{POOL_AUTHORITY_PREFIX, POOL_PREFIX, TOKEN_VAULT_PREFIX},
    state::{Config, PoolType, TokenType, VirtualPool},
    token::create_position_base_mint_with_extensions,
    EvtInitializePool, PoolError,
};
use anchor_lang::{
    prelude::*,
    system_program::{create_account, CreateAccount},
};
use anchor_spl::{
    token::TokenAccount as TokenAccountSpl,
    token_2022::{initialize_account3, mint_to, InitializeAccount3, MintTo, Token2022},
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use std::cmp::{max, min};

use super::InitializePoolParameters;

#[event_cpi]
#[derive(Accounts)]
pub struct InitializeVirtualPoolWithToken2022Ctx<'info> {
    /// Which config the pool belongs to.
    #[account(has_one = quote_mint)]
    pub config: AccountLoader<'info, Config>,

    /// CHECK: pool authority
    #[account(
        seeds = [
            POOL_AUTHORITY_PREFIX.as_ref(),
        ],
        bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    /// CHECK: Pool creator
    pub creator: UncheckedAccount<'info>,

    /// Unique token mint address, initialize in contract
    #[account(mut)]
    pub base_mint: Signer<'info>,

    #[account(
        mint::token_program = token_quote_program,
    )]
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

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
        space = 8 + VirtualPool::INIT_SPACE
    )]
    pub pool: AccountLoader<'info, VirtualPool>,

    /// CHECK: Token base vault for the pool
    #[account(
        mut,
        seeds = [
            TOKEN_VAULT_PREFIX.as_ref(),
            base_mint.key().as_ref(),
            pool.key().as_ref(),
        ],
        bump,
    )]
    pub base_vault: UncheckedAccount<'info>,

    /// Token quote vault for the pool
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
    pub quote_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Address paying to create the pool. Can be anyone
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Program to create mint account and mint tokens
    pub token_quote_program: Interface<'info, TokenInterface>,

    pub token_program: Program<'info, Token2022>,
    // Sysvar for program account
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_virtual_pool_with_token2022<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, InitializeVirtualPoolWithToken2022Ctx<'info>>,
    params: InitializePoolParameters,
) -> Result<()> {
    let config = ctx.accounts.config.load()?;
    let token_type_value =
        TokenType::try_from(config.token_type).map_err(|_| PoolError::InvalidTokenType)?;
    require!(
        token_type_value == TokenType::Token2022,
        PoolError::InvalidTokenType
    );

    let InitializePoolParameters { name, symbol, uri } = params;

    // create mint
    create_position_base_mint_with_extensions(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.base_mint.to_account_info(),
        ctx.accounts.pool_authority.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        &name,
        &symbol,
        &uri,
        ctx.bumps.pool_authority,
    )?;

    // create token account
    let pool_key = ctx.accounts.pool.key();
    let base_vault_seeds =
        base_vault_seeds!(ctx.accounts.base_mint.key, pool_key, ctx.bumps.base_vault);
    let space = TokenAccountSpl::LEN;
    let lamports = Rent::get()?.minimum_balance(space);
    create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            CreateAccount {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.base_vault.to_account_info(),
            },
            &[&base_vault_seeds[..]],
        ),
        lamports,
        space as u64,
        ctx.accounts.token_program.key,
    )?;

    // create user position nft account
    initialize_account3(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        InitializeAccount3 {
            account: ctx.accounts.base_vault.to_account_info(),
            mint: ctx.accounts.base_mint.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        },
        &[&base_vault_seeds[..]],
    ))?;

    let config = ctx.accounts.config.load()?;

    // mint token
    let seeds = pool_authority_seeds!(ctx.bumps.pool_authority);
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.base_mint.to_account_info(),
                to: ctx.accounts.base_vault.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&seeds[..]],
        ),
        config.get_initial_base_supply()?,
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
        PoolType::Token2022.into(),
        activation_point,
        config.get_initial_base_supply()?,
    );

    emit_cpi!(EvtInitializePool {
        pool: ctx.accounts.pool.key(),
        config: ctx.accounts.config.key(),
        creator: ctx.accounts.creator.key(),
        base_mint: ctx.accounts.base_mint.key(),
        pool_type: PoolType::Token2022.into(),
        activation_point,
    });
    Ok(())
}
