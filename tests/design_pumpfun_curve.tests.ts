import BN, { BN } from "bn.js";
import { BanksClient, ProgramTestContext, start } from "solana-bankrun";
import Decimal from "decimal.js";
import {
    ConfigParameters,
    createConfig,
    CreateConfigParams,
    createLocker,
    createMeteoraMetadata,
    createPoolWithSplToken,
    LiquidityDistributionParameters,
    MigrateMeteoraParams,
    migrateToMeteoraDamm,
    swap,
    SwapParams,
} from "./instructions";
import { VirtualCurveProgram } from "./utils/types";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createDammConfig, fundSol, getMint, startTest } from "./utils";
import {
    createVirtualCurveProgram,
    derivePoolAuthority,
    MAX_SQRT_PRICE,
} from "./utils";
import { getConfig, getVirtualPool } from "./utils/fetcher";

import { expect } from "chai";
import { createToken, mintSplTokenTo } from "./utils/token";

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
        if (curve[i].sqrtPrice > sqrtMigrationPrice) {
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

function getBaseTokenForMigration(sqrtMigrationPrice: BN, migrationQuoteThreshold: BN): BN {
    let price = sqrtMigrationPrice.mul(sqrtMigrationPrice);
    let base = migrationQuoteThreshold.shln(128).div(price);
    return base;
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

function designPumfunCurve(
    totalTokenSupply: number,
    percentageSupplyOnMigration: number,
    percentageSupplyVesting: number,
    frequency: number,
    numberOfPeriod: number,
    startPrice: Decimal,
    migrationPrice: Decimal,
    tokenBaseDecimal: number,
    tokenQuoteDecimal: number,
): ConfigParameters {
    let totalSupply = new BN(totalTokenSupply).mul(new BN(10).pow(new BN(tokenBaseDecimal)));
    let baseDecimalFactor = new Decimal(10 ** tokenBaseDecimal);
    let quoteDecimalFactor = new Decimal(10 ** tokenQuoteDecimal);
    let preMigrationTokenSupply = totalSupply;
    let postMigrationTokenSupply = totalSupply;
    let migrationSupply = totalSupply.mul(new BN(percentageSupplyOnMigration)).div(new BN(100));
    let lockedVestingAmount = totalSupply.mul(new BN(percentageSupplyVesting)).div(new BN(100));
    let amountPerPeriod = numberOfPeriod == 0 ? new BN(0) : lockedVestingAmount.div(new BN(numberOfPeriod));
    lockedVestingAmount = amountPerPeriod.mul(new BN(numberOfPeriod));

    let sqrtStartPrice = getSqrtPriceFromPrice(startPrice, tokenBaseDecimal, tokenQuoteDecimal);
    let migrationSqrtPrice = getSqrtPriceFromPrice(migrationPrice, tokenBaseDecimal, tokenQuoteDecimal);
    let priceDelta = migrationSqrtPrice.sub(sqrtStartPrice);

    let migrationQuoteThresholdFloat = migrationPrice.mul(new Decimal(migrationSupply.toString())).mul(quoteDecimalFactor).div(baseDecimalFactor).floor();
    let migrationQuoteThreshold = new BN(migrationQuoteThresholdFloat.toString());
    let liquidity = migrationQuoteThreshold.shln(128).div(priceDelta);
    let curves = [
        {
            sqrtPrice: migrationSqrtPrice,
            liquidity,
        },
        {
            sqrtPrice: MAX_SQRT_PRICE,
            liquidity: new BN(1),
        }
    ];

    // reverse to get amount on swap
    let maxSwapAmount = getBaseTokenForSwap(sqrtStartPrice, MAX_SQRT_PRICE, curves);
    let migrationAmount = getBaseTokenForMigration(migrationSqrtPrice, migrationQuoteThreshold);
    let cliffUnlockAmount = percentageSupplyVesting == 0 ? new BN(0) : totalSupply.sub(maxSwapAmount).sub(lockedVestingAmount).sub(migrationAmount);

    console.log("migrationAmount: ", migrationAmount.toString());
    console.log("maxSwapAmount: ", maxSwapAmount.toString());
    console.log("migrationQuoteThreshold: ", migrationQuoteThreshold.toString());

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
        collectFeeMode: 1,
        migrationOption: 0, /// damm v1
        tokenType: 0, // spl_token
        tokenDecimal: tokenBaseDecimal,
        migrationQuoteThreshold,
        partnerLpPercentage: 0,
        creatorLpPercentage: 0,
        partnerLockedLpPercentage: 100,
        creatorLockedLpPercentage: 0,
        sqrtStartPrice,
        lockedVesting: {
            amountPerPeriod: amountPerPeriod,
            cliffDurationFromMigrationTime: new BN(0),
            frequency: new BN(frequency),
            numberOfPeriod: new BN(numberOfPeriod),
            cliffUnlockAmount,
        },
        migrationFeeOption: 0,
        tokenSupply: {
            preMigrationTokenSupply,
            postMigrationTokenSupply,
        },
        padding: [],
        curve: curves,
    };
    return instructionParams;
}



function designPumfunCurveWihoutLockVesting(
    totalTokenSupply: number,
    percentageSupplyOnMigration: number,
    startPrice: Decimal,
    tokenBaseDecimal: number,
    tokenQuoteDecimal: number,
): ConfigParameters {
    let totalSupply = new BN(totalTokenSupply).mul(new BN(10).pow(new BN(tokenBaseDecimal)));
    let baseDecimalFactor = new Decimal(10 ** tokenBaseDecimal);
    let quoteDecimalFactor = new Decimal(10 ** tokenQuoteDecimal);
    let preMigrationTokenSupply = totalSupply;
    let postMigrationTokenSupply = totalSupply;
    let migrationSupply = totalSupply.mul(new BN(percentageSupplyOnMigration)).div(new BN(100));
    let swapSupply = totalSupply.sub(migrationSupply);

    let sqrtStartPrice = getSqrtPriceFromPrice(startPrice, tokenBaseDecimal, tokenQuoteDecimal);
    let migrationSqrtPrice = sqrtStartPrice.mul(swapSupply).div(migrationSupply); // magic formula
    migrationSqrtPrice = migrationSqrtPrice.sub(new BN(1));
    let priceDelta = migrationSqrtPrice.sub(sqrtStartPrice);

    let migrationPrice = getPriceFromSqrtPrice(migrationSqrtPrice, tokenBaseDecimal, tokenQuoteDecimal);
    let migrationQuoteThresholdFloat = migrationPrice.mul(new Decimal(migrationSupply.toString())).mul(quoteDecimalFactor).div(baseDecimalFactor).floor();

    let migrationQuoteThreshold = new BN(migrationQuoteThresholdFloat.toString());


    let liquidity = migrationQuoteThreshold.shln(128).div(priceDelta);
    let curves = [
        {
            sqrtPrice: migrationSqrtPrice,
            liquidity,
        },
        {
            sqrtPrice: MAX_SQRT_PRICE,
            liquidity: new BN(1),
        }
    ];

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
        collectFeeMode: 1,
        migrationOption: 0, /// damm v1
        tokenType: 0, // spl_token
        tokenDecimal: tokenBaseDecimal,
        migrationQuoteThreshold,
        partnerLpPercentage: 0,
        creatorLpPercentage: 0,
        partnerLockedLpPercentage: 100,
        creatorLockedLpPercentage: 0,
        sqrtStartPrice,
        lockedVesting: {
            amountPerPeriod: new BN(0),
            cliffDurationFromMigrationTime: new BN(0),
            frequency: new BN(0),
            numberOfPeriod: new BN(0),
            cliffUnlockAmount: new BN(0),
        },
        migrationFeeOption: 0,
        tokenSupply: {
            preMigrationTokenSupply,
            postMigrationTokenSupply,
        },
        padding: [],
        curve: curves,
    };
    return instructionParams;
}

