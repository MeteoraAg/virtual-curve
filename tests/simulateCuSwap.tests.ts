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

describe("Simulate CU swap", () => {
  let context: ProgramTestContext;
  let admin: Keypair;
  let program: VirtualCurveProgram;
  let config: PublicKey;
  let pool: PublicKey;

  beforeEach(async () => {
    context = await startTest();
    admin = context.payer;

    program = createVirtualCurveProgram();
  });

  it("Simulate CU Swap", async () => {
    const result = [];
    for (let curve_size = 1; curve_size <= 30; curve_size++) {
      try {
        const curves = [];
        for (let i = 1; i <= curve_size; i++) {
          curves.push({
            sqrtPrice: MAX_SQRT_PRICE.muln(i * 5).divn(100),
            liquidity: U64_MAX.shln(30 + i),
          });
        }

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
          migrationQuoteThreshold: new BN(LAMPORTS_PER_SOL * 5),
          sqrtStartPrice: MIN_SQRT_PRICE.shln(32),
          padding: [],
          curve: curves,
        };
        const createConfigParams: CreateConfigParams = {
          payer: admin,
          owner: admin.publicKey,
          feeClaimer: admin.publicKey,
          quoteMint: NATIVE_MINT,
          instructionParams,
        };
        config = await createConfig(
          context.banksClient,
          program,
          createConfigParams
        );

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

        const poolState = await getVirtualPool(
          context.banksClient,
          program,
          pool
        );
        const params: SwapParams = {
          config,
          payer: admin,
          pool,
          inputTokenMint: NATIVE_MINT,
          outputTokenMint: poolState.baseMint,
          amountIn: new BN(LAMPORTS_PER_SOL * 5.5),
          minimumAmountOut: new BN(0),
          referralTokenAccount: null,
        };

        const { computeUnitsConsumed } = await swap(
          context.banksClient,
          program,
          params
        );
        result.push({
          curveSize: curve_size,
          computeUnitsConsumed,
        });
      } catch (e) {
        result.push({
          curveSize: curve_size,
          computeUnitsConsumed: e.toString(),
        });
      }
    }
    console.log(result);
  });
});
