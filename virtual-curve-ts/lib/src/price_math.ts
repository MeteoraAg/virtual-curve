import BN from 'bn.js'
import { pow } from './fee_math'

// Constants matching Rust implementation
export const BASIS_POINT_MAX = new BN(10_000)
export const SCALE_OFFSET = 64
export const ONE = new BN(1).shln(SCALE_OFFSET)

/**
 * Calculate price based on the given bin id. Eg: 1.0001 ^ 5555. The returned value is in Q64.64
 * Matches Rust's get_price_from_id function
 */
export function getPriceFromId(activeId: number, binStep: number): BN {
  // Make bin_step into Q64x64, and divided by BASIS_POINT_MAX
  // If bin_step = 1, we get 0.0001 in Q64x64
  const bps = new BN(binStep).shln(SCALE_OFFSET).div(BASIS_POINT_MAX)

  // Add 1 to bps, we get 1.0001 in Q64.64
  const base = ONE.add(bps)

  // Calculate power and handle potential null result
  const result = pow(base, activeId)
  if (!result) {
    throw new Error('MathOverflow')
  }

  return result
}
