import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
import { Decimal } from 'decimal.js'

interface TokenomicsChartProps {
  liquidityPoints?: Array<{ sqrtPrice: string; liquidity: string }>
  sqrtStartPrice?: string
  height?: number
  quoteDecimals?: number
  baseDecimals?: number
  showLiquidity?: boolean
  showPrice?: boolean
  lineColor?: string
  showAnalytics?: boolean
  showExplanation?: boolean
  migrationQuoteThreshold
}

interface ChartDataPoint {
  label: string
  liquidity: number
  price: number
  sqrtPrice: string
  rawLiquidity?: string
  isPricePoint?: boolean
  isThresholdPoint?: boolean
}

interface PoolAnalytics {
  initialPrice: number
  finalPrice: number
  priceGrowthMultiple: number
  pointCount: number
  swapBaseAmount?: number
  migrationBaseAmount?: number
  thresholdPrice?: number
  totalLiquidity: number
}

export default function TokenomicsChart({
  liquidityPoints = [],
  sqrtStartPrice = '4295048016',
  height = 250,
  quoteDecimals = 9,
  baseDecimals = 6,
  showLiquidity = true,
  showPrice = true,
  lineColor = '#3b82f6',
  showAnalytics = true,
  showExplanation = true,
  migrationQuoteThreshold,
}: TokenomicsChartProps) {
  // Check if we have any data to display
  if (liquidityPoints.length === 0) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <div className="flex items-center justify-center h-full text-gray-400">
          No data to display
        </div>
      </ResponsiveContainer>
    )
  }

  // Process data once for both chart and analytics
  const { chartData, analytics: poolAnalytics } = processPoolData(
    liquidityPoints,
    sqrtStartPrice,
    quoteDecimals,
    baseDecimals,
    migrationQuoteThreshold
  )

  // Format liquidity with base decimals
  const formatLiquidityValue = (value: number) =>
    formatLiquidity(value, baseDecimals)

  return (
    <div className="w-full">
      {/* Analytics overlay */}
      {showAnalytics && poolAnalytics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4 text-xs text-center">
          <div className="bg-white/5 p-2 rounded">
            <div className="text-gray-400">Initial Price</div>
            <div className="font-bold truncate">
              {formatPrice(poolAnalytics.initialPrice)}
            </div>
          </div>
          <div className="bg-white/5 p-2 rounded">
            <div className="text-gray-400">Price Range</div>
            <div className="font-bold truncate">
              {poolAnalytics.priceGrowthMultiple > 0
                ? formatPriceRange(poolAnalytics.priceGrowthMultiple)
                : 'N/A'}
            </div>
          </div>
          {poolAnalytics.swapBaseAmount !== undefined && (
            <div className="bg-white/5 p-2 rounded">
              <div className="text-gray-400">Swap Base Amount</div>
              <div className="font-bold truncate">
                {formatAmount(poolAnalytics.swapBaseAmount, baseDecimals)}
              </div>
            </div>
          )}
          {poolAnalytics.migrationBaseAmount !== undefined && (
            <div className="bg-white/5 p-2 rounded">
              <div className="text-gray-400">Migration Base Amount</div>
              <div className="font-bold truncate">
                {formatAmount(poolAnalytics.migrationBaseAmount, baseDecimals)}
              </div>
            </div>
          )}
          {poolAnalytics.thresholdPrice !== undefined && (
            <div className="bg-white/5 p-2 rounded">
              <div className="text-gray-400">{`Threshold Price (${formatAmount(
                migrationQuoteThreshold / 10 ** quoteDecimals
              )} SOL)`}</div>
              <div className="font-bold truncate">
                {formatPrice(poolAnalytics.thresholdPrice)}
              </div>
            </div>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.1)"
          />
          <XAxis
            dataKey="label"
            height={0}
            tick={false}
            tickLine={false}
            axisLine={false}
          />
          {showLiquidity && (
            <YAxis
              yAxisId="left"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickFormatter={(value) => formatLiquidityValue(value)}
              width={50}
              label={{
                value: 'Liquidity',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: 'rgba(255,255,255,0.6)',
                fontSize: 10,
              }}
            />
          )}
          {showPrice && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickFormatter={(value) => formatPrice(value)}
              width={50}
              label={{
                value: 'Price',
                angle: 90,
                position: 'insideRight',
                offset: 10,
                fill: 'rgba(255,255,255,0.6)',
                fontSize: 10,
              }}
              domain={
                poolAnalytics
                  ? [
                      poolAnalytics.initialPrice * 0.95,
                      poolAnalytics.thresholdPrice
                        ? poolAnalytics.thresholdPrice * 1.05
                        : poolAnalytics.initialPrice * 1.2,
                    ]
                  : ['auto', 'auto']
              }
              scale="linear"
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(13, 17, 28, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              padding: '8px 12px',
            }}
            itemStyle={{ color: 'white' }}
            labelStyle={{
              color: 'white',
              fontWeight: 'bold',
              marginBottom: '5px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'liquidity') {
                return [null, null]
              }
              if (name === 'price') {
                return [formatPrice(value), 'Price']
              }
              return [formatPrice(value), '']
            }}
            labelFormatter={(label) => `Position: ${label}`}
          />
          {showLiquidity && (
            <Area
              yAxisId="left"
              dataKey="liquidity"
              fill="url(#liquidityGradient)"
              stroke="#a855f7"
              strokeWidth={1}
              type="stepAfter"
              name="liquidity"
            />
          )}
          {showPrice && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={(props) => {
                if (props.payload?.isThresholdPoint) {
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={6}
                      fill="#ff9800"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  )
                }
                return props.payload?.isPricePoint ? (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={lineColor}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                ) : null
              }}
              activeDot={{ r: 4, strokeWidth: 1 }}
              name="price"
            />
          )}
          {poolAnalytics?.thresholdPrice && (
            <ReferenceLine
              yAxisId="right"
              y={poolAnalytics.thresholdPrice}
              stroke="#ff9800"
              strokeDasharray="3 3"
              label={{
                value: `${formatAmount(
                  migrationQuoteThreshold / 10 ** quoteDecimals
                )} SOL`,
                fill: '#ff9800',
                fontSize: 10,
                position: 'insideBottomRight',
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Optional explanation */}
      {showExplanation && (
        <div className="mt-3 text-xs text-gray-400 overflow-hidden">
          <p className="text-wrap break-words">
            Each point represents a segment in your liquidity curve. Higher
            liquidity at a price point means more tokens available at that
            price.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Convert sqrt price to actual price with proper decimal handling
 */
function sqrtPriceToPrice(
  sqrtPrice: string,
  quoteDecimals: number = 9,
  baseDecimals: number = 6
): number {
  try {
    // Convert to Decimal for calculation
    const sqrtPriceDec = Decimal(sqrtPrice)

    // Square the sqrt price
    const priceSquared = sqrtPriceDec.mul(sqrtPriceDec)

    // Apply decimal adjustment: 10^(baseDecimals - quoteDecimals)
    const decimalAdjustment = Decimal(10).pow(baseDecimals - quoteDecimals)

    // Divide by 2^128 (right shift by 128 bits)
    // Using Decimal.js, we divide by 2^128
    const divisor = Decimal(2).pow(128)

    // Calculate final price with the correct formula
    const finalPrice = priceSquared.mul(decimalAdjustment).div(divisor)

    return Number(finalPrice.toString())
  } catch (e) {
    console.error('Error converting sqrt price:', e)
    return 0
  }
}

/**
 * Normalize liquidity values with respect to base token decimals
 */
function normalizeLiquidity(
  liquidityStr: string,
  baseDecimals: number = 6
): number {
  try {
    // First, parse the liquidity as a BigInt
    const liquidityBigInt = BigInt(liquidityStr)

    // Token decimal adjustment
    const decimalDivisor = BigInt(10) ** BigInt(baseDecimals)

    // Return the fully normalized value
    return Number(liquidityBigInt / decimalDivisor)
  } catch (e) {
    console.error('Error normalizing liquidity:', e)
    // Fallback to simple conversion
    return Number(liquidityStr)
  }
}

/**
 * Process data for chart and analytics in one place
 */
function processPoolData(
  liquidityPoints: Array<{ sqrtPrice: string; liquidity: string }>,
  sqrtStartPrice: string,
  quoteDecimals: number,
  baseDecimals: number,
  migrationQuoteThresholds: number
): {
  chartData: ChartDataPoint[]
  analytics: PoolAnalytics | null
} {
  // Initialize return data
  const chartData: ChartDataPoint[] = []
  let analytics: PoolAnalytics | null = null

  if (!liquidityPoints || liquidityPoints.length === 0) {
    return { chartData, analytics }
  }

  try {
    // Calculate initial price
    const initialPrice = sqrtPriceToPrice(
      sqrtStartPrice,
      quoteDecimals,
      baseDecimals
    )

    // Filter out invalid points
    const validPoints = liquidityPoints.filter(
      (point) => point.liquidity !== '0' && point.sqrtPrice
    )

    if (validPoints.length === 0) {
      // No valid points, return just the initial price
      chartData.push({
        label: 'P₀',
        liquidity: 0,
        price: initialPrice,
        sqrtPrice: sqrtStartPrice,
      })
      return { chartData, analytics }
    }

    // Calculate base token amounts first
    const { swapBaseAmount, migrationBaseAmount } = getMinimumBaseTokenForCurve(
      migrationQuoteThresholds,
      sqrtStartPrice,
      liquidityPoints,
      baseDecimals
    )

    // Calculate the threshold price
    const thresholdPriceResult = calculateThresholdPrice(
      sqrtStartPrice,
      migrationQuoteThresholds,
      validPoints,
      quoteDecimals,
      baseDecimals
    )

    // Add the initial price point with swapBaseAmount as liquidity
    chartData.push({
      label: 'P₀',
      liquidity: swapBaseAmount, // Use swapBaseAmount instead of firstPointLiquidity
      price: initialPrice,
      sqrtPrice: sqrtStartPrice,
      isPricePoint: true,
    })

    // Only add the threshold point if it's valid, and label it as P₁
    if (thresholdPriceResult.price > 0) {
      chartData.push({
        label: 'P₁',
        liquidity: swapBaseAmount, // Use swapBaseAmount here too
        price: thresholdPriceResult.price,
        sqrtPrice: thresholdPriceResult.sqrtPrice,
        isPricePoint: true,
        isThresholdPoint: true,
      })
    }

    // Calculate analytics
    if (validPoints.length > 0) {
      analytics = {
        initialPrice,
        finalPrice: thresholdPriceResult.price,
        priceGrowthMultiple: thresholdPriceResult.price / initialPrice,
        totalLiquidity: swapBaseAmount, // Update totalLiquidity too
        pointCount: validPoints.length,
        swapBaseAmount,
        migrationBaseAmount,
        thresholdPrice:
          thresholdPriceResult.price > 0
            ? thresholdPriceResult.price
            : undefined,
      }
    }
  } catch (e) {
    console.error('Error processing pool data:', e)
  }

  return { chartData, analytics }
}

/**
 * Format price for display
 */
function formatPrice(value: number): string {
  if (value === 0) return '0'

  // For very small numbers, use scientific notation
  if (value < 0.0000001) {
    return value.toExponential(6)
  }

  // For normal size numbers
  return value.toLocaleString('en-US', {
    maximumFractionDigits: value < 0.01 ? 8 : 4,
  })
}

/**
 * Format liquidity for display
 */
function formatLiquidity(value: number, baseDecimals: number = 6): string {
  if (value === 0) return '0'

  // For very small amounts
  if (value < 0.0001) {
    return value.toExponential(4)
  }

  // Handle large values with appropriate suffixes
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }

  // For normal values, show appropriate decimal places
  const decimalPlaces = value < 1 ? Math.min(baseDecimals, 6) : 2
  return value.toFixed(decimalPlaces)
}

/**
 * Format price growth multiple for display
 */
function formatPriceRange(multiple: number): string {
  if (multiple > 1000000) {
    return `${(multiple / 1000000).toFixed(2)}M×`
  }
  if (multiple > 1000) {
    return `${(multiple / 1000).toFixed(2)}K×`
  }
  return `${multiple.toFixed(1)}×`
}

/**
 * Format a token amount with proper decimal handling
 */
function formatAmount(value: number, decimals: number = 6): string {
  if (value === 0) return '0'

  // For very small amounts
  if (value < 0.0001) {
    return value.toExponential(4)
  }

  // Handle large values with appropriate suffixes
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }

  // For normal values, show appropriate decimal places
  const decimalPlaces = value < 1 ? Math.min(decimals, 6) : 2
  return value.toFixed(decimalPlaces)
}

/**
 * Calculate the price at which a specific migration threshold would be reached
 * Implementation mirrors the Rust get_migration_threshold_price function
 */
function getMigrationThresholdPrice(
  migrationThreshold: number,
  sqrtStartPrice: string,
  curve: Array<{ sqrtPrice: string; liquidity: string }>
): string {
  try {
    if (curve.length === 0 || !curve[0].liquidity) {
      return sqrtStartPrice
    }

    let nextSqrtPrice = Decimal(sqrtStartPrice)

    // Calculate total amount of quote tokens to move from start price to first curve point
    const totalAmount = getDeltaAmountQuote(
      nextSqrtPrice,
      Decimal(curve[0].sqrtPrice),
      Decimal(curve[0].liquidity),
      true // Round up
    )

    if (totalAmount.greaterThan(migrationThreshold)) {
      // If first segment exceeds threshold, calculate intermediate price
      nextSqrtPrice = getNextSqrtPriceFromInput(
        nextSqrtPrice,
        Decimal(curve[0].liquidity),
        Decimal(migrationThreshold),
        false // baseForQuote = false (quote for base)
      )
    } else {
      // Otherwise, move through curve segments until threshold is met
      const amountToUse = Math.min(
        Number(totalAmount.toString()),
        migrationThreshold
      )
      let amountLeft = Decimal(migrationThreshold).minus(amountToUse)
      nextSqrtPrice = Decimal(curve[0].sqrtPrice)

      for (let i = 1; i < curve.length; i++) {
        const maxAmount = getDeltaAmountQuote(
          nextSqrtPrice,
          Decimal(curve[i].sqrtPrice),
          Decimal(curve[i].liquidity),
          true
        )

        if (maxAmount.greaterThan(amountLeft)) {
          // If current segment has enough liquidity, calculate the exact price
          nextSqrtPrice = getNextSqrtPriceFromInput(
            nextSqrtPrice,
            Decimal(curve[i].liquidity),
            amountLeft,
            false // baseForQuote = false (quote for base)
          )
          amountLeft = Decimal(0)
          break
        } else {
          // Otherwise, consume this segment and continue
          amountLeft = amountLeft.minus(maxAmount)
          nextSqrtPrice = Decimal(curve[i].sqrtPrice)
        }
      }

      // Check if we were able to fulfill the entire threshold
      // This mirrors the Rust require!(amount_left == 0, PoolError::NotEnoughLiquidity)
      if (!amountLeft.isZero()) {
        throw new Error('Not enough liquidity to reach migration threshold')
      }
    }

    return nextSqrtPrice.toString()
  } catch (e) {
    console.error('Error calculating migration threshold price:', e)
    return sqrtStartPrice // Return original price on error
  }
}

/**
 * Calculate the amount of quote tokens needed for a price change
 * Implements the equivalent of get_delta_amount_quote_unsigned_256 from Rust
 */
function getDeltaAmountQuote(
  sqrtPrice0: Decimal,
  sqrtPrice1: Decimal,
  liquidity: Decimal,
  roundUp: boolean
): Decimal {
  try {
    // Calculate delta_sqrt_price (upper - lower)
    const deltaSqrtPrice = sqrtPrice1.minus(sqrtPrice0)

    // Multiply liquidity by delta_sqrt_price
    const product = liquidity.mul(deltaSqrtPrice)

    // Division by 2^(RESOLUTION*2) = 2^128
    const divisor = Decimal(2).pow(128)

    // Apply appropriate rounding
    if (roundUp) {
      return product.div(divisor).ceil()
    } else {
      return product.div(divisor).floor()
    }
  } catch (e) {
    console.error('Error calculating delta quote amount:', e)
    return Decimal(0)
  }
}

/**
 * Calculate the new sqrt price after adding a specific amount of tokens
 * Implements the equivalent of get_next_sqrt_price_from_input from Rust
 */
function getNextSqrtPriceFromInput(
  sqrtPrice: Decimal,
  liquidity: Decimal,
  amountIn: Decimal,
  baseForQuote: boolean
): Decimal {
  try {
    // Validate inputs
    if (sqrtPrice.isZero() || liquidity.isZero()) {
      throw new Error('Price or liquidity cannot be zero')
    }

    if (baseForQuote) {
      // Swapping base token for quote token (X→Y)
      // Formula: new_sqrt_price = liquidity * sqrt_price / (liquidity + amount * sqrt_price)
      const product = amountIn.mul(sqrtPrice)
      const denominator = liquidity.add(product)

      // Use ceiling rounding to match Rust's Rounding::Up behavior
      return liquidity.mul(sqrtPrice).div(denominator).ceil()
    } else {
      // Swapping quote token for base token (Y→X)
      // Formula: new_sqrt_price = sqrt_price + amount * 2^128 / liquidity
      // This matches Rust's safe_shl((RESOLUTION * 2) where RESOLUTION is 64
      const quotient = amountIn.mul(Decimal(2).pow(128)).div(liquidity)

      // Use floor rounding to match Rust's behavior for this case
      return sqrtPrice.plus(quotient)
    }
  } catch (e) {
    console.error('Error calculating next sqrt price:', e)
    return sqrtPrice // Return original on error
  }
}

/**
 * Calculate migration base token amount for constant product
 */
function getMigrationBaseTokenForConstantProduct(
  migrationThreshold: number,
  sqrtMigrationPrice: string
): number {
  try {
    // Convert sqrtMigrationPrice to decimal
    const sqrtPriceDec = Decimal(sqrtMigrationPrice)

    // In Uniswap V3, the amount calculation follows the formula:
    // baseAmount = quoteAmount / price
    // Where price = (sqrtPrice/2^64)^2

    // Calculate price
    const divisor = Decimal(2).pow(128)
    const price = sqrtPriceDec.mul(sqrtPriceDec).div(divisor)

    // Calculate base token amount
    const migrationBaseAmount = Decimal(migrationThreshold).div(price)

    return Number(migrationBaseAmount.floor().toString())
  } catch (e) {
    console.error('Error calculating migration base token amount:', e)
    return 0
  }
}

/**
 * Calculate base token amount needed for swap
 */
function getBaseTokenForSwap(
  sqrtStartPrice: string,
  sqrtMigrationPrice: string,
  curve: Array<{ sqrtPrice: string; liquidity: string }>
): number {
  try {
    // This is a simplified implementation
    // In a real implementation, this would calculate the amount of base tokens needed
    // to move the price from sqrtStartPrice to sqrtMigrationPrice based on the curve

    // For now, use a simple estimation based on the price difference and liquidity
    if (curve.length === 0) {
      return 0
    }

    const startPriceDec = Decimal(sqrtStartPrice)
    const migrationPriceDec = Decimal(sqrtMigrationPrice)

    // If migration price is lower than start price, no base tokens are needed
    if (migrationPriceDec.lte(startPriceDec)) {
      return 0
    }

    // Get the liquidity from the first point as a simple approximation
    const liquidityDec = Decimal(curve[0].liquidity)

    // Calculate base token amount (simplified)
    // This is just an approximation for demonstration
    const priceDiff = migrationPriceDec.sub(startPriceDec)
    const baseAmount = priceDiff
      .mul(liquidityDec)
      .div(startPriceDec.mul(migrationPriceDec))

    return Number(baseAmount.floor().toString())
  } catch (e) {
    console.error('Error calculating base token for swap:', e)
    return 0
  }
}

/**
 * Calculate minimum base token for curve
 */
function getMinimumBaseTokenForCurve(
  migrationThreshold: number,
  sqrtStartPrice: string,
  curve: Array<{ sqrtPrice: string; liquidity: string }>,
  baseDecimals: number
): { swapBaseAmount: number; migrationBaseAmount: number } {
  try {
    const sqrtMigrationPrice = getMigrationThresholdPrice(
      migrationThreshold,
      sqrtStartPrice,
      curve
    )
    const migrationBaseAmount = getMigrationBaseTokenForConstantProduct(
      migrationThreshold,
      sqrtMigrationPrice
    )
    const swapBaseAmount = getBaseTokenForSwap(
      sqrtStartPrice,
      sqrtMigrationPrice,
      curve
    )

    return {
      swapBaseAmount: swapBaseAmount / 10 ** baseDecimals,
      migrationBaseAmount: migrationBaseAmount / 10 ** baseDecimals,
    }
  } catch (e) {
    console.error('Error calculating minimum base token for curve:', e)
    return { swapBaseAmount: 0, migrationBaseAmount: 0 }
  }
}

/**
 * Calculate the price at which the quote threshold amount is reached
 * This implementation mirrors the Rust get_migration_threshold_price function
 */
function calculateThresholdPrice(
  sqrtStartPrice: string,
  quoteThreshold: number,
  liquidityPoints: Array<{ sqrtPrice: string; liquidity: string }>,
  quoteDecimals: number = 9,
  baseDecimals: number = 6
): { price: number; sqrtPrice: string } {
  try {
    if (liquidityPoints.length === 0) {
      return { price: 0, sqrtPrice: '0' }
    }

    // This is the exact same algorithm as getMigrationThresholdPrice
    // but returns both the sqrtPrice and the actual price
    let nextSqrtPrice = Decimal(sqrtStartPrice)

    // Calculate total amount of quote tokens to move from start price to first curve point
    const totalAmount = getDeltaAmountQuote(
      Decimal(sqrtStartPrice),
      Decimal(liquidityPoints[0].sqrtPrice),
      Decimal(liquidityPoints[0].liquidity),
      true // Round up
    )

    if (totalAmount.greaterThan(quoteThreshold)) {
      // If first segment exceeds threshold, calculate intermediate price
      nextSqrtPrice = getNextSqrtPriceFromInput(
        nextSqrtPrice,
        Decimal(liquidityPoints[0].liquidity),
        Decimal(quoteThreshold),
        false // isExactIn
      )
    } else {
      // Otherwise, move through curve segments until threshold is met
      let amountLeft = Decimal(quoteThreshold).minus(totalAmount)
      nextSqrtPrice = Decimal(liquidityPoints[0].sqrtPrice)

      for (let i = 1; i < liquidityPoints.length; i++) {
        const maxAmount = getDeltaAmountQuote(
          Decimal(liquidityPoints[i].sqrtPrice),
          nextSqrtPrice,
          Decimal(liquidityPoints[i].liquidity),
          true // Round up
        )

        if (maxAmount.greaterThan(amountLeft)) {
          // If current segment has enough liquidity, calculate the exact price
          nextSqrtPrice = getNextSqrtPriceFromInput(
            nextSqrtPrice,
            Decimal(liquidityPoints[i].liquidity),
            amountLeft,
            false // isExactIn
          )
          amountLeft = Decimal(0)
          break
        } else {
          // Otherwise, consume this segment and continue
          amountLeft = amountLeft.minus(maxAmount)
          nextSqrtPrice = Decimal(liquidityPoints[i].sqrtPrice)
        }
      }

      // Check if we were able to fulfill the entire threshold
      if (!amountLeft.isZero()) {
        console.warn('Not enough liquidity to reach quote threshold')
        return {
          price: 0,
          sqrtPrice: '0',
        }
      }
    }

    // Convert the calculated sqrtPrice to actual price only at the end
    const thresholdPrice = sqrtPriceToPrice(
      nextSqrtPrice.toString(),
      quoteDecimals,
      baseDecimals
    )

    return {
      price: thresholdPrice,
      sqrtPrice: nextSqrtPrice.toString(),
    }
  } catch (e) {
    console.error('Error calculating threshold price:', e)
    return { price: 0, sqrtPrice: '0' }
  }
}
