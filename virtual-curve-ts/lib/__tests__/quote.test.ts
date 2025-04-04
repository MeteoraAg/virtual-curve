import { test, expect } from 'bun:test'
import { quoteExactIn } from '../src/quote'
import BN from 'bn.js'
import { type VirtualPool, type PoolConfig, TradeDirection } from '../src/types'
import { PublicKey } from '@solana/web3.js'
import { DEFAULT_POOL_CONFIG, DEFAULT_VIRTUAL_POOL } from '../src/defaults'
import {
  getInitialBaseSupply,
  MAX_CURVE_POINT,
  toPoolFeesConfig,
} from '../src/pool_config'
import { getPriceFromId } from '../src/price_math'

// Helper function to convert to Q64.64 format (similar to Rust test)
const Q = (n: number) => {
  const bigIntValue = BigInt(Math.floor(n * 2 ** 64))
  return new BN(bigIntValue.toString())
}

// Constants matching Rust test
const MAX_SQRT_PRICE = new BN('79226673521066979257578248091') // MAX u128
const MIGRATION_QUOTE_THRESHOLD = new BN('50000000000') // 50k USDC

/**
 * Convert a decimal string or BN to a u128 (simulating Rust's u128 behavior)
 * @param {string|BN} value - The input value
 * @returns {BN} The value wrapped to u128 range
 */
function toU128(value: string | BN) {
  // Create value as BN if it's not already
  const bn = BN.isBN(value) ? value : new BN(value)

  // Create a mask for 128 bits (2^128 - 1)
  const U128_MAX = new BN(1).shln(128).subn(1)

  // Apply the mask to simulate the wrapping behavior of u128
  return bn.and(U128_MAX)
}

/**
 * Perform a left shift on a value and wrap to u128
 * @param {string|BN} value - The input value
 * @param {number} bits - Number of bits to shift left
 * @returns {BN} The shifted value wrapped to u128 range
 */
function u128Shl(value: string | BN, bits: number) {
  const bn = BN.isBN(value) ? value : new BN(value)
  return toU128(bn.shln(bits))
}

test('quote exact in test', () => {
  const sqrtActiveId = -100 // Same as Rust test
  const binStep = 80 // 80bps, same as Rust test

  const sqrtStartPrice = getPriceFromId(sqrtActiveId, binStep)

  // Define curve points
  const curve = [
    {
      sqrtPrice: MAX_SQRT_PRICE,
      liquidity: u128Shl('1000000000000000000000000', 64),
    },
  ]
  const curveLength = curve.length

  // Create test pool configuration
  const config: PoolConfig = {
    ...DEFAULT_POOL_CONFIG,
    sqrtStartPrice,
    migrationQuoteThreshold: MIGRATION_QUOTE_THRESHOLD,
    collectFeeMode: 1, // OutputToken mode
    curve: Array(MAX_CURVE_POINT)
      .fill(null)
      .map((_, i) => {
        if (i < curveLength) {
          return curve[i]
        } else {
          return {
            sqrtPrice: MAX_SQRT_PRICE, // set max
            liquidity: new BN(0),
          }
        }
      }),
  }

  // Create virtual pool state
  const virtualPool: VirtualPool = {
    ...DEFAULT_VIRTUAL_POOL,
    sqrtPrice: config.sqrtStartPrice,
    baseReserve: getInitialBaseSupply(config),
  }

  // Test quote for quote to base swap
  const amountIn = new BN('1000000000') // 1k USDC
  const result = quoteExactIn(
    virtualPool,
    config,
    false, // quote to base
    amountIn,
    false, // no referral
    new BN(0) // current point
  )

  // Verify results
  //   expect(result.amountOut.gt(new BN(0))).toBe(true)
  //   expect(result.fee.trading.gte(new BN(0))).toBe(true)
  //   expect(result.fee.protocol.gte(new BN(0))).toBe(true)

  // Log results similar to Rust test
  console.log('Quote Result:', {
    amountOut: result.amountOut.toString(),
    tradingFee: result.fee.trading.toString(),
    protocolFee: result.fee.protocol.toString(),
    nextSqrtPrice: result.nextSqrtPrice.toString(),
  })

  expect(result.amountOut.toString()).toMatchInlineSnapshot(`"4921601219"`)
  expect(result.fee.trading.toString()).toMatchInlineSnapshot(`"0"`)
  expect(result.nextSqrtPrice.toString()).toMatchInlineSnapshot(
    `"8315081533034529335"`
  )
})

