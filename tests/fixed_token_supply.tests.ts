import { BN } from "bn.js";
import { ProgramTestContext } from "solana-bankrun";
import {
    BaseFee,
    ConfigParameters,
    createClaimFeeOperator,
    createConfig,
    CreateConfigParams,
    createPoolWithSplToken,
    swap,
    SwapParams,
    withdrawLeftover,
} from "./instructions";
import { Pool, VirtualCurveProgram } from "./utils/types";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createDammV2Config, fundSol, getMint, startTest } from "./utils";
import {
    createVirtualCurveProgram,
    derivePoolAuthority,
    MAX_SQRT_PRICE,
    MIN_SQRT_PRICE,
    U64_MAX,
} from "./utils";
import { getVirtualPool } from "./utils/fetcher";
import { NATIVE_MINT } from "@solana/spl-token";

import { createMeteoraDammV2Metadata, MigrateMeteoraDammV2Params, migrateToDammV2 } from "./instructions/dammV2Migration";
import { expect } from "chai";

describe.only("Fixed token supply", () => {
    let context: ProgramTestContext;
    let admin: Keypair;
    let operator: Keypair;
    let partner: Keypair;
    let user: Keypair;
    let poolCreator: Keypair;
    let program: VirtualCurveProgram;
    let config: PublicKey;
    let virtualPool: PublicKey;
    let virtualPoolState: Pool;
    let dammConfig: PublicKey;
    let preMigrationTokenSupply = new BN(2_500_000_000);
    let postMigrationTokenSupply = new BN(2_200_000_000);

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

    it("Partner create config", async () => {
        const baseFee: BaseFee = {
            cliffFeeNumerator: new BN(2_500_000),
            numberOfPeriod: 0,
            reductionFactor: new BN(0),
            periodFrequency: new BN(0),
            feeSchedulerMode: 0,
        };

        const curves = [];

        for (let i = 1; i <= 20; i++) {
            curves.push({
                sqrtPrice: MAX_SQRT_PRICE.muln(i * 5).divn(100),
                liquidity: U64_MAX.shln(30 + i),
            });
        }

        const instructionParams: ConfigParameters = {
            poolFees: {
                baseFee,
                dynamicFee: null,
            },
            activationType: 0,
            collectFeeMode: 0,
            migrationOption: 1,
            tokenType: 0, // spl_token
            tokenDecimal: 6,
            migrationQuoteThreshold: new BN(LAMPORTS_PER_SOL * 5),
            partnerLpPercentage: 20,
            creatorLpPercentage: 20,
            partnerLockedLpPercentage: 55,
            creatorLockedLpPercentage: 5,
            sqrtStartPrice: MIN_SQRT_PRICE.shln(32),
            lockedVesting: {
                amountPerPeriod: new BN(0),
                cliffDurationFromMigrationTime: new BN(0),
                frequency: new BN(0),
                numberOfPeriod: new BN(0),
                cliffUnlockAmount: new BN(0),
            },
            migrationFeeOption: 0,
            // amount with buffer: 2_329_141_247
            // amount without buffer: 1_953_584_046
            tokenSupply: {
                preMigrationTokenSupply,
                postMigrationTokenSupply,
            },
            padding: [],
            curve: curves,
        };
        const params: CreateConfigParams = {
            payer: partner,
            leftoverReceiver: partner.publicKey,
            feeClaimer: partner.publicKey,
            quoteMint: NATIVE_MINT,
            instructionParams,
        };
        config = await createConfig(context.banksClient, program, params);
    });

    it("Create spl pool from config", async () => {
        virtualPool = await createPoolWithSplToken(context.banksClient, program, {
            payer: poolCreator,
            quoteMint: NATIVE_MINT,
            config,
            instructionParams: {
                name: "test token spl",
                symbol: "TEST",
                uri: "abc.com",
            },
        });
        virtualPoolState = await getVirtualPool(
            context.banksClient,
            program,
            virtualPool
        );
        // validate token supply
        const baseMintData = (
            await getMint(context.banksClient, virtualPoolState.baseMint)
        );

        expect(baseMintData.supply.toString()).eq(preMigrationTokenSupply.toString());
    });

    it("Swap", async () => {
        const params: SwapParams = {
            config,
            payer: user,
            pool: virtualPool,
            inputTokenMint: NATIVE_MINT,
            outputTokenMint: virtualPoolState.baseMint,
            amountIn: new BN(LAMPORTS_PER_SOL * 5.5),
            minimumAmountOut: new BN(0),
            referralTokenAccount: null,
        };
        await swap(context.banksClient, program, params);
    });

    it("Create meteora damm v2 metadata", async () => {
        await createMeteoraDammV2Metadata(context.banksClient, program, {
            payer: admin,
            virtualPool,
            config,
        });
    });

    it("Migrate to Meteora Damm V2 Pool", async () => {
        const poolAuthority = derivePoolAuthority();
        dammConfig = await createDammV2Config(
            context.banksClient,
            admin,
            poolAuthority
        );
        const migrationParams: MigrateMeteoraDammV2Params = {
            payer: admin,
            virtualPool,
            dammConfig,
        };

        await migrateToDammV2(context.banksClient, program, migrationParams);

        // validate token supply
        const baseMintData = (
            await getMint(context.banksClient, virtualPoolState.baseMint)
        );
        expect(baseMintData.supply.toString()).eq(postMigrationTokenSupply.toString());
    });

    it("Withdraw leftover", async () => {
        await withdrawLeftover(context.banksClient, program, {
            payer: admin,
            virtualPool,
        })
    })
});
