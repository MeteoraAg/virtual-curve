import BN from 'bn.js'

const U64_MAX = new BN('FFFFFFFFFFFFFFFF', 16) // 2^64 - 1

// Add precise Q64.64 handling constants
const Q64 = new BN(1).shln(64)
const Q128 = Q64.mul(Q64)

// Δa = L * (√P_upper - √P_lower) / (√P_upper * √P_lower)
export function getDeltaAmountBaseUnsigned(
  lowerSqrtPrice: BN,
  upperSqrtPrice: BN,
  liquidity: BN,
  roundUp: boolean
): BN {
  if (liquidity.isZero()) throw new Error('MathOverflow')
  if (lowerSqrtPrice.gte(upperSqrtPrice)) throw new Error('InvalidPrice')

  const result = getDeltaAmountBaseUnchecked(
    lowerSqrtPrice,
    upperSqrtPrice,
    liquidity,
    roundUp
  )

  if (result.gt(U64_MAX)) throw new Error('MathOverflow')
  return result
}

/**
 * Calculate delta amount base unsigned, matching Rust's get_delta_amount_base_unsigned_unchecked
 * Formula: L * (√P_upper - √P_lower) / (√P_upper * √P_lower)
 */
function getDeltaAmountBaseUnchecked(
  lowerSqrtPrice: BN,
  upperSqrtPrice: BN,
  liquidity: BN,
  roundUp: boolean
): BN {
  if (lowerSqrtPrice.isZero() || upperSqrtPrice.isZero()) {
    throw new Error('DivisionByZero')
  }

  // Calculate (√P_upper - √P_lower)
  const deltaSqrtPrice = upperSqrtPrice.sub(lowerSqrtPrice)

  // Calculate denominator: √P_upper * √P_lower
  const denominator = upperSqrtPrice.mul(lowerSqrtPrice)

  if (denominator.isZero()) {
    throw new Error('DivisionByZero')
  }

  // L * (√P_upper - √P_lower)
  const numerator = liquidity.mul(deltaSqrtPrice)

  if (roundUp) {
    return numerator.add(denominator.subn(1)).div(denominator)
  }
  return numerator.div(denominator)
}

// Δb = L (√P_upper - √P_lower)
export function getDeltaAmountQuoteUnsigned(
  lowerSqrtPrice: BN,
  upperSqrtPrice: BN,
  liquidity: BN,
  roundUp: boolean
): BN {
  if (liquidity.isZero()) throw new Error('MathOverflow')
  if (lowerSqrtPrice.gte(upperSqrtPrice)) throw new Error('InvalidPrice')

  const result = getDeltaAmountQuoteUnchecked(
    lowerSqrtPrice,
    upperSqrtPrice,
    liquidity,
    roundUp
  )
  if (result.gt(U64_MAX)) throw new Error('MathOverflow')
  return result
}

// Direct implementation of Rust's get_delta_amount_quote_unsigned_unchecked
export function getDeltaAmountQuoteUnchecked(
  lowerSqrtPrice: BN,
  upperSqrtPrice: BN,
  liquidity: BN,
  roundUp: boolean
): BN {
  const deltaPrice = upperSqrtPrice.sub(lowerSqrtPrice)

  // Match Rust's RESOLUTION constant
  const RESOLUTION = 64
  const shift = RESOLUTION * 2
  const denominator = new BN(1).shln(shift)

  // Use mulDivU256 for precise calculation
  const result = mulDiv(liquidity, deltaPrice, denominator, roundUp)

  return result
}

export function getNextSqrtPriceFromInput(
  sqrtPrice: BN,
  liquidity: BN,
  amountIn: BN,
  baseForQuote: boolean
): BN {
  if (liquidity.isZero()) throw new Error('MathOverflow')
  if (amountIn.isZero()) return sqrtPrice

  if (baseForQuote) {
    const product = amountIn.mul(sqrtPrice)

    const denominator = liquidity.add(product)

    const result = mulDiv(liquidity, sqrtPrice, denominator, true)
    return result
  } else {
    const quotient = amountIn.shln(128).div(liquidity)
    return sqrtPrice.add(quotient)
  }
}

export function getNextSqrtPriceFromAmountQuote(
  sqrtPrice: BN,
  liquidity: BN,
  amountIn: BN
): BN {
  if (liquidity.isZero()) throw new Error('MathOverflow')

  // Match Rust: shift by 128 bits (2*RESOLUTION)
  const scaled = amountIn.shln(128)
  const quotient = scaled.div(liquidity)

  return sqrtPrice.add(quotient)
}

/**
 * Matches Rust's mul_div_u256 function
 * Performs multiplication and division with precise rounding
 * Returns null if result overflows or denominator is zero
 */
export function mulDiv(x: BN, y: BN, denominator: BN, roundUp: boolean): BN {
  if (denominator.isZero()) {
    throw new Error('DivisionByZero')
  }

  // Use BN's built-in multiplication which handles large numbers
  const prod = x.mul(y)

  let result: BN
  if (roundUp) {
    // Match Rust's div_ceil behavior
    result = prod.add(denominator.sub(new BN(1))).div(denominator)
  } else {
    // Match Rust's div_rem behavior
    result = prod.div(denominator)
  }

  return result
}
