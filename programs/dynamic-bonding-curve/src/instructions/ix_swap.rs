use crate::math::safe_math::SafeMath;
use crate::state::MigrationProgress;
use crate::EvtCurveComplete;
use crate::{
    activation_handler::get_current_point,
    const_pda,
    params::swap::TradeDirection,
    state::fee::FeeMode,
    state::{PoolConfig, VirtualPool},
    token::{transfer_from_pool, transfer_from_user},
    EvtSwap, PoolError,
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

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
        address = const_pda::pool_authority::ID,
    )]
    pub pool_authority: AccountInfo<'info>,

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
            return TradeDirection::BaseToQuote;
        }
        TradeDirection::QuoteToBase
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
        TradeDirection::BaseToQuote => (
            &ctx.accounts.base_mint,
            &ctx.accounts.quote_mint,
            &ctx.accounts.base_vault,
            &ctx.accounts.quote_vault,
            &ctx.accounts.token_base_program,
            &ctx.accounts.token_quote_program,
        ),
        TradeDirection::QuoteToBase => (
            &ctx.accounts.quote_mint,
            &ctx.accounts.base_mint,
            &ctx.accounts.quote_vault,
            &ctx.accounts.base_vault,
            &ctx.accounts.token_quote_program,
            &ctx.accounts.token_base_program,
        ),
    };

    require!(amount_in > 0, PoolError::AmountIsZero);

    let has_referral = ctx.accounts.referral_token_account.is_some();

    let config = ctx.accounts.config.load()?;
    let mut pool = ctx.accounts.pool.load_mut()?;

    // validate if it is over threshold
    require!(
        !pool.is_curve_complete(config.migration_quote_threshold),
        PoolError::PoolIsCompleted
    );

    // update for dynamic fee reference
    let current_timestamp = Clock::get()?.unix_timestamp as u64;
    pool.update_pre_swap(&config, current_timestamp)?;

    let current_point = get_current_point(config.activation_type)?;
    let fee_mode = &FeeMode::get_fee_mode(config.collect_fee_mode, trade_direction, has_referral)?;

    let swap_result =
        pool.get_swap_result(&config, amount_in, fee_mode, trade_direction, current_point)?;

    require!(
        swap_result.output_amount >= minimum_amount_out,
        PoolError::ExceededSlippage
    );

    pool.apply_swap_result(
        &config,
        &swap_result,
        fee_mode,
        trade_direction,
        current_timestamp,
    )?;

    // send to reserve
    transfer_from_user(
        &ctx.accounts.payer,
        token_in_mint,
        &ctx.accounts.input_token_account,
        input_vault_account,
        input_program,
        amount_in,
    )?;

    // send to user
    transfer_from_pool(
        ctx.accounts.pool_authority.to_account_info(),
        token_out_mint,
        output_vault_account,
        &ctx.accounts.output_token_account,
        output_program,
        swap_result.output_amount,
        const_pda::pool_authority::BUMP,
    )?;

    // send to referral
    if let Some(referral_token_account) = ctx.accounts.referral_token_account.as_ref() {
        if fee_mode.fees_on_base_token {
            transfer_from_pool(
                ctx.accounts.pool_authority.to_account_info(),
                &ctx.accounts.base_mint,
                &ctx.accounts.base_vault,
                referral_token_account,
                &ctx.accounts.token_base_program,
                swap_result.referral_fee,
                const_pda::pool_authority::BUMP,
            )?;
        } else {
            transfer_from_pool(
                ctx.accounts.pool_authority.to_account_info(),
                &ctx.accounts.quote_mint,
                &ctx.accounts.quote_vault,
                referral_token_account,
                &ctx.accounts.token_quote_program,
                swap_result.referral_fee,
                const_pda::pool_authority::BUMP,
            )?;
        }
    }

    emit_cpi!(EvtSwap {
        pool: ctx.accounts.pool.key(),
        config: ctx.accounts.config.key(),
        trade_direction: trade_direction.into(),
        params,
        swap_result,
        has_referral,
        amount_in,
        current_timestamp,
    });

    if pool.is_curve_complete(config.migration_quote_threshold) {
        ctx.accounts.base_vault.reload()?;
        // validate if base reserve is enough token for migration
        let base_vault_balance = ctx.accounts.base_vault.amount;

        let required_base_balance = config
            .migration_base_threshold
            .safe_add(pool.get_protocol_and_trading_base_fee()?)?
            .safe_add(
                config
                    .locked_vesting_config
                    .to_locked_vesting_params()
                    .get_total_amount()?,
            )?;

        require!(
            base_vault_balance >= required_base_balance,
            PoolError::InsufficientLiquidityForMigration
        );

        // set finish time and migration progress
        pool.finish_curve_timestamp = current_timestamp;

        let locked_vesting_params = config.locked_vesting_config.to_locked_vesting_params();
        if locked_vesting_params.has_vesting() {
            pool.set_migration_progress(MigrationProgress::PostBondingCurve.into());
        } else {
            pool.set_migration_progress(MigrationProgress::LockedVesting.into());
        }

        emit_cpi!(EvtCurveComplete {
            pool: ctx.accounts.pool.key(),
            config: ctx.accounts.config.key(),
            base_reserve: pool.base_reserve,
            quote_reserve: pool.quote_reserve,
        })
    }

    Ok(())
}
