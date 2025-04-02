import type BN from 'bn.js'
import type {
  Program,
  IdlTypes,
  IdlAccounts,
  Accounts,
} from '@coral-xyz/anchor'
import { type VirtualCurve as IDL } from './idl'

export type VirtualCurveProgram = Program<IDL>

// ix accounts
export type CreateClaimFeeOperatorAccounts = Accounts<
  IDL['instructions']['3']
>['createClaimFeeOperator']
export type CloseClaimFeeOperatorAccounts = Accounts<
  IDL['instructions']['2']
>['closeClaimFeeOperator']
export type ClaimProtocolFeeAccounts = Accounts<
  IDL['instructions']['0']
>['claimProtocolFee']
export type ClaimTradingFeeAccounts = Accounts<
  IDL['instructions']['1']
>['claimTradingFee']
export type CreateConfigAccounts = Accounts<
  IDL['instructions']['4']
>['createConfig']

// {
//   systemProgram: Address;
//   eventAuthority: Address;
//   program: Address;
//   config: Address;
//   pool: Address;
//   quoteMint: Address;
//   creator: Address;
//   baseMint: Address | undefined;
//   baseVault: Address;
//   quoteVault: Address;
//   payer: Address | undefined;
//   poolAuthority: Address;
//   mintMetadata: Address;
//   metadataProgram: Address;
//   tokenProgram: Address;
//   tokenQuoteProgram: Address;
// }
export type CreatorClaimLpFromMeteoraDynamicAmmAccounts = Accounts<
  IDL['instructions']['5']
>['creatorClaimLpFromMeteoraDynamicAmm']
export type InitializeVirtualPoolWithSplTokenAccounts = Accounts<
  IDL['instructions']['6']
>['initializeVirtualPoolWithSplToken']
export type InitializeVirtualPoolWithToken2022Accounts = Accounts<
  IDL['instructions']['7']
>['initializeVirtualPoolWithToken2022']
export type MigrateMeteoraDammAccounts = Accounts<
  IDL['instructions']['8']
>['migrateMeteoraDamm']
export type MigrateMeteoraDammCreatorClaimLpTokenAccounts = Accounts<
  IDL['instructions']['9']
>['migrateMeteoraDammCreatorClaimLpToken']
export type MigrateMeteoraDammLockLpTokenForCreatorAccounts = Accounts<
  IDL['instructions']['10']
>['migrateMeteoraDammLockLpTokenForCreator']
export type MigrateMeteoraDammLockLpTokenForPartnerAccounts = Accounts<
  IDL['instructions']['11']
>['migrateMeteoraDammLockLpTokenForPartner']
export type MigrateMeteoraDammPartnerClaimLpTokenAccounts = Accounts<
  IDL['instructions']['12']
>['migrateMeteoraDammPartnerClaimLpToken']
export type MigrationDammV2Accounts = Accounts<
  IDL['instructions']['13']
>['migrationDammV2']
export type MigrationDammV2CreateMetadataAccounts = Accounts<
  IDL['instructions']['14']
>['migrationDammV2CreateMetadata']

// {
//   config: Address;
//   poolAuthority: Address;
//   baseMint: Address;
//   quoteMint: Address;
//   pool: Address;
//   baseVault: Address;
//   quoteVault: Address;
//   payer: Address | undefined;
//   tokenQuoteProgram: Address;
//   eventAuthority: Address;
//   program: Address;
//   inputTokenAccount: Address;
//   outputTokenAccount: Address;
//   tokenBaseProgram: Address;
//   referralTokenAccount: Address | null;
// }
export type SwapAccounts = Accounts<IDL['instructions']['19']>['swap']

// types
export type InitializePoolParameters = IdlTypes<IDL>['initializePoolParameters']
export type SwapParameters = IdlTypes<IDL>['swapParameters']
export type ConfigParameters = IdlTypes<IDL>['configParameters']

// {
//   baseFee: {
//     cliffFeeNumerator: BN;
//     numberOfPeriod: number;
//     periodFrequency: BN;
//     reductionFactor: BN;
//     feeSchedulerMode: number;
// };
// dynamicFee: {
//     binStep: number;
//     binStepU128: BN;
//     filterPeriod: number;
//     decayPeriod: number;
//     reductionFactor: number;
//     maxVolatilityAccumulator: number;
//     variableFeeControl: number;
// } | null;
// }
export type PoolFeeParamters = IdlTypes<IDL>['poolFeeParamters']

// {
//     baseFee: {
//         cliffFeeNumerator: BN;
//         periodFrequency: BN;
//         reductionFactor: BN;
//         numberOfPeriod: number;
//         feeSchedulerMode: number;
//         padding0: number[];
//     };
export type BaseFeeParameters = IdlTypes<IDL>['baseFeeConfig']

// {
//   binStep: number;
//   binStepU128: BN;
//   filterPeriod: number;
//   decayPeriod: number;
//   reductionFactor: number;
//   maxVolatilityAccumulator: number;
//   variableFeeControl: number;
// }
export type DynamicFeeParameters = IdlTypes<IDL>['dynamicFeeParameters']

export type LiquidityDistributionParameters =
  IdlTypes<IDL>['liquidityDistributionParameters']

// {
//     baseFee: {
//         cliffFeeNumerator: BN;
//         periodFrequency: BN;
//         reductionFactor: BN;
//         numberOfPeriod: number;
//         feeSchedulerMode: number;
//         padding0: number[];
//     };
//     dynamicFee: {
//         initialized: number;
//         padding: number[];
//         maxVolatilityAccumulator: number;
//         variableFeeControl: number;
//         binStep: number;
//         filterPeriod: number;
//         decayPeriod: number;
//         reductionFactor: number;
//         padding2: number[];
//         binStepU128: BN;
//     };
//     padding0: BN[];
//     padding1: number[];
//     protocolFeePercent: number;
//     referralFeePercent: number;
// }
export type PoolFeesConfig = IdlTypes<IDL>['poolFeesConfig']

