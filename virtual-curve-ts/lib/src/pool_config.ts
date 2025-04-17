import BN from 'bn.js'
import type {
  PoolConfig,
  LiquidityDistributionConfig,
  PoolFeeParamters,
  BaseFeeParameters,
  DynamicFeeParameters,
  VirtualPool,
  PoolFees,
  PoolFeesConfig,
  BaseFeeConfig,
  DynamicFeeConfig,
} from './types'

// Constants matching Rust implementation
export const MAX_TOKEN_SUPPLY = new BN('1000000000')
export const MAX_SQRT_PRICE = new BN('340282366920938463463374607431768211455') // MAX u128
export const MAX_CURVE_POINT = 20

/**
 * Calculate total amount with buffer (matches Rust's total_amount_with_buffer)
 */
export function calculateTotalAmountWithBuffer(
  swapBaseAmount: BN,
  migrationBaseThreshold: BN
): BN {
  const totalAmount = migrationBaseThreshold.add(swapBaseAmount)
  // 5 * totalAmount / 4 (adds 25% buffer)
  return totalAmount.mul(new BN(5)).div(new BN(4))
}

/**
 * Calculate max supply based on token decimals (matches Rust's get_max_supply)
 */
export function getMaxSupply(tokenDecimal: number): BN {
  const decimalMultiplier = new BN(10).pow(new BN(tokenDecimal))
  return decimalMultiplier.mul(MAX_TOKEN_SUPPLY)
}

/**
 * Get initial base supply (matches Rust's get_initial_base_supply)
 */
export function getInitialBaseSupply(config: PoolConfig): BN {
  return calculateTotalAmountWithBuffer(
    config.swapBaseAmount,
    config.migrationBaseThreshold
  )
}

/**
 * Initialize curve with default values for remaining points
 */
function initializeCurve(
  initialCurve: LiquidityDistributionConfig[]
): LiquidityDistributionConfig[] {
  const curve = Array(MAX_CURVE_POINT).fill({
    sqrtPrice: MAX_SQRT_PRICE,
    liquidity: new BN(0),
  })

  initialCurve.forEach((point, i) => {
    if (i < MAX_CURVE_POINT) {
      curve[i] = point
    }
  })

  return curve
}

/**
 * Convert pool fee parameters to config (matches Rust's to_pool_fees_config)
 */
export function toPoolFeesConfig(params: PoolFeeParamters): PoolFeesConfig {
  return {
    baseFee: toBaseFeeConfig(params.baseFee),
    dynamicFee: toDynamicFeeConfig(params.dynamicFee),
    padding0: Array(5).fill(new BN(0)),
    padding1: Array(6).fill(0),
    protocolFeePercent: 0,
    referralFeePercent: 0,
  }
}

/**
 * Convert base fee parameters to config (matches Rust's to_base_fee_config)
 */
export function toBaseFeeConfig(
  params: Omit<BaseFeeParameters, 'padding0'>
): BaseFeeConfig {
  return {
    cliffFeeNumerator: params.cliffFeeNumerator,
    periodFrequency: params.periodFrequency,
    reductionFactor: params.reductionFactor,
    numberOfPeriod: params.numberOfPeriod,
    feeSchedulerMode: params.feeSchedulerMode,
    padding0: [],
  }
}

/**
 * Convert dynamic fee parameters to config (matches Rust's to_dynamic_fee_config)
 */
export function toDynamicFeeConfig(
  params: DynamicFeeParameters | null
): DynamicFeeConfig {
  if (!params) {
    return {
      initialized: 0,
      padding: [],
      maxVolatilityAccumulator: 0,
      variableFeeControl: 0,
      binStep: 0,
      filterPeriod: 0,
      decayPeriod: 0,
      reductionFactor: 0,
      binStepU128: new BN(0),
      padding2: [],
    }
  }

  return {
    initialized: 1,
    padding: [],
    maxVolatilityAccumulator: params.maxVolatilityAccumulator,
    variableFeeControl: params.variableFeeControl,
    binStep: params.binStep,
    filterPeriod: params.filterPeriod,
    decayPeriod: params.decayPeriod,
    reductionFactor: params.reductionFactor,
    binStepU128: params.binStepU128,
    padding2: [],
  }
}

/**
 * Check if pool is curve complete (matches Rust's is_curve_complete)
 */
export function isCurveComplete(
  config: PoolConfig,
  poolQuoteReserve: BN
): boolean {
  return poolQuoteReserve.gte(config.migrationQuoteThreshold)
}

/**
 * Update pool config (pure function that returns new config)
 */
export function updatePoolConfig(
  config: PoolConfig,
  updates: Partial<PoolConfig>
): PoolConfig {
  return {
    ...config,
    ...updates,
  }
}
