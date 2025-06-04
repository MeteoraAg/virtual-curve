import { ProgramTestContext } from "solana-bankrun";
import {
    createConfig,
    CreateConfigParams,
    createLocker,
    createMeteoraMetadata,
    createPoolWithSplTokenAndBundleFirstSwap,
    MigrateMeteoraParams,
    migrateToMeteoraDamm,
    partnerWithdrawSurplus,
    protocolWithdrawSurplus,
} from "./instructions";
import { VirtualCurveProgram } from "./utils/types";
import { Keypair } from "@solana/web3.js";
import { createDammConfig, designCurve, fundSol, getMint, getTokenAccount, startTest } from "./utils";
import {
    createVirtualCurveProgram,
    derivePoolAuthority,
} from "./utils";
import { getConfig, getVirtualPool } from "./utils/fetcher";

import { createToken, mintSplTokenTo } from "./utils/token";
import { expect } from "chai";
import { BN } from "bn.js";

describe("First buy test", () => {
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
    it("First buy with fee scheduler", async () => {
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let percentageSupplyOnMigration = 10; // 10%;
        let migrationQuoteThreshold = 300; // 300 sol
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 9;
        let migrationOption = 1; // damm v2
        let lockedVesting = {
            amountPerPeriod: new BN(0),
            cliffDurationFromMigrationTime: new BN(0),
            frequency: new BN(0),
            numberOfPeriod: new BN(0),
            cliffUnlockAmount: new BN(0),
        };
        let quoteMint = await createToken(context.banksClient, admin, admin.publicKey, tokenQuoteDecimal);
        let instructionParams = designCurve(
            totalTokenSupply,
            percentageSupplyOnMigration,
            migrationQuoteThreshold,
            migrationOption,
            tokenBaseDecimal,
            tokenQuoteDecimal,
            0,
            0,
            lockedVesting,
        );

        instructionParams.skipSniperFeeForCreatorFirstBuy = 1;
        instructionParams.poolFees.baseFee = {
            cliffFeeNumerator: new BN(500_000_000),
            firstFactor: 157,
            secondFactor: new BN(320),
            thirdFactor: new BN(1),
            baseFeeMode: 1,
        };

        const params: CreateConfigParams = {
            payer: partner,
            leftoverReceiver: partner.publicKey,
            feeClaimer: partner.publicKey,
            quoteMint,
            instructionParams,
        };
        let config = await createConfig(context.banksClient, program, params);
        let configState = await getConfig(context.banksClient, program, config);
        let swapAmount = instructionParams.migrationQuoteThreshold.mul(new BN(120)).div(new BN(100)); // swap more 20%

        await mintSplTokenTo(context.banksClient, poolCreator, quoteMint, admin, poolCreator.publicKey, swapAmount.toNumber());


        // create pool and bundle first swap
        let virtualPool = await createPoolWithSplTokenAndBundleFirstSwap(context.banksClient, program, {
            poolCreator,
            payer: poolCreator,
            quoteMint,
            config,
            instructionParams: {
                name: "test token spl",
                symbol: "TEST",
                uri: "abc.com",
            },
        },
            swapAmount
        );

        let virtualPoolState = await getVirtualPool(
            context.banksClient,
            program,
            virtualPool
        );
        let tradingFee = virtualPoolState.partnerQuoteFee.add(virtualPoolState.protocolQuoteFee);

        // validate trading fee at lower fee
        expect(tradingFee.toNumber() / swapAmount.toNumber()).lessThan(0.004);
    });
});


