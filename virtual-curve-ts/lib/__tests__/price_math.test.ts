import { test, expect } from 'bun:test'
import { getPriceFromId, ONE } from '../src/price_math'
import BN from 'bn.js'

test('getPriceFromId calculation', () => {
  // Test case 1: Zero ID should return 1.0
  const result1 = getPriceFromId(0, 1)
  expect(result1.eq(ONE)).toBe(true)

  // Test case 2: Positive ID
  const result2 = getPriceFromId(100, 1)
  expect(result2.gt(ONE)).toBe(true)

  // Test case 3: Negative ID
  const result3 = getPriceFromId(-100, 1)
  expect(result3.lt(ONE)).toBe(true)

  // Test case 4: With larger bin step
  const result4 = getPriceFromId(1, 80) // 80bps
  expect(result4.gt(ONE)).toBe(true)

  // Log some results for manual verification
  console.log('Price Results:', {
    zeroId: result1.toString(),
    positiveId: result2.toString(),
    negativeId: result3.toString(),
    largerBinStep: result4.toString(),
  })
})

test('getPriceFromId error handling', () => {
  // Test for very large values that might cause overflow
  expect(() => getPriceFromId(1000000, 100)).toThrow('MathOverflow')
})
