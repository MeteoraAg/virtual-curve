import { BN } from "bn.js";
import * as anchor from "@coral-xyz/anchor";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import {
  BaseFee,
  ConfigParameters,
  createConfig,
  CreateConfigParams,
  createPoolWithSplToken,
  SwapParams,
  swapSimulate,
} from "./instructions";
import { VirtualCurveProgram } from "./utils/types";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { startTest } from "./utils";
import {
  createVirtualCurveProgram,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  U64_MAX,
} from "./utils";
import { getVirtualPool } from "./utils/fetcher";
import { NATIVE_MINT } from "@solana/spl-token";

describe("Simulate CU swap", () => {
  let context: ProgramTestContext;
  let user: Keypair;
  let program: VirtualCurveProgram;

  beforeEach(async () => {
    context = await startTest();
    user = context.payer;
    program = createVirtualCurveProgram();
  });

  it("Simulate CU Swap", async () => {
    const result = [];
    for (let curve_size = 1; curve_size <= 20; curve_size++) {
      let curves = [];
      for (let i = 1; i <= curve_size; i++) {
        curves.push({
          sqrtPrice: MIN_SQRT_PRICE.muln(i + 1),
          liquidity: U64_MAX.shln(10),
        });
      }

      curves[curves.length - 1].sqrtPrice = MAX_SQRT_PRICE;

      const baseFee: BaseFee = {
        cliffFeeNumerator: new BN(2_500_000),
        numberOfPeriod: 0,
        reductionFactor: new BN(0),
        periodFrequency: new BN(0),
        feeSchedulerMode: 0,
      };

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
        migrationQuoteThreshold: new BN(50_000 * 10 ** 6),
        creatorPostMigrationFeePercentage: 5,
        sqrtStartPrice: MIN_SQRT_PRICE,
        padding: [],
        curve: curves,
      };
      const createConfigParams: CreateConfigParams = {
        payer: user,
        owner: user.publicKey,
        feeClaimer: user.publicKey,
        quoteMint: NATIVE_MINT,
        instructionParams,
      };
      const config = await createConfig(
        context.banksClient,
        program,
        createConfigParams
      );

      const pool = await createPoolWithSplToken(context.banksClient, program, {
        payer: user,
        quoteMint: NATIVE_MINT,
        config,
        instructionParams: {
          name: "test token spl",
          symbol: "TEST",
          uri: "abc.com",
        },
      });

      const poolState = await getVirtualPool(
        context.banksClient,
        program,
        pool
      );
      const params: SwapParams = {
        config,
        payer: user,
        pool,
        inputTokenMint: NATIVE_MINT,
        outputTokenMint: poolState.baseMint,
        amountIn: new BN(LAMPORTS_PER_SOL * 550),
        minimumAmountOut: new BN(0),
        referralTokenAccount: null,
      };

      const { computeUnitsConsumed, numInstructions, completed, message } =
        await swapSimulate(context.banksClient, program, params);
      result.push({
        curveSize: curves.length,
        completed,
        CU: computeUnitsConsumed,
        instruction: numInstructions,
        // message,
      });
    }
    console.log(result);
  });
});