describe("Design pumpfun curve", () => {
    let context: ProgramTestContext;
    let admin: Keypair;
    let operator: Keypair;
    let partner: Keypair;
    let user: Keypair;
    let poolCreator: Keypair;
    let program: VirtualCurveProgram;

    before(async () => {
        context = await startTest();
        admin = context.payer;
        operator = Keypair.generate();
        partner = Keypair.generate();
        user = Keypair.generate();
        poolCreator = Keypair.generate();
        const receivers = [
            operator.publicKey,
            partner.publicKey,
            user.publicKey,
            poolCreator.publicKey,
        ];
        await fundSol(context.banksClient, admin, receivers);
        program = createVirtualCurveProgram();



    });

    it("Design pumpfun curve with lock vesting", async () => {
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let percentageSupplyOnMigration = 10; // 10%;
        let percentageSupplyVesting = 40; // 40%
        let frequency = 3600; // each 1 hour
        let numberOfPeriod = 100;
        let startPrice = new Decimal("0.0005"); // 500k market cap
        let migrationPrice = new Decimal("0.005"); // 5M market cap
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 9;
        let quoteMint = await createToken(context.banksClient, admin, admin.publicKey, tokenQuoteDecimal);
        let instructionParams = designPumfunCurve(
            totalTokenSupply,
            percentageSupplyOnMigration,
            percentageSupplyVesting,
            frequency,
            numberOfPeriod,
            startPrice,
            migrationPrice,
            tokenBaseDecimal,
            tokenQuoteDecimal,
        );
        const params: CreateConfigParams = {
            payer: partner,
            leftoverReceiver: partner.publicKey,
            feeClaimer: partner.publicKey,
            quoteMint,
            instructionParams,
        };
        let config = await createConfig(context.banksClient, program, params);
        await mintSplTokenTo(context.banksClient, user, quoteMint, admin, user.publicKey, instructionParams.migrationQuoteThreshold.toNumber());
        await fullFlow(context.banksClient, program, config, poolCreator, user, admin, quoteMint);
    });

    it("Design pumpfun curve without lock vesting with leftover", async () => {
        /// NOTE, this case with have leftover, 
        // because percentageSupplyOnMigration and migrationPrice is fixed -> migrationQuoteThreshold is fixed
        // startPrice is fixed, migrationPrice is fixed and migrationQuoteThreshold is fixed -> swapAmount is fixed
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let percentageSupplyOnMigration = 10; // 10%;
        let percentageSupplyVesting = 0; // 40%
        let frequency = 0; // each 1 hour
        let numberOfPeriod = 0;
        let startPrice = new Decimal("0.0005"); // 500k market cap
        let migrationPrice = new Decimal("0.005"); // 5M market cap
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 9;
        let quoteMint = await createToken(context.banksClient, admin, admin.publicKey, tokenQuoteDecimal);
        let instructionParams = designPumfunCurve(
            totalTokenSupply,
            percentageSupplyOnMigration,
            percentageSupplyVesting,
            frequency,
            numberOfPeriod,
            startPrice,
            migrationPrice,
            tokenBaseDecimal,
            tokenQuoteDecimal,
        );
        const params: CreateConfigParams = {
            payer: partner,
            leftoverReceiver: partner.publicKey,
            feeClaimer: partner.publicKey,
            quoteMint,
            instructionParams,
        };
        let config = await createConfig(context.banksClient, program, params);
        await mintSplTokenTo(context.banksClient, user, quoteMint, admin, user.publicKey, instructionParams.migrationQuoteThreshold.toNumber());
        await fullFlow(context.banksClient, program, config, poolCreator, user, admin, quoteMint);
    });


    it("Design pumpfun curve without leftover", async () => {
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let percentageSupplyOnMigration = 10; // 10%;
        let startPrice = new Decimal("0.0005"); // 500k market cap
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 9;
        let quoteMint = await createToken(context.banksClient, admin, admin.publicKey, tokenQuoteDecimal);
        let instructionParams = designPumfunCurveWihoutLockVesting(
            totalTokenSupply,
            percentageSupplyOnMigration,
            startPrice,
            tokenBaseDecimal,
            tokenQuoteDecimal,
        );
        const params: CreateConfigParams = {
            payer: partner,
            leftoverReceiver: partner.publicKey,
            feeClaimer: partner.publicKey,
            quoteMint,
            instructionParams,
        };
        let config = await createConfig(context.banksClient, program, params);
        await mintSplTokenTo(context.banksClient, user, quoteMint, admin, user.publicKey, instructionParams.migrationQuoteThreshold.toNumber());
        await fullFlow(context.banksClient, program, config, poolCreator, user, admin, quoteMint);
    });
});


