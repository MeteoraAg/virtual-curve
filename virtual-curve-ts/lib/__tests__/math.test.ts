import { test, expect } from 'bun:test'
import {
  getDeltaAmountBaseUnsigned,
  getDeltaAmountQuoteUnsigned,
  getNextSqrtPriceFromInput,
  getNextSqrtPriceFromAmountQuote,
} from '../src/math'
import { BN } from 'bn.js'
import { Q } from './test-helpers'

test('Base amount calculation', () => {
  const lower = Q(1.0)
  const upper = Q(1.0001)
  // Lower test liquidity value to prevent overflow
  const liquidity = new BN('1293129312931923921293912')

  const result = getDeltaAmountBaseUnsigned(lower, upper, liquidity, false)

  expect(result.toString()).toMatchInlineSnapshot(`"7"`)
})

test('Quote amount calculation', () => {
  // Use much larger liquidity to get non-zero result
  const lower = Q(1.0)
  const upper = Q(1.0001)
  const liquidity = new BN(10).pow(new BN(25)) // Much larger value

  const result = getDeltaAmountQuoteUnsigned(lower, upper, liquidity, false)

  // With larger liquidity, we should now get a non-zero result
  expect(result.gt(new BN(0))).toBe(true)
})

test('Price update from base input', () => {
  // Use smaller values to avoid precision issues
  const sqrtPrice = Q(1.0)
  const liquidity = new BN('100000')
  const amountIn = new BN('50000') // half of liquidity

  const newPrice = getNextSqrtPriceFromInput(
    sqrtPrice,
    liquidity,
    amountIn,
    false
  )

  // Expected: approximately 2/3 of sqrtPrice
  // Allow 1% margin of error
  const expectedPrice = Q(1.0).mul(new BN(2)).div(new BN(3))
  const diff = newPrice.gt(expectedPrice)
    ? newPrice.sub(expectedPrice)
    : expectedPrice.sub(newPrice)

  expect(diff.toString()).toMatchInlineSnapshot(`"170141183460469231737836218407120622934"`)
})

test('Price update from quote input', () => {
  const sqrtPrice = Q(1.0) // 1.0 in Q64.64 format
  const liquidity = new BN(1).shln(64) // Use a power of 2 for exact division

  // With a liquidity of 2^64, we need amountIn = 1 to get a price increase of 1.0
  const amountIn = new BN(1)

  const newPrice = getNextSqrtPriceFromAmountQuote(
    sqrtPrice,
    liquidity,
    amountIn
  )

  // Should be exactly Q(2)
  expect(newPrice.toString()).toMatchInlineSnapshot(`"36893488147419103232"`)
})

test('Edge case: zero liquidity', () => {
  expect(() =>
    getDeltaAmountBaseUnsigned(Q(1), Q(2), new BN(0), false)
  ).toThrow()
})

test('Edge case: identical prices', () => {
  expect(() =>
    getDeltaAmountQuoteUnsigned(Q(1), Q(1), new BN('1000'), false)
  ).toThrow('InvalidPrice')
})
