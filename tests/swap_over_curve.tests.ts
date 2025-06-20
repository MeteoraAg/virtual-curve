import { ProgramTestContext } from "solana-bankrun";
import {
    createConfig,
    CreateConfigParams,
    createLocker,
    createMeteoraMetadata,
    createPoolWithSplToken,
    MigrateMeteoraParams,
    migrateToMeteoraDamm,
    partnerWithdrawSurplus,
    protocolWithdrawSurplus,
    swap,
    SwapParams,
} from "./instructions";
import { VirtualCurveProgram } from "./utils/types";
import { Keypair } from "@solana/web3.js";
import { createDammConfig, designCurve, fundSol, getMint, startTest } from "./utils";
import {
    createVirtualCurveProgram,
    derivePoolAuthority,
} from "./utils";
import { getConfig, getVirtualPool } from "./utils/fetcher";

import { createToken, mintSplTokenTo } from "./utils/token";
import { expect } from "chai";
import { BN } from "bn.js";

describe("Swap Over the Curve", () => {
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
    it("Swap over the curve", async () => {
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let percentageSupplyOnMigration = 10; // 10%;
        let migrationQuoteThreshold = 300; // 300 sol
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 9;
        let migrationOption = 0; // damm v1
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
            1,
            lockedVesting,
        );

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

        await mintSplTokenTo(context.banksClient, user, quoteMint, admin, user.publicKey, swapAmount.toNumber());


        // create pool
        let virtualPool = await createPoolWithSplToken(context.banksClient, program, {
            poolCreator,
            payer: operator,
            quoteMint,
            config,
            instructionParams: {
                name: "test token spl",
                symbol: "TEST",
                uri: "abc.com",
            },
        });
        let virtualPoolState = await getVirtualPool(
            context.banksClient,
            program,
            virtualPool
        );

        // swap
        const swapParams: SwapParams = {
            config,
            payer: user,
            pool: virtualPool,
            inputTokenMint: quoteMint,
            outputTokenMint: virtualPoolState.baseMint,
            amountIn: swapAmount,
            minimumAmountOut: new BN(0),
            referralTokenAccount: null,
        };
        await swap(context.banksClient, program, swapParams);

        // migrate
        const poolAuthority = derivePoolAuthority();
        let dammConfig = await createDammConfig(
            context.banksClient,
            admin,
            poolAuthority
        );
        const migrationParams: MigrateMeteoraParams = {
            payer: admin,
            virtualPool,
            dammConfig,
        };
        await createMeteoraMetadata(context.banksClient, program, {
            payer: admin,
            virtualPool,
            config,
        });

        if (configState.lockedVestingConfig.frequency.toNumber() != 0) {
            await createLocker(context.banksClient, program, {
                payer: admin,
                virtualPool,
            });
        }
        await migrateToMeteoraDamm(context.banksClient, program, migrationParams);

        await protocolWithdrawSurplus(context.banksClient, program, {
            operator: operator,
            virtualPool,
        });

        await partnerWithdrawSurplus(context.banksClient, program, {
            feeClaimer: partner,
            virtualPool,
        });


        const baseMintData = (
            await getMint(context.banksClient, virtualPoolState.baseMint)
        );

        expect(baseMintData.supply.toString()).eq(new BN(totalTokenSupply * 10 ** tokenBaseDecimal).toString());

    });
});


