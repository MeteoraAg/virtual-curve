import { BN } from "bn.js";
import { ProgramTestContext } from "solana-bankrun";
import {
  BaseFee,
  claimProtocolFee,
  ClaimTradeFeeParams,
  claimTradingFee,
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
import { Pool, VirtualCurveProgram } from "./utils/types";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { fundSol, startTest } from "./utils";
import {
  createDammConfig,
  createVirtualCurveProgram,
  derivePoolAuthority,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  U64_MAX,
} from "./utils";
import { getVirtualPool } from "./utils/fetcher";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  createMeteoraMetadata,
  lockLpForCreatorDamm,
  lockLpForPartnerDamm,
  MigrateMeteoraParams,
  migrateToMeteoraDamm,
} from "./instructions/meteoraMigration";
import { assert } from "chai";

describe("Full flow with sol", () => {
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
  let claimFeeOperator: PublicKey;

  before(async () => {
    const root = Keypair.generate();
    context = await startTest(root);
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

  it("Admin create claim fee operator", async () => {
    claimFeeOperator = await createClaimFeeOperator(
      context.banksClient,
      program,
      {
        admin,
        operator: operator.publicKey,
      }
    );
  });

  it("Partner create config", async () => {
    const baseFee: BaseFee = {
      cliffFeeNumerator: new BN(2_500_000),
      numberOfPeriod: 0,
      reductionFactor: new BN(0),
      periodFrequency: new BN(0),
      feeSchedulerMode: 0,
    };

    let curves = [];

    for (let i = 1; i <= 20; i++) {
      curves.push({
        sqrtPrice: MAX_SQRT_PRICE.muln(i * 5).divn(100),
        liquidity: U64_MAX.shln(30 + i),
      });
    }

    curves[curves.length - 1].sqrtPrice = MAX_SQRT_PRICE;

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
      payer: partner,
      owner: partner.publicKey,
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

  it("Create meteora metadata", async () => {
    await createMeteoraMetadata(context.banksClient, program, {
      payer: admin,
      virtualPool,
      config,
    });
  });

  it("Migrate to Meteora Damm Pool", async () => {
    const poolAuthority = derivePoolAuthority();
    dammConfig = await createDammConfig(
      context.banksClient,
      admin,
      poolAuthority
    );
    const migrationParams: MigrateMeteoraParams = {
      payer: admin,
      virtualPool,
      dammConfig,
    };

    await migrateToMeteoraDamm(context.banksClient, program, migrationParams);
  });

  it("Partner lock LP", async () => {
    await lockLpForPartnerDamm(context.banksClient, program, {
      payer: partner,
      dammConfig,
      virtualPool,
    });
  });

  it("Creator lock LP", async () => {
    await lockLpForCreatorDamm(context.banksClient, program, {
      payer: poolCreator,
      dammConfig,
      virtualPool,
    });
  });

  it("Partner withdraw surplus", async () => {
    // partner withdraw surplus
    await partnerWithdrawSurplus(context.banksClient, program, {
      feeClaimer: partner,
      virtualPool,
    });
  });

  it("Parner can not withdraw again", async () => {
    try {
      await partnerWithdrawSurplus(context.banksClient, program, {
        feeClaimer: partner,
        virtualPool,
      });
      assert.ok(false);
    } catch (e) {
      //
    }
  });
  it("Protocol withdraw surplus", async () => {
    await protocolWithdrawSurplus(context.banksClient, program, {
      operator: operator,
      virtualPool,
    });
  });

  it("Protocol can not withdraw surplus again", async () => {
    try {
      await protocolWithdrawSurplus(context.banksClient, program, {
        operator: operator,
        virtualPool,
      });
      assert.ok(false);
    } catch (e) {
      //
    }
  });

  it("Partner claim trading fee", async () => {
    const claimTradingFeeParams: ClaimTradeFeeParams = {
      feeClaimer: partner,
      pool: virtualPool,
      maxBaseAmount: new BN(U64_MAX),
      maxQuoteAmount: new BN(U64_MAX),
    };
    await claimTradingFee(context.banksClient, program, claimTradingFeeParams);
  });

  it("Operator claim protocol fee", async () => {
    await claimProtocolFee(context.banksClient, program, {
      pool: virtualPool,
      operator: operator,
    });
  });
});
