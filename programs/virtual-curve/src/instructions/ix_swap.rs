use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::EvtCurveComplete;
use crate::{
    activation_handler::get_current_point,
    constants::seeds::POOL_AUTHORITY_PREFIX,
    params::swap::TradeDirection,
    state::{CollectFeeMode, PoolConfig, VirtualPool},
    token::{calculate_transfer_fee_excluded_amount, transfer_from_pool, transfer_from_user},
    EvtSwap, PoolError,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SwapParameters {
    amount_in: u64,
    minimum_amount_out: u64,
}

#[event_cpi]
#[derive(Accounts)]
pub struct SwapCtx<'info> {
    /// CHECK: pool authority
    #[account(
        seeds = [
            POOL_AUTHORITY_PREFIX.as_ref(),
        ],
        bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    /// config key
    pub config: AccountLoader<'info, PoolConfig>,

    /// Pool account
    #[account(mut, has_one = base_vault, has_one = quote_vault, has_one = config)]
    pub pool: AccountLoader<'info, VirtualPool>,

    /// The user token account for input token
    #[account(mut)]
    pub input_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The user token account for output token
    #[account(mut)]
    pub output_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The vault token account for base token
    #[account(mut, token::token_program = token_base_program, token::mint = base_mint)]
    pub base_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The vault token account for quote token
    #[account(mut, token::token_program = token_quote_program, token::mint = quote_mint)]
    pub quote_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// The mint of base token
    pub base_mint: Box<InterfaceAccount<'info, Mint>>,

    /// The mint of quote token
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    /// The user performing the swap
    pub payer: Signer<'info>,

    /// Token base program
    pub token_base_program: Interface<'info, TokenInterface>,

    /// Token quote program
    pub token_quote_program: Interface<'info, TokenInterface>,

    /// referral token account
    #[account(mut)]
    pub referral_token_account: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
}

impl<'info> SwapCtx<'info> {
    /// Get the trading direction of the current swap. Eg: USDT -> USDC
    pub fn get_trade_direction(&self) -> TradeDirection {
        if self.input_token_account.mint == self.base_mint.key() {
            return TradeDirection::BasetoQuote;
        }
        TradeDirection::QuotetoBase
    }
}

// TODO impl swap exact out
pub fn handle_swap(ctx: Context<SwapCtx>, params: SwapParameters) -> Result<()> {
    let SwapParameters {
        amount_in,
        minimum_amount_out,
    } = params;

    let trade_direction = ctx.accounts.get_trade_direction();
    let (
        token_in_mint,
        token_out_mint,
        input_vault_account,
        output_vault_account,
        input_program,
        output_program,
    ) = match trade_direction {
        TradeDirection::BasetoQuote => (
            &ctx.accounts.base_mint,
            &ctx.accounts.quote_mint,
            &ctx.accounts.base_vault,
            &ctx.accounts.quote_vault,
            &ctx.accounts.token_base_program,
            &ctx.accounts.token_quote_program,
        ),
        TradeDirection::QuotetoBase => (
            &ctx.accounts.quote_mint,
            &ctx.accounts.base_mint,
            &ctx.accounts.quote_vault,
            &ctx.accounts.base_vault,
            &ctx.accounts.token_quote_program,
            &ctx.accounts.token_base_program,
        ),
    };

    let transfer_fee_excluded_amount_in =
        calculate_transfer_fee_excluded_amount(&token_in_mint, amount_in)?.amount;

    require!(transfer_fee_excluded_amount_in > 0, PoolError::AmountIsZero);

    let is_referral = ctx.accounts.referral_token_account.is_some();

    let config = ctx.accounts.config.load()?;
    let mut pool = ctx.accounts.pool.load_mut()?;

    // validate if it is over threshold
    require!(
        !pool.is_curve_complete(config.migration_quote_threshold),
        PoolError::PoolIsCompleted
    );

    // update for dynamic fee reference
    let current_timestamp = Clock::get()?.unix_timestamp as u64;
    pool.update_pre_swap(current_timestamp)?;

    let current_point = get_current_point(config.activation_type)?;

    let swap_result = pool.get_swap_result(
        &config,
        transfer_fee_excluded_amount_in,
        is_referral,
        trade_direction,
        current_point,
    )?;

    require!(
        swap_result.output_amount >= minimum_amount_out,
        PoolError::ExceededSlippage
    );

    pool.apply_swap_result(
        &config,
        transfer_fee_excluded_amount_in,
        &swap_result,
        trade_direction,
        current_timestamp,
    )?;

    // send to reserve
    transfer_from_user(
        &ctx.accounts.payer,
        token_in_mint,
        &ctx.accounts.input_token_account,
        &input_vault_account,
        input_program,
        amount_in,
    )?;
    // send to user
    transfer_from_pool(
        ctx.accounts.pool_authority.to_account_info(),
        &token_out_mint,
        &output_vault_account,
        &ctx.accounts.output_token_account,
        output_program,
        swap_result.output_amount,
        ctx.bumps.pool_authority,
    )?;
    // send to referral
    if is_referral {
        let collect_fee_mode = CollectFeeMode::try_from(config.collect_fee_mode)
            .map_err(|_| PoolError::InvalidCollectFeeMode)?;
        if collect_fee_mode == CollectFeeMode::OnlyB
            || trade_direction == TradeDirection::BasetoQuote
        {
            transfer_from_pool(
                ctx.accounts.pool_authority.to_account_info(),
                &ctx.accounts.quote_mint,
                &ctx.accounts.quote_vault,
                &ctx.accounts.referral_token_account.clone().unwrap(),
                &ctx.accounts.token_quote_program,
                swap_result.referral_fee,
                ctx.bumps.pool_authority,
            )?;
        } else {
            transfer_from_pool(
                ctx.accounts.pool_authority.to_account_info(),
                &ctx.accounts.base_mint,
                &ctx.accounts.base_vault,
                &ctx.accounts.referral_token_account.clone().unwrap(),
                &ctx.accounts.token_base_program,
                swap_result.referral_fee,
                ctx.bumps.pool_authority,
            )?;
        }
    }

    emit_cpi!(EvtSwap {
        pool: ctx.accounts.pool.key(),
        config: ctx.accounts.config.key(),
        trade_direction: trade_direction.into(),
        params,
        swap_result,
        is_referral,
        transfer_fee_excluded_amount_in,
        current_timestamp,
    });

    if pool.is_curve_complete(config.migration_quote_threshold) {
        emit_cpi!(EvtCurveComplete {
            pool: ctx.accounts.pool.key(),
            config: ctx.accounts.config.key(),
            base_reserve: pool.base_reserve,
            quote_reserve: pool.quote_reserve,
        })
    }

    Ok(())
}
