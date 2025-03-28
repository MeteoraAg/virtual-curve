//! Error module includes error messages and codes of the program
use anchor_lang::prelude::*;

/// Error messages and codes of the program
#[error_code]
#[derive(PartialEq)]
pub enum PoolError {
    #[msg("Math operation overflow")]
    MathOverflow,

    #[msg("Invalid fee setup")]
    InvalidFee,

    #[msg("Exceeded slippage tolerance")]
    ExceededSlippage,

    #[msg("Exceeded max fee bps")]
    ExceedMaxFeeBps,

    #[msg("Invalid admin")]
    InvalidAdmin,

    #[msg("Amount is zero")]
    AmountIsZero,

    #[msg("Type cast error")]
    TypeCastFailed,

    #[msg("Invalid activation type")]
    InvalidActivationType,

    #[msg("Invalid quote mint")]
    InvalidQuoteMint,

    #[msg("Invalid parameters")]
    InvalidParameters,

    #[msg("Invalid collect fee mode")]
    InvalidCollectFeeMode,

    #[msg("Invalid input")]
    InvalidInput,

    #[msg("Invalid extension")]
    InvalidExtension,

    #[msg("Fee inverse is incorrect")]
    FeeInverseIsIncorrect,

    #[msg("Not enough liquidity")]
    NotEnoughLiquidity,

    #[msg("Pool is completed")]
    PoolIsCompleted,

    #[msg("Pool is incompleted")]
    PoolIsIncompleted,

    #[msg("Invalid migration option")]
    InvalidMigrationOption,

    #[msg("Invalid activation type")]
    InvalidTokenDecimals,

    #[msg("Invalid token type")]
    InvalidTokenType,

    #[msg("Invalid fee percentage")]
    InvalidFeePercentage,

    #[msg("Invalid quote threshold")]
    InvalidQuoteThreshold,

    #[msg("Invalid curve")]
    InvalidCurve,

    #[msg("Not permit to do this action")]
    NotPermitToDoThisAction,

    #[msg("Invalid partner account")]
    InvalidPartnerAccount,

    #[msg("Invalid owner account")]
    InvalidOwnerAccount,

    #[msg("Invalid config account")]
    InvalidConfigAccount,

    #[msg("Surplus has been withdraw")]
    SurplusHasBeenWithdraw,

    #[msg("Total base token is exceeded max supply")]
    TotalBaseTokenExceedMaxSupply,

    #[msg("Unsupport native mint token 2022")]
    UnsupportNativeMintToken2022,

    #[msg("Insufficent liquidity for migration")]
    InsufficentLiquidityForMigration,
}
