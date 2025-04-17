import { LAMPORTS_PER_SOL } from '@solana/web3.js'

// Define template configurations for different curve types
export type TemplateKey = 'exponential' | 'linear' | 'custom'

export const TEMPLATES: Record<
  TemplateKey,
  {
    quoteMint: string
    feeClaimer: string
    owner: string
    baseFee: {
      cliffFeeNumerator: number
      numberOfPeriod: number
      periodFrequency: number
      reductionFactor: number
      feeSchedulerMode: number
    }
    dynamicFee: {
      binStep: number
      binStepU128: number
      filterPeriod: number
      decayPeriod: number
      reductionFactor: number
      maxVolatilityAccumulator: number
      variableFeeControl: number
    }
    collectFeeMode: number
    migrationOption: number
    activationType: number
    tokenDecimal: number
    tokenType: number
    creatorPostMigrationFeePercentage: number
    migrationQuoteThreshold: number
    sqrtStartPrice: string
    liquidityDistribution: Array<{ sqrtPrice: string; liquidity: string }>
  }
> = {
  exponential: {
    quoteMint: 'So11111111111111111111111111111111111111112', // SOL (wrapped)
    feeClaimer: '',
    owner: '',
    baseFee: {
      cliffFeeNumerator: 2_500_000,
      numberOfPeriod: 0,
      periodFrequency: 0,
      reductionFactor: 0,
      feeSchedulerMode: 0, // FLAT (constant fee)
    },
    dynamicFee: {
      binStep: 0,
      binStepU128: 0,
      filterPeriod: 0,
      decayPeriod: 0,
      reductionFactor: 0,
      maxVolatilityAccumulator: 0,
      variableFeeControl: 0,
    },
    collectFeeMode: 0, // QuoteToken only (from both templates)
    migrationOption: 0, // MeteoraDAMM
    activationType: 0, // Slot (from both templates)
    tokenDecimal: 9,
    tokenType: 0, // SplToken
    creatorPostMigrationFeePercentage: 0,
    migrationQuoteThreshold: LAMPORTS_PER_SOL * 500,

    // Simplified curve with just min and max points
    sqrtStartPrice: '97539491880527374', // Min valid sqrtPrice
    liquidityDistribution: [
      {
        sqrtPrice: '79226673521066979257578248091',
        liquidity: '103301766812773489049600000000000',
      }, // 10x more liquidity
    ],
  },
  linear: {
    quoteMint: 'So11111111111111111111111111111111111111112', // SOL (wrapped)
    feeClaimer: '',
    owner: '',
    baseFee: {
      cliffFeeNumerator: 2_500_000,
      numberOfPeriod: 0,
      periodFrequency: 0,
      reductionFactor: 0,
      feeSchedulerMode: 0, // FLAT
    },
    dynamicFee: {
      binStep: 50,
      binStepU128: 50,
      filterPeriod: 300, // 5 minutes
      decayPeriod: 300, // 5 minutes
      reductionFactor: 5,
      maxVolatilityAccumulator: 50000,
      variableFeeControl: 5000,
    },
    collectFeeMode: 0, // QuoteToken only
    migrationOption: 0, // MeteoraDAMM
    activationType: 0, // Slot
    tokenDecimal: 9,
    tokenType: 0, // SplToken
    creatorPostMigrationFeePercentage: 0,
    migrationQuoteThreshold: LAMPORTS_PER_SOL * 300,
    // Simplified curve with just min and max points
    sqrtStartPrice: '4295048016', // Min valid sqrtPrice
    liquidityDistribution: [
      { sqrtPrice: '79226673521066979257578248091', liquidity: '500000000' }, // Increased from 100000000
    ],
  },
  custom: {
    quoteMint: 'So11111111111111111111111111111111111111112', // SOL (wrapped)
    feeClaimer: '',
    owner: '',
    baseFee: {
      cliffFeeNumerator: 2_500_000,
      numberOfPeriod: 5,
      periodFrequency: 43200, // 12 hours in seconds
      reductionFactor: 20,
      feeSchedulerMode: 1, // DECAY
    },
    dynamicFee: {
      binStep: 75,
      binStepU128: 75,
      filterPeriod: 450, // 7.5 minutes
      decayPeriod: 450, // 7.5 minutes
      reductionFactor: 15,
      maxVolatilityAccumulator: 75000,
      variableFeeControl: 7500,
    },
    collectFeeMode: 1, // Both tokens
    migrationOption: 0, // MeteoraDAMM
    activationType: 1, // Timestamp
    tokenDecimal: 9,
    tokenType: 0, // SplToken
    creatorPostMigrationFeePercentage: 0,
    migrationQuoteThreshold: LAMPORTS_PER_SOL * 500,
    // Custom curve with 4 points to create distinct segments (P1, P2, P3, P4)
    sqrtStartPrice: '4295048016', // Min valid sqrtPrice
    liquidityDistribution: [
      { sqrtPrice: '429504801600', liquidity: '600000000' }, // 100x starting price
      { sqrtPrice: '4295048016000', liquidity: '500000000' }, // 1000x starting price
      { sqrtPrice: '79226673521066979257578248091', liquidity: '400000000' }, // Max
    ],
  },
}
