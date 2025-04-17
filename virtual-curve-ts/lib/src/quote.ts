import BN from 'bn.js'
import {
  type QuoteResult,
  type VirtualPool,
  type PoolConfig,
  TradeDirection,
  type FeeMode,
  type FeeOnAmountResult,
  type PoolFeesConfig,
  type VolatilityTracker,
} from './types'
import {
  getDeltaAmountBaseUnsigned,
  getDeltaAmountQuoteUnchecked,
  getDeltaAmountQuoteUnsigned,
  getNextSqrtPriceFromInput,
  mulDiv,
} from './math'
import { getFeeInPeriod } from './fee_math'

// Constants to match Rust
const MAX_CURVE_POINT = 20
const FEE_DENOMINATOR = new BN(1_000_000_000)
const MAX_FEE_NUMERATOR = new BN(500_000_000)

enum CollectFeeMode {
  QuoteToken = 0,
  OutputToken = 1,
}

enum FeeSchedulerMode {
  Linear = 0,
  Exponential = 1,
}

/**
 * Calculate quote for a swap with exact input amount
 * Matches Rust's quote_exact_in function
 */
export function quoteExactIn(
  virtualPool: VirtualPool,
  config: PoolConfig,
  swapBaseForQuote: boolean,
  amountIn: BN,
  hasReferral: boolean = false,
  currentPoint: BN
): QuoteResult {
  // Match Rust's validation checks
  if (virtualPool.quoteReserve.gte(config.migrationQuoteThreshold)) {
    throw new Error('Virtual pool is completed')
  }

  if (amountIn.isZero()) {
    throw new Error('Amount is zero')
  }

  // Match Rust's trade direction determination
  const tradeDirection = swapBaseForQuote
    ? TradeDirection.BaseToQuote
    : TradeDirection.QuoteToBase

  // Get fee mode using Rust's logic
  const feeMode = getFeeMode(config.collectFeeMode, tradeDirection, hasReferral)

  // Get swap result
  return getSwapResult(
    virtualPool,
    config,
    amountIn,
    feeMode,
    tradeDirection,
    currentPoint
  )
}

function getSwapResult(
  pool: VirtualPool,
  config: PoolConfig,
  amountIn: BN,
  feeMode: FeeMode,
  tradeDirection: TradeDirection,
  currentPoint: BN
): QuoteResult {
  let actualProtocolFee = new BN(0)
  let actualTradingFee = new BN(0)
  let actualReferralFee = new BN(0)
  let actualAmountIn = amountIn // Initialize with amountIn

  // Calculate fees if they're applied on input
  if (feeMode.feesOnInput) {
    const feeResult = calculateFees(
      config.poolFees,
      pool.volatilityTracker,
      amountIn,
      feeMode.hasReferral,
      currentPoint,
      pool.activationPoint
    )
    actualAmountIn = feeResult.amount
    actualProtocolFee = feeResult.protocolFee
    actualTradingFee = feeResult.tradingFee
    actualReferralFee = feeResult.referralFee
  }

  // Calculate swap amounts
  const { outputAmount, nextSqrtPrice } =
    tradeDirection === TradeDirection.BaseToQuote
      ? getSwapAmountFromBaseToQuote(pool, config, actualAmountIn)
      : getSwapAmountFromQuoteToBase(pool, config, actualAmountIn)

  let actualAmountOut = outputAmount // Initialize with calculated output

  // Calculate fees if they're applied on output
  if (!feeMode.feesOnInput) {
    const feeResult = calculateFees(
      config.poolFees,
      pool.volatilityTracker,
      outputAmount, // Calculate fees on the gross output amount
      feeMode.hasReferral,
      currentPoint,
      pool.activationPoint
    )
    actualAmountOut = feeResult.amount // Net amount after output fees
    actualProtocolFee = feeResult.protocolFee
    actualTradingFee = feeResult.tradingFee
    actualReferralFee = feeResult.referralFee
  }

  return {
    amountOut: actualAmountOut,
    minimumAmountOut: actualAmountOut, // Actual implementation should apply slippage
    nextSqrtPrice: nextSqrtPrice,
    fee: {
      trading: actualTradingFee,
      protocol: actualProtocolFee,
      referral: actualReferralFee,
    },
    price: {
      beforeSwap: Number(pool.sqrtPrice.mul(pool.sqrtPrice).shrn(128)),
      afterSwap: Number(nextSqrtPrice.mul(nextSqrtPrice).shrn(128)),
    },
  }
}

