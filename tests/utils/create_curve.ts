import BN from "bn.js";
import { ConfigParameters, LiquidityDistributionParameters, LockedVestingParams } from "../instructions";
import Decimal from "decimal.js";
import { MAX_SQRT_PRICE, MIN_SQRT_PRICE } from "./constants";
import { assert } from "chai";


function fromDecimalToBN(value: Decimal): BN {
    return new BN(value.floor().toFixed());
}
function getDeltaAmountBase(lowerSqrtPrice: BN, upperSqrtPrice: BN, liquidity: BN): BN {
    let numerator = liquidity.mul(upperSqrtPrice.sub(lowerSqrtPrice));
    let denominator = lowerSqrtPrice.mul(upperSqrtPrice);
    return numerator.add(denominator).sub(new BN(1)).div(denominator);
}
function getBaseTokenForSwap(
    sqrtStartPrice: BN,
    sqrtMigrationPrice: BN,
    curve: Array<LiquidityDistributionParameters>,
): BN {
    let totalAmount = new BN(0);
    for (let i = 0; i < curve.length; i++) {
        let lowerSqrtPrice = i == 0 ? sqrtStartPrice : curve[i - 1].sqrtPrice;
        if (curve[i].sqrtPrice.gt(sqrtMigrationPrice)) {
            let deltaAmount = getDeltaAmountBase(
                lowerSqrtPrice,
                sqrtMigrationPrice,
                curve[i].liquidity,
            );
            totalAmount = totalAmount.add(deltaAmount);
            break;
        } else {
            let deltaAmount = getDeltaAmountBase(
                lowerSqrtPrice,
                curve[i].sqrtPrice,
                curve[i].liquidity,
            );
            totalAmount = totalAmount.add(deltaAmount);
        }
    }
    return totalAmount;
}

// Original formula: price = (sqrtPrice >> 64)^2 * 10^(tokenADecimal - tokenBDecimal)
// Reverse formula: sqrtPrice = sqrt(price / 10^(tokenADecimal - tokenBDecimal)) << 64
export const getSqrtPriceFromPrice = (
    price: string,
    tokenADecimal: number,
    tokenBDecimal: number
): BN => {
    const decimalPrice = new Decimal(price);
    const adjustedByDecimals = decimalPrice.div(
        new Decimal(10 ** (tokenADecimal - tokenBDecimal))
    );
    const sqrtValue = Decimal.sqrt(adjustedByDecimals);
    const sqrtValueQ64 = sqrtValue.mul(Decimal.pow(2, 64));

    return new BN(sqrtValueQ64.floor().toFixed());
};

export const getPriceFromSqrtPrice = (
    sqrtPrice: BN,
    tokenADecimal: number,
    tokenBDecimal: number
): Decimal => {
    const decimalSqrtPrice = new Decimal(sqrtPrice.toString());
    const price = decimalSqrtPrice
        .mul(decimalSqrtPrice)
        .mul(new Decimal(10 ** (tokenADecimal - tokenBDecimal)))
        .div(Decimal.pow(2, 128));

    return price;
};




// Δa = L * (1 / √P_lower - 1 / √P_upper) => L = Δa / (1 / √P_lower - 1 / √P_upper)
export const getInitialLiquidityFromDeltaBase = (
    baseAmount: BN,
    sqrtMaxPrice: BN,
    sqrtPrice: BN,
): BN => {
    let priceDelta = sqrtMaxPrice.sub(sqrtPrice);
    let prod = baseAmount.mul(sqrtMaxPrice).mul(sqrtPrice);
    let liquidity = prod.div(priceDelta); // round down
    return liquidity;
}

// Δb = L (√P_upper - √P_lower) => L = Δb / (√P_upper - √P_lower)
export const getInitialLiquidityFromDeltaQuote = (
    quoteAmount: BN,
    sqrtMinPrice: BN,
    sqrtPrice: BN,
): BN => {
    let priceDelta = sqrtPrice.sub(sqrtMinPrice);
    quoteAmount = quoteAmount.shln(128);
    let liquidity = quoteAmount.div(priceDelta); // round down
    return liquidity;
}