async function fullFlow(
    banksClient: BanksClient,
    program: VirtualCurveProgram,
    config: PublicKey,
    poolCreator: Keypair,
    user: Keypair,
    admin: Keypair,
    quoteMint: PublicKey,
) {
    // create pool
    let virtualPool = await createPoolWithSplToken(banksClient, program, {
        payer: poolCreator,
        quoteMint,
        config,
        instructionParams: {
            name: "test token spl",
            symbol: "TEST",
            uri: "abc.com",
        },
    });
    let virtualPoolState = await getVirtualPool(
        banksClient,
        program,
        virtualPool
    );

    let configState = await getConfig(banksClient, program, config);

    // swap
    const params: SwapParams = {
        config,
        payer: user,
        pool: virtualPool,
        inputTokenMint: quoteMint,
        outputTokenMint: virtualPoolState.baseMint,
        amountIn: configState.migrationQuoteThreshold,
        minimumAmountOut: new BN(0),
        referralTokenAccount: null,
    };
    await swap(banksClient, program, params);

    // migrate
    const poolAuthority = derivePoolAuthority();
    let dammConfig = await createDammConfig(
        banksClient,
        admin,
        poolAuthority
    );
    const migrationParams: MigrateMeteoraParams = {
        payer: admin,
        virtualPool,
        dammConfig,
    };
    await createMeteoraMetadata(banksClient, program, {
        payer: admin,
        virtualPool,
        config,
    });

    if (configState.lockedVestingConfig.frequency.toNumber() != 0) {
        await createLocker(banksClient, program, {
            payer: admin,
            virtualPool,
        });
    }
    await migrateToMeteoraDamm(banksClient, program, migrationParams);
    const baseMintData = (
        await getMint(banksClient, virtualPoolState.baseMint)
    );

    expect(baseMintData.supply.toString()).eq(configState.postMigrationTokenSupply.toString());

}