function getSwapAmountFromBaseToQuote(
  pool: VirtualPool,
  config: PoolConfig,
  amountIn: BN
): { outputAmount: BN; nextSqrtPrice: BN } {
  let totalOutputAmount = new BN(0)
  let currentSqrtPrice = pool.sqrtPrice
  let amountLeft = amountIn

  // Iterate through curve points from highest to lowest, matching Rust's range
  for (let i = MAX_CURVE_POINT - 2; i >= 0; i--) {
    if (config.curve[i].sqrtPrice.lt(currentSqrtPrice)) {
      const maxAmountIn = getDeltaAmountBaseUnsigned(
        config.curve[i].sqrtPrice,
        currentSqrtPrice,
        config.curve[i + 1].liquidity,
        true // roundUp
      )
      if (amountLeft.lt(maxAmountIn)) {
        const nextSqrtPrice = getNextSqrtPriceFromInput(
          currentSqrtPrice,
          config.curve[i + 1].liquidity,
          amountLeft,
          true
        )

        const outputAmount = getDeltaAmountQuoteUnsigned(
          nextSqrtPrice,
          currentSqrtPrice,
          config.curve[i + 1].liquidity,
          false // roundDown
        )

        totalOutputAmount = totalOutputAmount.add(outputAmount)
        currentSqrtPrice = nextSqrtPrice
        amountLeft = new BN(0)
        break
      } else {
        const nextSqrtPrice = config.curve[i].sqrtPrice
        const outputAmount = getDeltaAmountQuoteUnsigned(
          nextSqrtPrice,
          currentSqrtPrice,
          config.curve[i + 1].liquidity,
          false // roundDown
        )

        totalOutputAmount = totalOutputAmount.add(outputAmount)
        currentSqrtPrice = nextSqrtPrice
        amountLeft = amountLeft.sub(maxAmountIn)
      }
    }
  }

  // Handle remaining amount with first curve point
  if (!amountLeft.isZero()) {
    const nextSqrtPrice = getNextSqrtPriceFromInput(
      currentSqrtPrice,
      config.curve[0].liquidity,
      amountLeft,
      true
    )

    const outputAmount = getDeltaAmountQuoteUnsigned(
      nextSqrtPrice,
      currentSqrtPrice,
      config.curve[0].liquidity,
      false // roundDown
    )

    totalOutputAmount = totalOutputAmount.add(outputAmount)
    currentSqrtPrice = nextSqrtPrice
  }

  return {
    outputAmount: totalOutputAmount,
    nextSqrtPrice: currentSqrtPrice,
  }
}

function getSwapAmountFromQuoteToBase(
  pool: VirtualPool,
  config: PoolConfig,
  amountIn: BN
): { outputAmount: BN; nextSqrtPrice: BN } {
  let totalOutputAmount = new BN(0)
  let currentSqrtPrice = pool.sqrtPrice
  let amountLeft = amountIn

  // Iterate through curve points
  for (let i = 0; i < MAX_CURVE_POINT; i++) {
    if (config.curve[i].sqrtPrice.gt(currentSqrtPrice)) {
      const maxAmountIn = getDeltaAmountQuoteUnchecked(
        currentSqrtPrice,
        config.curve[i].sqrtPrice,
        config.curve[i].liquidity,
        true // roundUp
      )

      if (amountLeft.lt(maxAmountIn)) {
        const nextSqrtPrice = getNextSqrtPriceFromInput(
          currentSqrtPrice,
          config.curve[i].liquidity,
          amountLeft,
          false
        )

        const outputAmount = getDeltaAmountBaseUnsigned(
          currentSqrtPrice,
          nextSqrtPrice,
          config.curve[i].liquidity,
          false // roundDown
        )

        totalOutputAmount = totalOutputAmount.add(outputAmount)
        currentSqrtPrice = nextSqrtPrice
        amountLeft = new BN(0)
        break
      } else {
        const nextSqrtPrice = config.curve[i].sqrtPrice
        const outputAmount = getDeltaAmountBaseUnsigned(
          currentSqrtPrice,
          nextSqrtPrice,
          config.curve[i].liquidity,
          false // roundDown
        )

        totalOutputAmount = totalOutputAmount.add(outputAmount)
        currentSqrtPrice = nextSqrtPrice
        amountLeft = amountLeft.sub(maxAmountIn)
      }
    }
  }

  if (!amountLeft.isZero()) {
    throw new Error('NotEnoughLiquidity')
  }

  return {
    outputAmount: totalOutputAmount,
    nextSqrtPrice: currentSqrtPrice,
  }
}