export const getLiquidity = (
    baseAmount: BN,
    quoteAmount: BN,
    minSqrtPrice: BN,
    maxSqrtPrice: BN,
): BN => {
    let liquidityFromBase =
        getInitialLiquidityFromDeltaBase(baseAmount, maxSqrtPrice, minSqrtPrice);
    let liquidityFromQuote =
        getInitialLiquidityFromDeltaQuote(quoteAmount, minSqrtPrice, maxSqrtPrice);
    return BN.min(liquidityFromBase, liquidityFromQuote);
}

export const getFirstCurve = (migrationSqrPrice: BN, migrationAmount: BN, swapAmount: BN, migrationQuoteThreshold: BN) => {
    let sqrtStartPrice = migrationSqrPrice.mul(migrationAmount).div(swapAmount);
    let liquidity = getLiquidity(swapAmount, migrationQuoteThreshold, sqrtStartPrice, migrationSqrPrice);
    return {
        sqrtStartPrice,
        curve:
            [{
                sqrtPrice: migrationSqrPrice,
                liquidity,
            }]
    }
}


export const getTwoCurve = (migrationSqrPrice: BN, initialSqrtPrice: BN, swapAmount: BN, migrationQuoteThreshold: BN) => {
    let midSqrtPriceDecimal = (new Decimal(migrationSqrPrice.toString()).mul(new Decimal(initialSqrtPrice.toString()))).sqrt();
    let midSqrtPrice = new BN(midSqrtPriceDecimal.floor().toFixed());

    let p0 = new Decimal(initialSqrtPrice.toString());
    let p1 = new Decimal(midSqrtPrice.toString());
    let p2 = new Decimal(migrationSqrPrice.toString());

    let a1 = (new Decimal(1).div(p0)).sub((new Decimal(1).div(p1)))
    let b1 = (new Decimal(1).div(p1)).sub((new Decimal(1).div(p2)))
    let c1 = new Decimal(swapAmount.toString());

    let a2 = p1.sub(p0);
    let b2 = p2.sub(p1);
    let c2 = new Decimal(migrationQuoteThreshold.toString()).mul(Decimal.pow(2, 128));

    // solve equation to find l0 and l1
    let l0 = (c1.mul(b2).sub(c2.mul(b1))).div(a1.mul(b2).sub(a2.mul(b1)));
    let l1 = ((c1.mul(a2)).sub(c2.mul(a1))).div(b1.mul(a2).sub(b2.mul(a1)));
    return {
        sqrtStartPrice: initialSqrtPrice,
        curve:
            [
                {
                    sqrtPrice: midSqrtPrice,
                    liquidity: new BN(l0.floor().toFixed()),
                },
                {
                    sqrtPrice: migrationSqrPrice,
                    liquidity: new BN(l1.floor().toFixed()),
                }
            ]
    }
}

// Δb = L (√P_upper - √P_lower)
const getDeltaAmountQuote = (
    lowerSqrtPrice: BN,
    upperSqrtPrice: BN,
    liquidity: BN,
    round: String,
): BN => {
    let detalPrice = upperSqrtPrice.sub(lowerSqrtPrice);
    let prod = liquidity.mul(detalPrice);
    let denominator = new BN(1).shln(128);
    if (round == "U") {
        let result = (prod.add(denominator).sub(new BN(1))).div(denominator);
        return result;
    } else if (round == "D") {
        let result = prod.div(denominator);
        return result
    } else {
        throw Error("Invalid rounding")
    }
}

const getNextSqrtPriceFromInput = (
    sqrtPrice: BN,
    liquidity: BN,
    amountIn: BN,
    baseForQuote: boolean,
): BN => {
    // round to make sure that we don't pass the target price
    if (baseForQuote) {
        return getNextSqrtPriceFromAmountBaseRoundingUp(sqrtPrice, liquidity, amountIn)
    } else {
        return getNextSqrtPriceFromAmountQuoteRoundingDown(sqrtPrice, liquidity, amountIn)
    }
}