test('quote exact in test with fees', () => {
  const sqrtActiveId = -100 // Same as Rust test
  const binStep = 80 // 80bps, same as Rust test

  const sqrtStartPrice = getPriceFromId(sqrtActiveId, binStep)

  // Define curve points
  const curve = [
    {
      sqrtPrice: MAX_SQRT_PRICE,
      liquidity: u128Shl('1000000000000000000000000', 64),
    },
  ]
  const curveLength = curve.length

  // Create test pool configuration
  const config: PoolConfig = {
    ...DEFAULT_POOL_CONFIG,
    sqrtStartPrice,
    migrationQuoteThreshold: MIGRATION_QUOTE_THRESHOLD,
    collectFeeMode: 1, // OutputToken mode
    curve: Array(MAX_CURVE_POINT)
      .fill(null)
      .map((_, i) => {
        if (i < curveLength) {
          return curve[i]
        } else {
          return {
            sqrtPrice: MAX_SQRT_PRICE, // set max
            liquidity: new BN(0),
          }
        }
      }),
    poolFees: {
      ...DEFAULT_POOL_CONFIG['poolFees'],
      baseFee: {
        cliffFeeNumerator: new BN(2_500_000),
        periodFrequency: new BN(0),
        reductionFactor: new BN(0),
        numberOfPeriod: 0,
        feeSchedulerMode: 0,
        padding0: [],
      },
    },
  }
  // Create virtual pool state
  const virtualPool: VirtualPool = {
    ...DEFAULT_VIRTUAL_POOL,
    sqrtPrice: config.sqrtStartPrice,
    baseReserve: getInitialBaseSupply(config),
  }

  // Test quote for quote to base swap
  const amountIn = new BN('1000000000') // 1k USDC
  const result = quoteExactIn(
    virtualPool,
    config,
    false, // quote to base
    amountIn,
    false, // no referral
    new BN(0) // current point
  )

  // Verify results
  //   expect(result.amountOut.gt(new BN(0))).toBe(true)
  //   expect(result.fee.trading.gte(new BN(0))).toBe(true)
  //   expect(result.fee.protocol.gte(new BN(0))).toBe(true)

  // Log results similar to Rust test
  console.log('Quote Result:', {
    amountOut: result.amountOut.toString(),
    tradingFee: result.fee.trading.toString(),
    protocolFee: result.fee.protocol.toString(),
    nextSqrtPrice: result.nextSqrtPrice.toString(),
  })

  expect(result.amountOut.toString()).toMatchInlineSnapshot(`"4909297215"`)
  expect(result.fee.trading.toString()).toMatchInlineSnapshot(`"12304004"`)
  expect(result.nextSqrtPrice.toString()).toMatchInlineSnapshot(
    `"8315081533034529335"`
  )

  // Test quote for quote to base swap
  const smallAmountIn = new BN('1') // 1
  const smallResult = quoteExactIn(
    virtualPool,
    config,
    false, // quote to base
    smallAmountIn,
    false, // no referral
    new BN(0) // current point
  )

  // Verify results
  //   expect(result.amountOut.gt(new BN(0))).toBe(true)
  //   expect(result.fee.trading.gte(new BN(0))).toBe(true)
  //   expect(result.fee.protocol.gte(new BN(0))).toBe(true)

  // Log results similar to Rust test
  console.log('Quote Result:', {
    amountOut: smallResult.amountOut.toString(),
    tradingFee: smallResult.fee.trading.toString(),
    protocolFee: smallResult.fee.protocol.toString(),
    nextSqrtPrice: smallResult.nextSqrtPrice.toString(),
  })

  expect(smallResult.amountOut.toString()).toMatchInlineSnapshot(`"3"`)
  expect(smallResult.fee.trading.toString()).toMatchInlineSnapshot(`"1"`)
  expect(smallResult.nextSqrtPrice.toString()).toMatchInlineSnapshot(
    `"8315081523828484030"`
  )

  // Test quote for base to quote swap
  const amountInBase = new BN('1000000000') // 1k USDC
  const resultBaseToQuote = quoteExactIn(
    virtualPool,
    config,
    true, // base to quote
    amountInBase,
    false, // no referral
    new BN(0) // current point
  )

  console.log('Quote Result:', {
    amountOut: resultBaseToQuote.amountOut.toString(),
    tradingFee: resultBaseToQuote.fee.trading.toString(),
    protocolFee: resultBaseToQuote.fee.protocol.toString(),
    nextSqrtPrice: resultBaseToQuote.nextSqrtPrice.toString(),
  })
  expect(resultBaseToQuote.amountOut.toString()).toMatchInlineSnapshot(
    `"202677940"`
  )
  expect(resultBaseToQuote.fee.trading.toString()).toMatchInlineSnapshot(
    `"507965"`
  )
  expect(resultBaseToQuote.fee.protocol.toString()).toMatchInlineSnapshot(`"0"`)
  expect(resultBaseToQuote.nextSqrtPrice.toString()).toMatchInlineSnapshot(
    `"8315081521957945371"`
  )
})
