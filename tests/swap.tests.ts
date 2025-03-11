import { BN } from "bn.js";
import * as anchor from "@coral-xyz/anchor";
import { ProgramTestContext } from "solana-bankrun";
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
  createVirtualCurveProgram,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  U64_MAX,
} from "./utils";
import { getVirtualPool } from "./utils/fetcher";
import { NATIVE_MINT } from "@solana/spl-token";

describe("Swap pool", () => {
  let context: ProgramTestContext;
  let admin: Keypair;
  let program: VirtualCurveProgram;
  let config: PublicKey;
  let pool: PublicKey;

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
  });

  it("Execute swap", async () => {
    const poolState = await getVirtualPool(context.banksClient, program, pool);
    const params: SwapParams = {
      config,
      payer: admin,
      pool,
      inputTokenMint: NATIVE_MINT,
      outputTokenMint: poolState.baseMint,
      amountIn: new BN(LAMPORTS_PER_SOL),
      minimumAmountOut: new BN(0),
      referralTokenAccount: null,
    };

    await swap(context.banksClient, program, params);
  });
});