//  √P' = √P * L / (L + Δx * √P)
const getNextSqrtPriceFromAmountBaseRoundingUp = (
    sqrtPrice: BN,
    liquidity: BN,
    amount: BN,
): BN => {
    if (amount.isZero()) {
        return sqrtPrice;
    }
    let prod = sqrtPrice.mul(liquidity);
    let denominator = liquidity.add(amount.mul(sqrtPrice));
    let result = prod.add(denominator).sub(new BN(1)).div(denominator);
    return result
}

/// * `√P' = √P + Δy / L`
///
const getNextSqrtPriceFromAmountQuoteRoundingDown = (
    sqrtPrice: BN,
    liquidity: BN,
    amount: BN,
): BN => {
    return sqrtPrice.add(amount.shln(128).div(liquidity));
}

const getSqrtPriceFromMarketCap = (marketCap: number, totalSupply: number, tokenBaseDecimal: number,
    tokenQuoteDecimal: number): BN => {
    let price = new Decimal(marketCap).div(new Decimal(totalSupply));
    return getSqrtPriceFromPrice(price.toString(), tokenBaseDecimal, tokenQuoteDecimal)
}


const getMigrationThresholdPrice = (migrationThreshold: BN, sqrtStartPrice: BN, curve: Array<LiquidityDistributionParameters>): BN => {
    let nextSqrtPrice = sqrtStartPrice;
    let totalAmount = getDeltaAmountQuote(
        nextSqrtPrice,
        curve[0].sqrtPrice,
        curve[0].liquidity,
        "U"
    );
    if (totalAmount.gt(migrationThreshold)) {
        nextSqrtPrice = getNextSqrtPriceFromInput(
            nextSqrtPrice,
            curve[0].liquidity,
            migrationThreshold,
            false,
        );
    } else {
        let amountLeft = migrationThreshold.sub(totalAmount);
        nextSqrtPrice = curve[0].sqrtPrice;
        for (let i = 1; i < curve.length; i++) {
            let maxAmount = getDeltaAmountQuote(
                nextSqrtPrice,
                curve[i].sqrtPrice,
                curve[i].liquidity,
                "U"
            );
            if (maxAmount.gt(amountLeft)) {
                nextSqrtPrice = getNextSqrtPriceFromInput(
                    nextSqrtPrice,
                    curve[i].liquidity,
                    amountLeft,
                    false,
                );
                amountLeft = new BN(0);
                break;
            } else {
                amountLeft = amountLeft.sub(
                    maxAmount
                );
                nextSqrtPrice = curve[i].sqrtPrice
            }
        }
        if (!amountLeft.isZero()) {
            let migrationThresholdStr = migrationThreshold.toString();
            let amountLeftStr = amountLeft.toString();
            throw Error(`Not enough liquidity, migrationThreshold: ${migrationThresholdStr}  amountLeft: ${amountLeftStr}`)
        }
    }
    return nextSqrtPrice;
}

const getSwapAmountWithBuffer = (swapBaseAmount: BN, sqrtStartPrice: BN, curve: Array<LiquidityDistributionParameters>): BN => {
    let swapAmountBuffer = swapBaseAmount.add(swapBaseAmount.mul(new BN(25)).div(new BN(100)));
    let maxBaseAmountOnCurve =
        getBaseTokenForSwap(sqrtStartPrice, MAX_SQRT_PRICE, curve);
    return BN.min(swapAmountBuffer, maxBaseAmountOnCurve)
}

const getMigrationBaseToken = (migrationQuoteThreshold: BN, sqrtMigrationPrice: BN, migrationOption: number): BN => {
    if (migrationOption == 0) {
        let price = sqrtMigrationPrice.mul(sqrtMigrationPrice);
        let quote = migrationQuoteThreshold.shln(128);
        let { div, mod } = quote.divmod(price);
        if (!mod.isZero()) {
            div = div.add(new BN(1))
        }
        return div;
    } else if (migrationOption == 1) {
        let liquidity = getInitialLiquidityFromDeltaQuote(
            migrationQuoteThreshold,
            MIN_SQRT_PRICE,
            sqrtMigrationPrice,
        );
        // calculate base threshold
        let baseAmount = getDeltaAmountBase(
            sqrtMigrationPrice,
            MAX_SQRT_PRICE,
            liquidity,
        );
        return baseAmount
    } else {
        throw Error("Invalid migration option")
    }
}

