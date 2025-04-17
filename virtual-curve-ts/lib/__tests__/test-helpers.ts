import BN from 'bn.js'
import { type PoolConfig, type VirtualPool } from '../src/types'
import { DEFAULT_POOL_CONFIG } from '../src/defaults'

// Q64.64 format helper
export const Q = (n: number) => {
  const bigIntValue = BigInt(Math.floor(n * 2 ** 64))
  return new BN(bigIntValue.toString())
}

/**
 * Creates a mock pool for testing with customizable reserves and price
 */
export function createMockPoolAndConfig(params?: {
  baseReserve?: BN
  quoteReserve?: BN
  sqrtPrice?: BN
  poolType?: number
  cliffFeeNumerator?: BN
  protocolFeePercent?: number
}): { pool: VirtualPool; config: PoolConfig } {
  const pool = {
    volatilityTracker: {
      lastUpdateTimestamp: new BN(0),
      padding: [],
      sqrtPriceReference: new BN(0),
      volatilityAccumulator: new BN(0),
      volatilityReference: new BN(0),
    },
    baseReserve: params?.baseReserve || new BN('1000000000000'),
    quoteReserve: params?.quoteReserve || new BN('1000000000000'),
    sqrtPrice: params?.sqrtPrice || Q(1.0), // Default price of 1.0
    config: {} as any,
    creator: {} as any,
    baseMint: {} as any,
    baseVault: {} as any,
    quoteVault: {} as any,
    protocolBaseFee: new BN(0),
    protocolQuoteFee: new BN(0),
    tradingBaseFee: new BN(0),
    tradingQuoteFee: new BN(0),
    activationPoint: new BN(0),
    isMigrated: 0,
    isPartnerWithdrawSurplus: 0,
    isProcotolWithdrawSurplus: 0,
    metrics: {
      totalProtocolBaseFee: new BN(0),
      totalProtocolQuoteFee: new BN(0),
      totalTradingBaseFee: new BN(0),
      totalTradingQuoteFee: new BN(0),
    },
    poolType: params?.poolType || 0,
    padding0: [],
    padding1: [],
  }

  const config = {
    ...DEFAULT_POOL_CONFIG,
    poolFees: {
      ...DEFAULT_POOL_CONFIG.poolFees,
      baseFee: {
        ...DEFAULT_POOL_CONFIG.poolFees.baseFee,
        cliffFeeNumerator: params?.cliffFeeNumerator || new BN(0),
      },
      protocolFeePercent: params?.protocolFeePercent || 0,
    },
  }

  return {
    pool,
    config,
  }
}

/**
 * Common test pool configurations
 */
export const TestPools = {
  /**
   * Creates a balanced pool with equal reserves
   */
  createBalancedPool: (reserveAmount: BN = new BN('1000000000000')) =>
    createMockPoolAndConfig({
      baseReserve: reserveAmount,
      quoteReserve: reserveAmount,
      sqrtPrice: Q(1.0),
    }),

  /**
   * Creates an imbalanced pool with specified ratio
   */
  createImbalancedPool: (ratio: number = 2) => {
    const baseReserve = new BN('1000000000000')
    const quoteReserve = baseReserve.mul(new BN(ratio))
    return createMockPoolAndConfig({
      baseReserve,
      quoteReserve,
      sqrtPrice: Q(ratio),
    })
  },

  /**
   * Creates a pool with fees
   */
  createPoolWithFees: (feePercent: number = 0.3) =>
    createMockPoolAndConfig({
      cliffFeeNumerator: new BN(Math.floor(feePercent * 100)),
      protocolFeePercent: 20, // 20% of trading fees go to protocol
    }),
}