// same as get_fee_on_amount in rust
function calculateFees(
  poolFees: PoolFeesConfig,
  volatilityTracker: VolatilityTracker,
  amount: BN,
  hasReferral: boolean,
  currentPoint: BN,
  activationPoint: BN
): FeeOnAmountResult {
  // Get total trading fee numerator
  const tradeFeeNumerator = getTotalTradingFee(
    poolFees,
    volatilityTracker,
    currentPoint,
    activationPoint
  )
  const tradeFeeNumeratorCapped = tradeFeeNumerator.gt(MAX_FEE_NUMERATOR)
    ? MAX_FEE_NUMERATOR
    : tradeFeeNumerator

  // Calculate total trading fee based on the *original* amount
  const totalTradingFee = mulDiv(
    amount,
    tradeFeeNumeratorCapped,
    FEE_DENOMINATOR,
    true
  )

  // Calculate protocol fee from the total trading fee
  const protocolFee = totalTradingFee
    .mul(new BN(poolFees.protocolFeePercent))
    .div(new BN(100))

  // Calculate referral fee from the protocol fee
  const referralFee = hasReferral
    ? protocolFee.mul(new BN(poolFees.referralFeePercent)).div(new BN(100))
    : new BN(0)

  // Determine final fee components
  const finalProtocolFee = protocolFee.sub(referralFee)
  // The remaining part of the total trading fee after protocol fee is deducted
  const finalTradingFee = totalTradingFee.sub(protocolFee)

  // Amount remaining after *total* trading fee is deducted
  const remainingAmount = amount.sub(totalTradingFee)

  // Return the result object
  return {
    amount: remainingAmount,
    protocolFee: finalProtocolFee,
    tradingFee: finalTradingFee,
    referralFee: referralFee,
  }
}

/**
 * Matches Rust's FeeMode::get_fee_mode
 */
export function getFeeMode(
  collectFeeMode: number,
  tradeDirection: TradeDirection,
  hasReferral: boolean
): FeeMode {
  let feesOnInput: boolean
  let feesOnBaseToken: boolean

  switch (collectFeeMode) {
    case CollectFeeMode.OutputToken:
      switch (tradeDirection) {
        case TradeDirection.BaseToQuote:
          feesOnInput = false
          feesOnBaseToken = false
          break
        case TradeDirection.QuoteToBase:
          feesOnInput = false
          feesOnBaseToken = true
          break
        default:
          throw new Error('Invalid trade direction')
      }
      break

    case CollectFeeMode.QuoteToken:
      switch (tradeDirection) {
        case TradeDirection.BaseToQuote:
          feesOnInput = false
          feesOnBaseToken = false
          break
        case TradeDirection.QuoteToBase:
          feesOnInput = true
          feesOnBaseToken = false
          break
        default:
          throw new Error('Invalid trade direction')
      }
      break

    default:
      throw new Error('InvalidCollectFeeMode')
  }

  return {
    feesOnInput,
    feesOnBaseToken,
    hasReferral,
  }
}

/**
 * Matches Rust's get_total_trading_fee
 */
function getTotalTradingFee(
  poolFees: PoolFeesConfig,
  volatilityTracker: VolatilityTracker,
  currentPoint: BN,
  activationPoint: BN
): BN {
  const baseFeeNumerator = getCurrentBaseFeeNumerator(
    poolFees.baseFee,
    currentPoint,
    activationPoint
  )
  const variableFee = getVariableFee(poolFees.dynamicFee, volatilityTracker)
  return baseFeeNumerator.add(variableFee)
}

/**
 * Matches Rust's get_current_base_fee_numerator
 */
function getCurrentBaseFeeNumerator(
  baseFee: PoolFeesConfig['baseFee'],
  currentPoint: BN,
  activationPoint: BN
): BN {
  if (baseFee.periodFrequency.isZero()) {
    return baseFee.cliffFeeNumerator
  }

  const period = currentPoint.lt(activationPoint)
    ? new BN(baseFee.numberOfPeriod)
    : BN.min(
        currentPoint.sub(activationPoint).div(baseFee.periodFrequency),
        new BN(baseFee.numberOfPeriod)
      )

  switch (baseFee.feeSchedulerMode) {
    case FeeSchedulerMode.Linear:
      return baseFee.cliffFeeNumerator.sub(period.mul(baseFee.reductionFactor))
    case FeeSchedulerMode.Exponential:
      return getFeeInPeriod(
        baseFee.cliffFeeNumerator,
        baseFee.reductionFactor,
        period
      )
    default:
      throw new Error('Invalid fee scheduler mode')
  }
}

/**
 * Matches Rust's get_variable_fee
 */
function getVariableFee(
  dynamicFee: PoolFeesConfig['dynamicFee'],
  volatilityTracker: VolatilityTracker
): BN {
  if (!dynamicFee.initialized) {
    return new BN(0)
  }

  const squareVfaBin = volatilityTracker.volatilityAccumulator
    .mul(new BN(dynamicFee.binStep))
    .pow(new BN(2))

  const vFee = squareVfaBin.mul(new BN(dynamicFee.variableFeeControl))

  // Match Rust's scaling: (v_fee + 99_999_999_999) / 100_000_000_000
  return vFee.add(new BN('99999999999')).div(new BN('100000000000'))
}