export const getTotalSupplyFromCurve = (
    migrationQuoteThreshold: BN,
    sqrtStartPrice: BN,
    curve: Array<LiquidityDistributionParameters>,
    lockedVesting: LockedVestingParams,
    migrationOption: number,
    leftOver: BN,
): BN => {
    let sqrtMigrationPrice =
        getMigrationThresholdPrice(migrationQuoteThreshold, sqrtStartPrice, curve);
    let swapBaseAmount =
        getBaseTokenForSwap(sqrtStartPrice, sqrtMigrationPrice, curve);
    let swapBaseAmountBuffer =
        getSwapAmountWithBuffer(swapBaseAmount, sqrtStartPrice, curve);
    let migrationBaseAmount = getMigrationBaseToken(
        migrationQuoteThreshold,
        sqrtMigrationPrice,
        migrationOption
    );
    let totalVestingAmount = getTotalVestingAmount(lockedVesting);
    let minimumBaseSupplyWithBuffer = swapBaseAmountBuffer.add(migrationBaseAmount).add(totalVestingAmount).add(leftOver);
    return minimumBaseSupplyWithBuffer;
}

export const getTotalVestingAmount = (lockedVesting: LockedVestingParams): BN => {
    let totalVestingAmount = lockedVesting.cliffUnlockAmount.add(lockedVesting.amountPerPeriod.mul(lockedVesting.numberOfPeriod));
    return totalVestingAmount
}

export function designCurve(
    totalTokenSupply: number,
    percentageSupplyOnMigration: number,
    migrationQuoteThreshold: number,
    migrationOption: number,
    tokenBaseDecimal: number,
    tokenQuoteDecimal: number,
    creatorTradingFeePercentage: number,
    collectFeeMode: number,
    lockedVesting: LockedVestingParams,
): ConfigParameters {
    let migrationBaseSupply = new BN(totalTokenSupply).mul(new BN(percentageSupplyOnMigration)).div(new BN(100));

    let totalSupply = new BN(totalTokenSupply).mul(new BN(10).pow(new BN(tokenBaseDecimal)));
    let migrationQuoteThresholdWithDecimals = new BN(migrationQuoteThreshold * 10 ** tokenQuoteDecimal);

    let migrationPrice = new Decimal(migrationQuoteThreshold.toString()).div(new Decimal(migrationBaseSupply.toString()));
    let migrateSqrtPrice = getSqrtPriceFromPrice(migrationPrice.toString(), tokenBaseDecimal, tokenQuoteDecimal);

    let migrationBaseAmount = getMigrationBaseToken(new BN(migrationQuoteThresholdWithDecimals), migrateSqrtPrice, migrationOption);
    let totalVestingAmount = getTotalVestingAmount(lockedVesting);
    let swapAmount = totalSupply.sub(migrationBaseAmount).sub(totalVestingAmount);

    let { sqrtStartPrice, curve } = getFirstCurve(migrateSqrtPrice, migrationBaseAmount, swapAmount, migrationQuoteThresholdWithDecimals);

    let totalDynamicSupply = getTotalSupplyFromCurve(
        migrationQuoteThresholdWithDecimals,
        sqrtStartPrice,
        curve,
        lockedVesting,
        migrationOption,
        new BN(0),
    );

    let remainingAmount = totalSupply.sub(totalDynamicSupply);

    let lastLiquidity = getInitialLiquidityFromDeltaBase(
        remainingAmount,
        MAX_SQRT_PRICE,
        migrateSqrtPrice,
    );
    if (!lastLiquidity.isZero()) {
        curve.push({
            sqrtPrice: MAX_SQRT_PRICE,
            liquidity: lastLiquidity,
        });
    }

    const instructionParams: ConfigParameters = {
        poolFees: {
            baseFee: {
                cliffFeeNumerator: new BN(2_500_000),
                numberOfPeriod: 0,
                reductionFactor: new BN(0),
                periodFrequency: new BN(0),
                feeSchedulerMode: 0,
            },
            dynamicFee: null,
        },
        activationType: 0,
        collectFeeMode,
        migrationOption,
        tokenType: 0, // spl_token
        tokenDecimal: tokenBaseDecimal,
        migrationQuoteThreshold: migrationQuoteThresholdWithDecimals,
        partnerLpPercentage: 0,
        creatorLpPercentage: 0,
        partnerLockedLpPercentage: 100,
        creatorLockedLpPercentage: 0,
        sqrtStartPrice,
        lockedVesting,
        migrationFeeOption: 0,
        tokenSupply: {
            preMigrationTokenSupply: totalSupply,
            postMigrationTokenSupply: totalSupply,
        },
        creatorTradingFeePercentage,
        padding0: [],
        padding: [],
        curve,
    };
    return instructionParams;
}



