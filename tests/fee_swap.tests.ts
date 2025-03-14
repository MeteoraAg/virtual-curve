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
import { fundSol, getBalance, getTokenAccount, startTest } from "./utils";
import {
  createDammConfig,
  createVirtualCurveProgram,
  derivePoolAuthority,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  U64_MAX,
} from "./utils";
import { getVirtualPool } from "./utils/fetcher";
import { getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import { assert, expect } from "chai";

describe.only("Fee Swap test", () => {
  describe("Fee charge on BothToken", () => {
    let context: ProgramTestContext;
    let admin: Keypair;
    let partner: Keypair;
    let user: Keypair;
    let poolCreator: Keypair;
    let program: VirtualCurveProgram;
    let config: PublicKey;
    let virtualPool: PublicKey;
    let virtualPoolState: Pool;

    before(async () => {
      context = await startTest();
      admin = context.payer;
      partner = Keypair.generate();
      user = Keypair.generate();
      poolCreator = Keypair.generate();
      const receivers = [
        partner.publicKey,
        user.publicKey,
        poolCreator.publicKey,
      ];
      await fundSol(context.banksClient, admin, receivers);
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
        activationType: 0,
        collectFeeMode: 1, // BothToken
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
    });

    it("Swap Quote to Base", async () => {
      virtualPoolState = await getVirtualPool(
        context.banksClient,
        program,
        virtualPool
      );
      const preBaseReserve = virtualPoolState.baseReserve;
      const preQuoteReserve = virtualPoolState.quoteReserve;

      const preQuoteTradingFee = virtualPoolState.tradingQuoteFee;
      const preBaseTradingFee = virtualPoolState.tradingBaseFee;
      const preQuoteProtocolFee = virtualPoolState.protocolQuoteFee;
      const preBaseProtocolFee = virtualPoolState.protocolBaseFee;
      const preBaseVaultBalance =
        (await getTokenAccount(context.banksClient, virtualPoolState.baseVault))
          .amount ?? 0;
      const preQuoteVaultBalance =
        (
          await getTokenAccount(
            context.banksClient,
            virtualPoolState.quoteVault
          )
        ).amount ?? 0;

      const inAmount = LAMPORTS_PER_SOL;
      const params: SwapParams = {
        config,
        payer: user,
        pool: virtualPool,
        inputTokenMint: NATIVE_MINT,
        outputTokenMint: virtualPoolState.baseMint,
        amountIn: new BN(inAmount),
        minimumAmountOut: new BN(0),
        referralTokenAccount: null,
      };
      await swap(context.banksClient, program, params);

      virtualPoolState = await getVirtualPool(
        context.banksClient,
        program,
        virtualPool
      );
      const postBaseReserve = virtualPoolState.baseReserve;
      const postQuoteReserve = virtualPoolState.quoteReserve;
      const postQuoteTradingFee = virtualPoolState.tradingQuoteFee;
      const postBaseTradingFee = virtualPoolState.tradingBaseFee;
      const postQuoteProtocolFee = virtualPoolState.protocolQuoteFee;
      const postBaseProtocolFee = virtualPoolState.protocolBaseFee;

      const postBaseVaultBalance = (
        await getTokenAccount(context.banksClient, virtualPoolState.baseVault)
      ).amount;
      const postQuoteVaultBalance = (
        await getTokenAccount(context.banksClient, virtualPoolState.quoteVault)
      ).amount;

      const totalSwapBaseTradingFee = postBaseTradingFee.sub(preBaseTradingFee);
      const totalSwapQuoteTradingFee =
        postQuoteTradingFee.sub(preQuoteTradingFee);

      const totalSwapBaseProtolFee =
        postBaseProtocolFee.sub(preBaseProtocolFee);
      const totalSwapQuoteProtocolFee =
        postQuoteProtocolFee.sub(preQuoteTradingFee);

      const userBaseTokenAccount = getAssociatedTokenAddressSync(
        virtualPoolState.baseMint,
        user.publicKey
      );
      const userBaseBaseBalance = (
        await getTokenAccount(context.banksClient, userBaseTokenAccount)
      ).amount;
      console.log({
        preBaseReserve: preBaseReserve.toString(),
        postBaseReserve: postBaseReserve.toString(),
        totalSwapBaseTradingFee: totalSwapBaseTradingFee.toString(),
        totalSwapBaseProtolFee: totalSwapBaseProtolFee.toString(),
        totalSwapQuoteTradingFee: totalSwapQuoteTradingFee.toString(),
        totalSwapQuoteProtocolFee: totalSwapQuoteProtocolFee.toString(),
        preQuoteTradingFee: preQuoteTradingFee.toString(),
        postQuoteTradingFee: postQuoteTradingFee.toString(),
        userBaseBaseBalance: userBaseBaseBalance.toString(),
        postQuoteReserve: postQuoteReserve.toString(),
      });

      expect(totalSwapQuoteProtocolFee.toNumber()).eq(0);
      expect(totalSwapQuoteTradingFee.toNumber()).eq(0);

      // TODO check bug
      // expect(
      //   preBaseReserve
      //     .sub(postBaseReserve)
      //     .sub(totalSwapBaseProtolFee)
      //     .sub(totalSwapBaseTradingFee)
      //     .toString()
      // ).eq(userBaseBaseBalance.toString());
    });

    it.skip("Swap Base to Quote", async () => {
      virtualPoolState = await getVirtualPool(
        context.banksClient,
        program,
        virtualPool
      );

      const userBaseTokenAccount = getAssociatedTokenAddressSync(
        virtualPoolState.baseMint,
        user.publicKey
      );
      const userBaseBalance = (
        await getTokenAccount(context.banksClient, userBaseTokenAccount)
      ).amount;

      const preUserBalance = await getBalance(
        context.banksClient,
        user.publicKey
      );
      const preQuoteReserve = virtualPoolState.quoteReserve;
      const params: SwapParams = {
        config,
        payer: user,
        pool: virtualPool,
        inputTokenMint: virtualPoolState.baseMint,
        outputTokenMint: NATIVE_MINT,
        amountIn: new BN(userBaseBalance.toString()),
        minimumAmountOut: new BN(0),
        referralTokenAccount: null,
      };
      await swap(context.banksClient, program, params);

      virtualPoolState = await getVirtualPool(
        context.banksClient,
        program,
        virtualPool
      );

      const postQuoteReserve = virtualPoolState.quoteReserve;
      const postUserBalance = await getBalance(
        context.banksClient,
        user.publicKey
      );
      const postUserBaseBalance = (
        await getTokenAccount(context.banksClient, userBaseTokenAccount)
      ).amount;

      expect(Number(postUserBaseBalance)).eq(0);
      console.log({
        postQuoteReserve: postQuoteReserve.toString(),
        preQuoteReserve: preQuoteReserve.toString(),
      });
      expect(preQuoteReserve.sub(postQuoteReserve).toNumber()).eq(
        postUserBalance - preUserBalance
      );
    });
  });

  describe("Fee charge on OnlyB token (Quote token)", () => {});
});
