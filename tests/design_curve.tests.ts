import BN, { BN } from "bn.js";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import Decimal from "decimal.js";
import {
    createConfig,
    CreateConfigParams,
    createLocker,
    createMeteoraMetadata,
    createPoolWithSplToken,
    MigrateMeteoraParams,
    migrateToMeteoraDamm,
    swap,
    SwapParams,
} from "./instructions";
import { VirtualCurveProgram } from "./utils/types";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createDammConfig, designCurve, designCurveWihoutLockVesting, fundSol, getMint, startTest } from "./utils";
import {
    createVirtualCurveProgram,
    derivePoolAuthority,
} from "./utils";
import { getConfig, getVirtualPool } from "./utils/fetcher";

import { expect } from "chai";
import { createToken, mintSplTokenTo } from "./utils/token";

describe.skip("Design default curve", () => {
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

    it("Design curve with lock vesting", async () => {
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
        let instructionParams = designCurve(
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

    it("Design curve without lock vesting with leftover", async () => {
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
        let instructionParams = designCurve(
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


    it("Design curve without leftover", async () => {
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let percentageSupplyOnMigration = 10; // 10%;
        let startPrice = new Decimal("0.0005"); // 500k market cap
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 9;
        let quoteMint = await createToken(context.banksClient, admin, admin.publicKey, tokenQuoteDecimal);
        let instructionParams = designCurveWihoutLockVesting(
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