export function designCurveWithInitialMarketCap(
    totalTokenSupply: number,
    initialMarketCap: number,
    migrationMarketCap: number,
    percentageSupplyOnMigration: number,
    migrationOption: number,
    tokenBaseDecimal: number,
    tokenQuoteDecimal: number,
    creatorTradingFeePercentage: number,
    collectFeeMode: number,
    lockedVesting: LockedVestingParams,
    leftOver: number,
): ConfigParameters {
    let migrationBaseSupply = new BN(totalTokenSupply).mul(new BN(percentageSupplyOnMigration)).div(new BN(100));

    let totalSupply = new BN(totalTokenSupply).mul(new BN(10).pow(new BN(tokenBaseDecimal)));
    let migrationQuoteThreshold = migrationMarketCap * percentageSupplyOnMigration / 100; // migrationMarketCap * migrationBaseSupply / totalTokenSupply
    let migrationQuoteThresholdWithDecimals = new BN(migrationQuoteThreshold * 10 ** tokenQuoteDecimal);

    let migrationPrice = new Decimal(migrationQuoteThreshold.toString()).div(new Decimal(migrationBaseSupply.toString()));
    let migrateSqrtPrice = getSqrtPriceFromPrice(migrationPrice.toString(), tokenBaseDecimal, tokenQuoteDecimal);

    let migrationBaseAmount = getMigrationBaseToken(new BN(migrationQuoteThresholdWithDecimals), migrateSqrtPrice, migrationOption);
    let totalVestingAmount = getTotalVestingAmount(lockedVesting);

    let totalLeftOver = new BN(leftOver * 10 ** tokenBaseDecimal);
    let swapAmount = totalSupply.sub(migrationBaseAmount).sub(totalVestingAmount).sub(totalLeftOver);

    let initialSqrtPrice = getSqrtPriceFromMarketCap(initialMarketCap, totalTokenSupply, tokenBaseDecimal, tokenQuoteDecimal);


    let { sqrtStartPrice, curve } = getTwoCurve(migrateSqrtPrice, initialSqrtPrice, swapAmount, migrationQuoteThresholdWithDecimals);


    let totalDynamicSupply = getTotalSupplyFromCurve(
        migrationQuoteThresholdWithDecimals,
        sqrtStartPrice,
        curve,
        lockedVesting,
        migrationOption,
        totalLeftOver,
    );

    if (totalDynamicSupply.gt(totalSupply)) {
        // precision loss is used for leftover
        let leftOverDelta = totalDynamicSupply.sub(totalSupply);
        assert(leftOverDelta.lt(totalLeftOver));
    }

    const instructionParams: ConfigParameters = {
        poolFees: {
            baseFee: {
                cliffFeeNumerator: new BN(2_500_000),
                numberOfPeriod: 0,
                reductionFactor: new BN(0),
                periodFrequency: new BN(0),
                feeSchedulerMode: 0,
            },
            dynamicFee: null,
        },
        activationType: 0,
        collectFeeMode,
        migrationOption,
        tokenType: 0, // spl_token
        tokenDecimal: tokenBaseDecimal,
        migrationQuoteThreshold: migrationQuoteThresholdWithDecimals,
        partnerLpPercentage: 0,
        creatorLpPercentage: 0,
        partnerLockedLpPercentage: 100,
        creatorLockedLpPercentage: 0,
        sqrtStartPrice,
        lockedVesting,
        migrationFeeOption: 0,
        tokenSupply: {
            preMigrationTokenSupply: totalSupply,
            postMigrationTokenSupply: totalSupply,
        },
        creatorTradingFeePercentage,
        padding0: [],
        padding: [],
        curve,
    };
    return instructionParams;
}


