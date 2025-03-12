import { BN } from "bn.js";
import * as anchor from "@coral-xyz/anchor";
import { BanksClient, Clock, ProgramTestContext } from "solana-bankrun";
import {
  BaseFee,
  ConfigParameters,
  createConfig,
  CreateConfigParams,
  createPoolWithSplToken,
  swap,
  SwapParams,
} from "./instructions";
import { VirtualCurveProgram } from "./utils/types";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { startTest } from "./utils/setup";
import {
  createDammConfig,
  createVirtualCurveProgram,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  U64_MAX,
} from "./utils";
import { getConfig, getVirtualPool } from "./utils/fetcher";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  createMeteoraMetadata,
  lockLpDamm,
  MigrateMeteoraParams,
  migrateToMeteoraDamm,
} from "./instructions/meteoraMigration";

describe("Swap pool", () => {
  let context: ProgramTestContext;
  let admin: Keypair;
  let program: VirtualCurveProgram;
  let config: PublicKey;
  let virtualPool: PublicKey;

  beforeEach(async () => {
    context = await startTest();
    admin = context.payer;

    program = createVirtualCurveProgram();

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
      activationType: 1,
      collectFeeMode: 0,
      migrationOption: 0,
      tokenType: 0, // spl_token
      tokenDecimal: 6,
      migrationQuoteThreshold: new BN(LAMPORTS_PER_SOL * 5),
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

  it("Migration", async () => {
    let poolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );
    const params: SwapParams = {
      config,
      payer: admin,
      pool: virtualPool,
      inputTokenMint: NATIVE_MINT,
      outputTokenMint: poolState.baseMint,
      amountIn: new BN(LAMPORTS_PER_SOL * 5.5),
      minimumAmountOut: new BN(0),
      referralTokenAccount: null,
    };
    await swap(context.banksClient, program, params);

    console.log("Create metadata");
    await createMeteoraMetadata(context.banksClient, program, {
      payer: admin,
      virtualPool,
    });

    const dammConfig = await createDammConfig(context.banksClient, admin);

    console.log("Create damm pool");
    const migrationParams: MigrateMeteoraParams = {
      payer: admin,
      virtualPool,
      dammConfig,
    };

    await migrateToMeteoraDamm(context.banksClient, program, migrationParams);

    console.log("Lock LP");

    await lockLpDamm(context.banksClient, program, {
      payer: admin,
      dammConfig,
      virtualPool,
    });
  });
});
