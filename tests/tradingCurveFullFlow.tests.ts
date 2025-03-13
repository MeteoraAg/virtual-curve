import { BN } from "bn.js";
import * as anchor from "@coral-xyz/anchor";
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
  swap,
  SwapParams,
} from "./instructions";
import { VirtualCurveProgram } from "./utils/types";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { startTest } from "./utils/setup";
import {
  createVirtualCurveProgram,
  getVirtualPool,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  U64_MAX,
} from "./utils";
import { NATIVE_MINT } from "@solana/spl-token";

describe("Trading on curve full flow", () => {
  let context: ProgramTestContext;
  let admin: Keypair;
  let program: VirtualCurveProgram;
  let config: PublicKey;
  let pool: PublicKey;
  let baseMint: PublicKey;
  let quoteMint: PublicKey;
  let claimFeeOperator: PublicKey;

  beforeEach(async () => {
    context = await startTest();
    admin = context.payer;
    program = createVirtualCurveProgram();
  });

  it("Full flow", async () => {
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
    for (let i = 0; i <= 2; i++) {
      curves.push({
        sqrtPrice: MAX_SQRT_PRICE.muln(i + 1),
        liquidity: new BN(U64_MAX).muln(100),
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
      migrationQuoteThreshold: new BN(500_000_000_000),
      creatorPostMigrationFeePercentage: 5,
      sqrtStartPrice: MIN_SQRT_PRICE,
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

    pool = await createPoolWithSplToken(context.banksClient, program, {
      payer: admin,
      quoteMint: NATIVE_MINT,
      config,
      instructionParams: {
        name: "test token spl",
        symbol: "TEST",
        uri: "abc.com",
      },
    });
    const poolState = await getVirtualPool(context.banksClient, program, pool);
    baseMint = poolState.baseMint;

    const swapParams: SwapParams = {
      config,
      payer: admin,
      pool,
      inputTokenMint: NATIVE_MINT,
      outputTokenMint: baseMint,
      amountIn: new BN(LAMPORTS_PER_SOL),
      minimumAmountOut: new BN(0),
      referralTokenAccount: null,
    };

    await swap(context.banksClient, program, swapParams);

    const claimTradingFeeParams: ClaimTradeFeeParams = {
      feeClaimer: admin,
      pool,
      maxBaseAmount: new BN(U64_MAX),
      maxQuoteAmount: new BN(U64_MAX),
    };
    claimTradingFee(context.banksClient, program, claimTradingFeeParams);

    claimProtocolFee(context.banksClient, program, {
      pool,
      operator: admin,
    });
  });
});
