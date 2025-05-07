import { BanksClient, ProgramTestContext } from "solana-bankrun";
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
import { createDammConfig, designGraphCurve, fundSol, getMint, startTest } from "./utils";
import {
    createVirtualCurveProgram,
    derivePoolAuthority,
} from "./utils";
import { getConfig, getVirtualPool } from "./utils/fetcher";

import { assert, expect } from "chai";
import { createToken, mintSplTokenTo } from "./utils/token";
import { BN } from "bn.js";
import Decimal from "decimal.js";

describe("Build graph curve", () => {
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

    it("Graph curve with exponetial curve and k > 1", async () => {
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let initialMarketcap = 30; // 30 SOL;
        let migrationMarketcap = 300; // 300 SOL;        
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 9;
        let lockedVesting = {
            amountPerPeriod: new BN(123456),
            cliffDurationFromMigrationTime: new BN(0),
            frequency: new BN(1),
            numberOfPeriod: new BN(120),
            cliffUnlockAmount: new BN(123456),
        };
        let leftOver = 10_000;
        let migrationOption = 0;
        let quoteMint = await createToken(context.banksClient, admin, admin.publicKey, tokenQuoteDecimal);
        let liquidityWeights = [];
        for (let i = 0; i < 16; i++) {
            liquidityWeights[i] = (new Decimal(1.2)).pow(new Decimal(i)).toNumber();
        }
        let instructionParams = designGraphCurve(
            totalTokenSupply,
            initialMarketcap,
            migrationMarketcap,
            migrationOption,
            tokenBaseDecimal,
            tokenQuoteDecimal,
            0,
            1,
            lockedVesting,
            leftOver,
            liquidityWeights,
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
        await fullFlow(context.banksClient, program, config, operator, poolCreator, user, admin, quoteMint);
    });


    it("Graph curve with exponetial curve and k < 1", async () => {
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let initialMarketcap = 30; // 30 SOL;
        let migrationMarketcap = 300; // 300 SOL;        
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 9;
        let lockedVesting = {
            amountPerPeriod: new BN(123456),
            cliffDurationFromMigrationTime: new BN(0),
            frequency: new BN(1),
            numberOfPeriod: new BN(120),
            cliffUnlockAmount: new BN(123456),
        };
        let leftOver = 10_000;
        let migrationOption = 0;
        let quoteMint = await createToken(context.banksClient, admin, admin.publicKey, tokenQuoteDecimal);
        let liquidityWeights = [];
        for (let i = 0; i < 16; i++) {
            liquidityWeights[i] = (new Decimal(0.6)).pow(new Decimal(i)).toNumber();
        }
        let instructionParams = designGraphCurve(
            totalTokenSupply,
            initialMarketcap,
            migrationMarketcap,
            migrationOption,
            tokenBaseDecimal,
            tokenQuoteDecimal,
            0,
            1,
            lockedVesting,
            leftOver,
            liquidityWeights,
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
        await fullFlow(context.banksClient, program, config, operator, poolCreator, user, admin, quoteMint);
    });

    it("Graph curve with customizable curve 1", async () => {
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let initialMarketcap = 15; // 15 SOL;
        let migrationMarketcap = 255; // 255 SOL;        
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 9;
        let lockedVesting = {
            amountPerPeriod: new BN(1),
            cliffDurationFromMigrationTime: new BN(1),
            frequency: new BN(1),
            numberOfPeriod: new BN(1),
            cliffUnlockAmount: new BN(10_000_000 * 10 ** tokenBaseDecimal), // 10M for creator
        };
        let leftOver = 200_000_000; // 200M
        let migrationOption = 0;
        let quoteMint = await createToken(context.banksClient, admin, admin.publicKey, tokenQuoteDecimal);

        let liquidityWeights = [];
        for (let i = 0; i < 16; i++) {
            if (i < 15) {
                liquidityWeights[i] = (new Decimal(1.2)).pow(new Decimal(i)).toNumber();
            } else {
                liquidityWeights[i] = 80;
            }
        }
        let instructionParams = designGraphCurve(
            totalTokenSupply,
            initialMarketcap,
            migrationMarketcap,
            migrationOption,
            tokenBaseDecimal,
            tokenQuoteDecimal,
            0,
            1,
            lockedVesting,
            leftOver,
            liquidityWeights,
        );

        console.log("migrationQuoteThreshold: %d", instructionParams.migrationQuoteThreshold.div(new BN(10 ** tokenQuoteDecimal)).toString());
        assert(instructionParams.migrationQuoteThreshold.div(new BN(10 ** tokenQuoteDecimal)).eq(new BN(75)));
        const params: CreateConfigParams = {
            payer: partner,
            leftoverReceiver: partner.publicKey,
            feeClaimer: partner.publicKey,
            quoteMint,
            instructionParams,
        };
        let config = await createConfig(context.banksClient, program, params);
        await mintSplTokenTo(context.banksClient, user, quoteMint, admin, user.publicKey, instructionParams.migrationQuoteThreshold.toNumber());
        await fullFlow(context.banksClient, program, config, operator, poolCreator, user, admin, quoteMint);
    });


    it("Graph curve with customizable curve 2", async () => {
        let totalTokenSupply = 1_000_000_000; // 1 billion
        let initialMarketcap = 5000; // 5k
        let migrationMarketcap = 1_000_000; //1M        
        let tokenBaseDecimal = 6;
        let tokenQuoteDecimal = 6;
        let lockedVesting = {
            amountPerPeriod: new BN(0),
            cliffDurationFromMigrationTime: new BN(0),
            frequency: new BN(0),
            numberOfPeriod: new BN(0),
            cliffUnlockAmount: new BN(0),
        };
        let leftOver = 1_000; // 1k
        let migrationOption = 0;
        let quoteMint = await createToken(context.banksClient, admin, admin.publicKey, tokenQuoteDecimal);

        let liquidityWeights = [];
        for (let i = 0; i < 16; i++) {
            if (i < 13) {
                liquidityWeights[i] = (new Decimal(1.2)).pow(new Decimal(i)).toNumber();
            } else {
                liquidityWeights[i] = 2.13
            }
        }
        let instructionParams = designGraphCurve(
            totalTokenSupply,
            initialMarketcap,
            migrationMarketcap,
            migrationOption,
            tokenBaseDecimal,
            tokenQuoteDecimal,
            0,
            1,
            lockedVesting,
            leftOver,
            liquidityWeights,
        );

        console.log("migrationQuoteThreshold: %d", instructionParams.migrationQuoteThreshold.div(new BN(10 ** tokenQuoteDecimal)).toString());
        assert(instructionParams.migrationQuoteThreshold.div(new BN(10 ** tokenQuoteDecimal)).eq(new BN(100_381)));
        const params: CreateConfigParams = {
            payer: partner,
            leftoverReceiver: partner.publicKey,
            feeClaimer: partner.publicKey,
            quoteMint,
            instructionParams,
        };
        let config = await createConfig(context.banksClient, program, params);
        await mintSplTokenTo(context.banksClient, user, quoteMint, admin, user.publicKey, instructionParams.migrationQuoteThreshold.toNumber());
        await fullFlow(context.banksClient, program, config, operator, poolCreator, user, admin, quoteMint);
    });
});


async function fullFlow(
    banksClient: BanksClient,
    program: VirtualCurveProgram,
    config: PublicKey,
    operator: Keypair,
    poolCreator: Keypair,
    user: Keypair,
    admin: Keypair,
    quoteMint: PublicKey,
) {
    // create pool
    let virtualPool = await createPoolWithSplToken(banksClient, program, {
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