export function designGraphCurve(
    totalTokenSupply: number,
    initialMarketCap: number,
    migrationMarketCap: number,
    migrationOption: number,
    tokenBaseDecimal: number,
    tokenQuoteDecimal: number,
    creatorTradingFeePercentage: number,
    collectFeeMode: number,
    lockedVesting: LockedVestingParams,
    leftOver: number,
    liquidityWeights: number[],
): ConfigParameters {
    // 1. finding Pmax and Pmin
    let pMin = getSqrtPriceFromMarketCap(initialMarketCap, totalTokenSupply, tokenBaseDecimal, tokenQuoteDecimal);
    let pMax = getSqrtPriceFromMarketCap(migrationMarketCap, totalTokenSupply, tokenBaseDecimal, tokenQuoteDecimal);

    // find q^16 = pMax / pMin
    let priceRatio = new Decimal(pMax.toString()).div(new Decimal(pMin.toString()));
    let qDecimal = priceRatio.pow(new Decimal(1).div(new Decimal(16)));

    // finding all prices
    let sqrtPrices = [];
    let currentPrice = pMin;
    for (let i = 0; i < 17; i++) {
        sqrtPrices.push(currentPrice);
        currentPrice = fromDecimalToBN(qDecimal.mul(new Decimal(currentPrice.toString())));
    }

    let totalSupply = new BN(totalTokenSupply).mul(new BN(10).pow(new BN(tokenBaseDecimal)));
    let totalLeftover = new BN(leftOver).mul(new BN(10).pow(new BN(tokenBaseDecimal)));
    let totalVestingAmount = getTotalVestingAmount(lockedVesting);

    let totalSwapAndMigrationAmount = totalSupply.sub(totalVestingAmount).sub(totalLeftover);

    let sumFactor = new Decimal(0);
    let pmaxWeight = new Decimal(pMax.toString());
    for (let i = 1; i < 17; i++) {
        let pi = new Decimal(sqrtPrices[i].toString());
        let piMinus = new Decimal(sqrtPrices[i - 1].toString());
        let k = new Decimal(liquidityWeights[i - 1])
        let w1 = (pi.sub(piMinus)).div(pi.mul(piMinus));
        let w2 = (pi.sub(piMinus)).div(pmaxWeight.mul(pmaxWeight));
        let weight = k.mul(w1.add(w2));
        sumFactor = sumFactor.add(weight);
    }

    let l1 = new Decimal(totalSwapAndMigrationAmount.toString()).div(sumFactor);

    // construct curve
    let curve = [];
    for (let i = 0; i < 16; i++) {
        let k = new Decimal(liquidityWeights[i])
        let liquidity = fromDecimalToBN(l1.mul(k));
        let sqrtPrice = i < 15 ? sqrtPrices[i + 1] : pMax;
        curve.push({
            sqrtPrice,
            liquidity,
        })
    }
    // reverse to calculate swap amount and migration amount
    let swapBaseAmount =
        getBaseTokenForSwap(pMin, pMax, curve);
    let swapBaseAmountBuffer =
        getSwapAmountWithBuffer(swapBaseAmount, pMin, curve);

    let migrationAmount = totalSwapAndMigrationAmount.sub(swapBaseAmountBuffer);
    let percentate = migrationAmount.mul(new BN(100)).div(totalSupply)
    // console.log("swapBaseAmount %d swapBaseAmountBuffer %d", swapBaseAmount.div(new BN(10 ** tokenBaseDecimal)).toString(), swapBaseAmountBuffer.div(new BN(10 ** tokenBaseDecimal)).toString())
    console.log("migration percentate %d migrationAmount: %d", percentate.toString(), migrationAmount.div(new BN(10 ** tokenBaseDecimal)).toString());
    // calculate migration threshold
    let migrationQuoteThreshold = migrationAmount.mul(pMax).mul(pMax).shrn(128);


    // sanity check
    let totalDynamicSupply = getTotalSupplyFromCurve(
        migrationQuoteThreshold,
        pMin,
        curve,
        lockedVesting,
        migrationOption,
        totalLeftover,
    );

    if (totalDynamicSupply.gt(totalSupply)) {
        // precision loss is used for leftover
        let leftOverDelta = totalDynamicSupply.sub(totalSupply);
        assert(leftOverDelta.lt(totalLeftover));
    }


    const instructionParams: ConfigParameters = {
        poolFees: {
            baseFee: {
                cliffFeeNumerator: new BN(2_500_000),
                numberOfPeriod: 0,
                reductionFactor: new BN(0),
                periodFrequency: new BN(0),
                feeSchedulerMode: 0,
            },
            dynamicFee: null,
        },
        activationType: 0,
        collectFeeMode,
        migrationOption,
        tokenType: 0, // spl_token
        tokenDecimal: tokenBaseDecimal,
        migrationQuoteThreshold,
        partnerLpPercentage: 0,
        creatorLpPercentage: 0,
        partnerLockedLpPercentage: 100,
        creatorLockedLpPercentage: 0,
        sqrtStartPrice: pMin,
        lockedVesting,
        migrationFeeOption: 0,
        tokenSupply: {
            preMigrationTokenSupply: totalSupply,
            postMigrationTokenSupply: totalSupply,
        },
        creatorTradingFeePercentage,
        padding0: [],
        padding: [],
        curve,
    };
    return instructionParams;
}





