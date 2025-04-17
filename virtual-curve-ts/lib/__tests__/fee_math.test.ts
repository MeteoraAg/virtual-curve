import { test, expect } from 'bun:test'
import { getFeeInPeriod } from '../src/fee_math'
import BN from 'bn.js'

test('getFeeInPeriod calculation', () => {
  // Test case 1: No reduction
  const result1 = getFeeInPeriod(
    new BN(1000), // cliff fee
    new BN(0), // reduction factor
    new BN(1) // period
  )
  expect(result1.eq(new BN(1000))).toBe(true)

  // Test case 2: With reduction
  const result2 = getFeeInPeriod(
    new BN(1000), // cliff fee
    new BN(100), // 1% reduction factor
    new BN(1) // period
  )
  expect(result2.gt(new BN(989))).toBe(true)
  expect(result2.lt(new BN(991))).toBe(true)
})