export type BaseFeeConfig = IdlTypes<IDL>['baseFeeConfig']

// {
//   initialized: number;
//   padding: number[];
//   maxVolatilityAccumulator: number;
//   variableFeeControl: number;
//   binStep: number;
//   filterPeriod: number;
//   decayPeriod: number;
//   reductionFactor: number;
//   padding2: number[];
//   binStepU128: BN;
// }
export type DynamicFeeConfig = IdlTypes<IDL>['dynamicFeeConfig']

export type LiquidityDistributionConfig =
  IdlTypes<IDL>['liquidityDistributionParameters']
export type PoolFeesStruct = IdlTypes<IDL>['poolFeesStruct']
export type BaseFeeStruct = IdlTypes<IDL>['baseFeeConfig']
export type DynamicFeeStruct = IdlTypes<IDL>['dynamicFeeParameters']
export type PoolMetrics = IdlTypes<IDL>['poolMetrics']
export type SwapResult = IdlTypes<IDL>['swapResult']

// accounts
export type ClaimFeeOperator = IdlAccounts<IDL>['claimFeeOperator']
export type Config = IdlAccounts<IDL>['config']

// {
//   quoteMint: PublicKey;
//   feeClaimer: PublicKey;
//   owner: PublicKey;
//   poolFees: {
//       baseFee: {
//           cliffFeeNumerator: BN;
//           periodFrequency: BN;
//           reductionFactor: BN;
//           numberOfPeriod: number;
//           feeSchedulerMode: number;
//           padding0: number[];
//       };
//       dynamicFee: {
//           initialized: number;
//           padding: number[];
//           maxVolatilityAccumulator: number;
//           variableFeeControl: number;
//           binStep: number;
//           filterPeriod: number;
//           decayPeriod: number;
//           reductionFactor: number;
//           padding2: number[];
//           binStepU128: BN;
//       };
//       padding0: BN[];
//       padding1: number[];
//       protocolFeePercent: number;
//       referralFeePercent: number;
//   };
//   collectFeeMode: number;
//   migrationOption: number;
//   activationType: number;
//   tokenDecimal: number;
//   tokenType: number;
//   creatorPostMigrationFeePercentage: number;
//   padding0: number[];
//   swapBaseAmount: BN;
//   migrationQuoteThreshold: BN;
//   migrationBaseThreshold: BN;
//   padding: BN[];
//   sqrtStartPrice: BN;
//   curve: {
//       sqrtPrice: BN;
//       liquidity: BN;
//   }[];
// }
export type PoolConfig = IdlAccounts<IDL>['poolConfig']

// {
//   virtualPool: PublicKey;
//   owner: PublicKey;
//   partner: PublicKey;
//   lpMint: PublicKey;
//   lpMintedAmountForCreator: BN;
//   lpMintedAmountForPartner: BN;
//   progress: number;
//   creatorLockedStatus: number;
//   partnerLockedStatus: number;
//   padding: number[];
// }
export type MeteoraDammMigrationMetadata =
  IdlAccounts<IDL>['meteoraDammMigrationMetadata']

export type VirtualPool = IdlAccounts<IDL>['virtualPool']

export enum SwapDirection {
  BaseToQuote,
  QuoteToBase,
}

export interface CurvePoint {
  sqrtPrice: BN
  liquidity: BN
}

export interface FeeResult {
  amount: BN
  protocolFee: BN
  tradingFee: BN
  referralFee: BN
}

export enum TradeDirection {
  BaseToQuote,
  QuoteToBase,
}

export interface FeeMode {
  feesOnInput: boolean
  feesOnBaseToken: boolean
  hasReferral: boolean
}

export type VirtualPoolState = IdlTypes<IDL>['virtualPool']

export interface QuoteParams {
  amountIn: BN
  direction: SwapDirection
  slippage?: number // Optional slippage tolerance (e.g., 0.01 for 1%)
  pool: VirtualPoolState
}

export interface QuoteResult {
  amountOut: BN
  minimumAmountOut: BN
  nextSqrtPrice: BN
  fee: {
    trading: BN
    protocol: BN
    referral?: BN
  }
  price: {
    beforeSwap: number
    afterSwap: number
  }
}

export interface FeeMode {
  feesOnInput: boolean
  feesOnBaseToken: boolean
  hasReferral: boolean
}

// {
//   initialized: number
//   maxVolatilityAccumulator: number
//   variableFeeControl: number
//   binStep: number
//   filterPeriod: number
//   decayPeriod: number
//   reductionFactor: number
//   lastUpdateTimestamp: BN
//   binStepU128: BN
//   sqrtPriceReference: BN
//   volatilityAccumulator: BN
//   volatilityReference: BN
// }
export type DynamicFee = VirtualPool['poolFees']['dynamicFee']

// {
//   cliffFeeNumerator: BN
//   feeSchedulerMode: number
//   numberOfPeriod: number
//   periodFrequency: BN
//   reductionFactor: BN
// }
export type BaseFee = VirtualPool['poolFees']['baseFee']

export interface FeeOnAmountResult {
  amount: BN // Amount remaining after taking trading fee
  protocolFee: BN // Final protocol fee (after referral deduction)
  tradingFee: BN // Portion of trading fee NOT going to protocol
  referralFee: BN // Referral fee amount
}
