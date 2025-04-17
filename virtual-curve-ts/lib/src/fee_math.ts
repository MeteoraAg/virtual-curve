import BN from 'bn.js'
import type { DynamicFeeConfig, PoolFeesConfig } from './types'

// Constants matching Rust implementation
export const MAX_EXPONENTIAL = 0x80000 // 1048576
export const SCALE_OFFSET = 64
export const ONE = new BN(1).shln(SCALE_OFFSET)
export const BASIS_POINT_MAX = new BN(10000)

/**
 * Calculate fee for exponential decay: cliff_fee_numerator * (1-reduction_factor/10_000)^passed_period
 */
export function getFeeInPeriod(
  cliffFeeNumerator: BN,
  reductionFactor: BN,
  passedPeriod: BN
): BN {
  // Make bin_step into Q64x64, and divided by BASIS_POINT_MAX
  const bps = reductionFactor.shln(SCALE_OFFSET).div(BASIS_POINT_MAX)

  // Add 1 to bps, we get 1.0001 in Q64.64
  const base = ONE.sub(bps)

  // Calculate power
  const result = pow(base, passedPeriod.toNumber())
  if (!result) {
    throw new Error('MathOverflow')
  }

  // Calculate final fee
  const fee = result.mul(cliffFeeNumerator).shrn(SCALE_OFFSET)

  return fee
}

/**
 * Power function matching Rust implementation exactly
 */
export function pow(base: BN, exp: number): BN | null {
  // If exponent is negative. We will invert the result later by 1 / base^exp.abs()
  let invert = exp < 0

  // When exponential is 0, result will always be 1
  if (exp === 0) {
    return ONE
  }

  // Make the exponential positive
  exp = Math.abs(exp)

  // No point to continue the calculation as it will overflow
  if (exp >= MAX_EXPONENTIAL) {
    return null
  }

  let squaredBase = base
  let result = ONE

  // When multiply the base twice, the number of bits double from 128 -> 256, which overflow.
  // The trick here is to inverse the calculation, which make the upper 64 bits (number bits) to be 0s.
  if (squaredBase.gte(result)) {
    // This inverse the base: 1 / base
    squaredBase = new BN(2).pow(new BN(128)).sub(new BN(1)).div(squaredBase)
    // If exponent is negative, the above already inverted the result
    invert = !invert
  }

  // Binary exponentiation implementation matching Rust exactly
  if (exp & 0x1) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x2) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x4) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x8) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x10) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x20) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x40) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x80) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x100) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x200) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x400) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x800) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x1000) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x2000) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x4000) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x8000) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x10000) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x20000) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  squaredBase = squaredBase.mul(squaredBase).shrn(SCALE_OFFSET)
  if (exp & 0x40000) {
    result = result.mul(squaredBase).shrn(SCALE_OFFSET)
  }

  // Stop here as the next is 20th bit, which > MAX_EXPONENTIAL
  if (result.isZero()) {
    return null
  }

  if (invert) {
    result = new BN(2).pow(new BN(128)).sub(new BN(1)).div(result)
  }

  return result
}
