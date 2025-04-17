import { test, expect } from 'bun:test'
import { createMockPoolAndConfig, Q, TestPools } from './test-helpers'
import { BN } from 'bn.js'

test('createMockPoolAndConfig with custom parameters', () => {
  const baseReserve = new BN('2000000000000')
  const quoteReserve = new BN('1000000000000')

  const { pool, config } = createMockPoolAndConfig({
    baseReserve,
    quoteReserve,
    poolType: 1,
    cliffFeeNumerator: new BN(30), // 0.3% fee
    protocolFeePercent: 20,
  })

  expect(pool.quoteReserve.eq(quoteReserve)).toBe(true)
  expect(pool.poolType).toBe(1)
  expect(config.poolFees.baseFee.cliffFeeNumerator.eq(new BN(30))).toBe(true)
  expect(config.poolFees.protocolFeePercent).toBe(20)
})

test('TestPools.createBalancedPool', () => {
  const customReserve = new BN('5000000000000')
  const { pool } = TestPools.createBalancedPool(customReserve)

  expect(pool.baseReserve.eq(customReserve)).toBe(true)
  expect(pool.quoteReserve.eq(customReserve)).toBe(true)
  expect(pool.sqrtPrice.eq(Q(1.0))).toBe(true)
})

test('TestPools.createImbalancedPool', () => {
  const ratio = 2
  const { pool } = TestPools.createImbalancedPool(ratio)

  expect(pool.quoteReserve.eq(pool.baseReserve.mul(new BN(ratio)))).toBe(true)
  expect(pool.sqrtPrice.eq(Q(ratio))).toBe(true)
})

test('TestPools.createPoolWithFees', () => {
  const feePercent = 0.5
  const { config } = TestPools.createPoolWithFees(feePercent)

  expect(config.poolFees.baseFee.cliffFeeNumerator.eq(new BN(50))).toBe(true)
  expect(config.poolFees.protocolFeePercent).toBe(20)
})
