import { BN } from "bn.js";
import { ProgramTestContext } from "solana-bankrun";
import {
  BaseFee,
  ConfigParameters,
  createClaimFeeOperator,
  createConfig,
  CreateConfigParams,
  createPoolWithSplToken,
  partnerWithdrawSurplus,
  protocolWithdrawSurplus,
  swap,
  SwapParams,
} from "./instructions";
import { VirtualCurveProgram } from "./utils/types";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { startTest } from "./utils/setup";
import {
  createDammConfig,
  createVirtualCurveProgram,
  derivePoolAuthority,
  getTokenAccount,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  U64_MAX,
} from "./utils";
import { getConfig, getVirtualPool } from "./utils/fetcher";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  createMeteoraMetadata,
  MigrateMeteoraParams,
  migrateToMeteoraDamm,
} from "./instructions/meteoraMigration";
import { assert, expect } from "chai";

describe("Withdraw surplus", () => {
  let context: ProgramTestContext;
  let admin: Keypair;
  let program: VirtualCurveProgram;
  let config: PublicKey;
  let virtualPool: PublicKey;
  let claimFeeOperator: PublicKey;

  beforeEach(async () => {
    context = await startTest();
    admin = context.payer;

    program = createVirtualCurveProgram();

    claimFeeOperator = await createClaimFeeOperator(
      context.banksClient,
      program,
      {
        admin,
        operator: admin.publicKey,
      }
    );

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
      migrationOption: 0,
      tokenType: 0, // spl_token
      tokenDecimal: 6,
      migrationQuoteThreshold: new BN(LAMPORTS_PER_SOL * 5),
      creatorPostMigrationFeePercentage: 5,
      sqrtStartPrice: MIN_SQRT_PRICE.shln(32),
      padding: [],
      curve: curves,
    };
    const params: CreateConfigParams = {
      payer: admin,
      owner: admin.publicKey,
      feeClaimer: admin.publicKey,
      quoteMint: NATIVE_MINT,
      instructionParams,
    };
    config = await createConfig(context.banksClient, program, params);

    virtualPool = await createPoolWithSplToken(context.banksClient, program, {
      payer: admin,
      quoteMint: NATIVE_MINT,
      config,
      instructionParams: {
        name: "test token spl",
        symbol: "TEST",
        uri: "abc.com",
      },
    });
  });

  it("Withdraw surplus", async () => {
    let poolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const poolAuthority = derivePoolAuthority();
    const params: SwapParams = {
      config,
      payer: admin,
      pool: virtualPool,
      inputTokenMint: NATIVE_MINT,
      outputTokenMint: poolState.baseMint,
      amountIn: new BN(LAMPORTS_PER_SOL * 7),
      minimumAmountOut: new BN(0),
      referralTokenAccount: null,
    };
    await swap(context.banksClient, program, params);

    console.log("Create metadata");
    await createMeteoraMetadata(context.banksClient, program, {
      payer: admin,
      virtualPool,
      config,
    });

    const dammConfig = await createDammConfig(
      context.banksClient,
      admin,
      poolAuthority
    );

    console.log("Create damm pool");
    const migrationParams: MigrateMeteoraParams = {
      payer: admin,
      virtualPool,
      dammConfig,
    };

    await migrateToMeteoraDamm(context.banksClient, program, migrationParams);

    poolState = await getVirtualPool(context.banksClient, program, virtualPool);
    const configState = await getConfig(context.banksClient, program, config);
    const totalSurplus = poolState.quoteReserve.sub(
      configState.migrationQuoteThreshold
    );
    const preQuoteVaultBalance = (
      await getTokenAccount(context.banksClient, poolState.quoteVault)
    ).amount;
    // partner withdraw surplus
    await partnerWithdrawSurplus(context.banksClient, program, {
      feeClaimer: admin,
      virtualPool,
    });

    // protocol withdraw surplus
    await protocolWithdrawSurplus(context.banksClient, program, {
      operator: admin,
      virtualPool,
    });

    const postQuoteVaultBalance = (
      await getTokenAccount(context.banksClient, poolState.quoteVault)
    ).amount;

    expect(Number(preQuoteVaultBalance) - Number(postQuoteVaultBalance)).eq(
      totalSurplus.toNumber()
    );

    // partner can not withdraw surplus again
    try {
      await partnerWithdrawSurplus(context.banksClient, program, {
        feeClaimer: admin,
        virtualPool,
      });
      assert.ok(false);
    } catch (e) {
      //
    }

    // protocol can not withdraw surplus again
    try {
      await protocolWithdrawSurplus(context.banksClient, program, {
        operator: admin,
        virtualPool,
      });
      assert.ok(false);
    } catch (e) {
      //
    }
  });
});