// must be in collect fee mode == 0
export function designGraphCurveWithCreatorFirstBuy(
    totalTokenSupply: number,
    initialMarketCap: number,
    migrationMarketCap: number,
    migrationOption: number,
    tokenBaseDecimal: number,
    tokenQuoteDecimal: number,
    creatorTradingFeePercentage: number,
    lockedVesting: LockedVestingParams,
    leftOver: number,
    liquidityWeights: number[],
    firstBuyOption: {
        cliffFeeNumerator: BN,
        quoteAmount: number,
        baseAmount: number
    },
): ConfigParameters {
    // 1. finding Pmax and Pmin
    let pMin = getSqrtPriceFromMarketCap(initialMarketCap, totalTokenSupply, tokenBaseDecimal, tokenQuoteDecimal);
    let pMax = getSqrtPriceFromMarketCap(migrationMarketCap, totalTokenSupply, tokenBaseDecimal, tokenQuoteDecimal);

    // 1. finding p0 (initial price of curve)
    let quoteAmount = new BN(firstBuyOption.quoteAmount * 10 ** tokenQuoteDecimal);
    let firstBuyBaseAmount = new BN(firstBuyOption.baseAmount * 10 ** tokenBaseDecimal);
    let quoteAmountAfterFee = quoteAmount.mul(new BN(1_000_000_000).sub(firstBuyOption.cliffFeeNumerator)).div(new BN(1_000_000_000));

    let p0 = quoteAmountAfterFee.shln(128).div(firstBuyBaseAmount).div(pMin);
    let l0 = quoteAmountAfterFee.shln(128).div(pMin.sub(p0));

    if (pMin.lt(p0)) {
        throw Error("first price is greater than initial market cap")
    }

    // construct curve
    let curve = [{
        sqrtPrice: pMin,
        liquidity: l0,
    }];

    // find q^15 = pMax / pMin
    let priceRatio = new Decimal(pMax.toString()).div(new Decimal(pMin.toString()));
    let qDecimal = priceRatio.pow(new Decimal(1).div(new Decimal(15)));

    // finding all prices
    let sqrtPrices = [];
    let currentPrice = pMin;
    for (let i = 0; i < 16; i++) {
        sqrtPrices.push(currentPrice);
        currentPrice = fromDecimalToBN(qDecimal.mul(new Decimal(currentPrice.toString())));
    }

    let totalSupply = new BN(totalTokenSupply).mul(new BN(10).pow(new BN(tokenBaseDecimal)));
    let totalLeftover = new BN(leftOver).mul(new BN(10).pow(new BN(tokenBaseDecimal)));
    let totalVestingAmount = getTotalVestingAmount(lockedVesting);

    let totalSwapAndMigrationAmount = totalSupply.sub(totalVestingAmount).sub(totalLeftover);
    let totalSwapAndMigrationAmountAfterFirstBuyAmount = totalSwapAndMigrationAmount.sub(firstBuyBaseAmount);

    let sumFactor = new Decimal(0);
    let pmaxWeight = new Decimal(pMax.toString());
    for (let i = 1; i < 16; i++) {
        let pi = new Decimal(sqrtPrices[i].toString());
        let piMinus = new Decimal(sqrtPrices[i - 1].toString());
        let k = new Decimal(liquidityWeights[i - 1])
        let w1 = (pi.sub(piMinus)).div(pi.mul(piMinus));
        let w2 = (pi.sub(piMinus)).div(pmaxWeight.mul(pmaxWeight));
        let weight = k.mul(w1.add(w2));
        sumFactor = sumFactor.add(weight);
    }

    let l1 = new Decimal(totalSwapAndMigrationAmountAfterFirstBuyAmount.toString()).div(sumFactor);

    // construct curve
    // let curve = [];
    for (let i = 0; i < 15; i++) {
        let k = new Decimal(liquidityWeights[i])
        let liquidity = fromDecimalToBN(l1.mul(k));
        let sqrtPrice = i < 15 ? sqrtPrices[i + 1] : pMax;
        curve.push({
            sqrtPrice,
            liquidity,
        })
    }
    // reverse to calculate swap amount and migration amount
    let swapBaseAmount =
        getBaseTokenForSwap(p0, pMax, curve);
    let swapBaseAmountBuffer =
        getSwapAmountWithBuffer(swapBaseAmount, p0, curve);

    let migrationAmount = totalSwapAndMigrationAmount.sub(swapBaseAmountBuffer);
    let percentate = migrationAmount.mul(new BN(100)).div(totalSupply)
    // console.log("swapBaseAmount %d swapBaseAmountBuffer %d", swapBaseAmount.div(new BN(10 ** tokenBaseDecimal)).toString(), swapBaseAmountBuffer.div(new BN(10 ** tokenBaseDecimal)).toString())
    console.log("migration percentate %d migrationAmount: %d", percentate.toString(), migrationAmount.div(new BN(10 ** tokenBaseDecimal)).toString());
    // calculate migration threshold
    let migrationQuoteThreshold = migrationAmount.mul(pMax).mul(pMax).shrn(128);

    // sanity check
    let totalDynamicSupply = getTotalSupplyFromCurve(
        migrationQuoteThreshold,
        p0,
        curve,
        lockedVesting,
        migrationOption,
        totalLeftover,
    );

    if (totalDynamicSupply.gt(totalSupply)) {
        // precision loss is used for leftover
        let leftOverDelta = totalDynamicSupply.sub(totalSupply);
        // console.log("leftOverDelta %d", leftOverDelta.toString());
        assert(leftOverDelta.lt(totalLeftover));
    }


    const instructionParams: ConfigParameters = {
        poolFees: {
            baseFee: {
                cliffFeeNumerator: firstBuyOption.cliffFeeNumerator,
                numberOfPeriod: 0,
                reductionFactor: new BN(0),
                periodFrequency: new BN(0),
                feeSchedulerMode: 0,
            },
            dynamicFee: null,
        },
        activationType: 0,
        collectFeeMode: 0,
        migrationOption,
        tokenType: 0, // spl_token
        tokenDecimal: tokenBaseDecimal,
        migrationQuoteThreshold,
        partnerLpPercentage: 0,
        creatorLpPercentage: 0,
        partnerLockedLpPercentage: 100,
        creatorLockedLpPercentage: 0,
        sqrtStartPrice: p0,
        lockedVesting,
        migrationFeeOption: 0,
        tokenSupply: {
            preMigrationTokenSupply: totalSupply,
            postMigrationTokenSupply: totalSupply,
        },
        creatorTradingFeePercentage,
        padding0: [],
        padding: [],
        curve,
    };
    return instructionParams;
}
