import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { VirtualCurveProgram } from "../utils/types";
import { BanksClient } from "solana-bankrun";
import {
  derivePoolAuthority,
  processTransactionMaybeThrow,
  getOrCreateAssociatedTokenAccount,
  unwrapSOLInstruction,
  getTokenAccount,
} from "../utils";
import { getConfig, getVirtualPool } from "../utils/fetcher";
import { expect } from "chai";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export type BaseFee = {
  cliffFeeNumerator: BN;
  numberOfPeriod: number;
  periodFrequency: BN;
  reductionFactor: BN;
  feeSchedulerMode: number;
};

export type DynamicFee = {
  binStep: number;
  binStepU128: BN;
  filterPeriod: number;
  decayPeriod: number;
  reductionFactor: number;
  maxVolatilityAccumulator: number;
  variableFeeControl: number;
};

export type LiquidityDistributionParameters = {
  sqrtPrice: BN;
  liquidity: BN;
};

export type ConfigParameters = {
  poolFees: {
    baseFee: BaseFee;
    dynamicFee: DynamicFee | null;
  };
  collectFeeMode: number;
  migrationOption: number;
  activationType: number;
  tokenType: number;
  tokenDecimal: number;
  migrationQuoteThreshold: BN;
  sqrtStartPrice: BN;
  padding: [];
  curve: Array<LiquidityDistributionParameters>;
};

export type CreateConfigParams = {
  payer: Keypair;
  owner: PublicKey;
  feeClaimer: PublicKey;
  quoteMint: PublicKey;
  instructionParams: ConfigParameters;
};

export async function createConfig(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: CreateConfigParams
): Promise<PublicKey> {
  const { payer, owner, feeClaimer, quoteMint, instructionParams } = params;
  const config = Keypair.generate();

  const transaction = await program.methods
    .createConfig(instructionParams)
    .accounts({
      config: config.publicKey,
      feeClaimer,
      owner,
      quoteMint,
      payer: payer.publicKey,
    })
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer, config);

  await processTransactionMaybeThrow(banksClient, transaction);
  //
  const configState = await getConfig(banksClient, program, config.publicKey);
  // TODO add assertion data fields
  expect(configState.quoteMint.toString()).equal(quoteMint.toString());

  return config.publicKey;
}

export type ClaimTradeFeeParams = {
  feeClaimer: Keypair;
  pool: PublicKey;
  maxBaseAmount: BN;
  maxQuoteAmount: BN;
};
export async function claimTradingFee(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: ClaimTradeFeeParams
): Promise<any> {
  const { feeClaimer, pool, maxBaseAmount, maxQuoteAmount } = params;
  const poolState = await getVirtualPool(banksClient, program, pool);
  const poolAuthority = derivePoolAuthority();

  const quoteMintInfo = await getTokenAccount(
    banksClient,
    poolState.quoteVault
  );

  const preInstructions: TransactionInstruction[] = [];
  const postInstructions: TransactionInstruction[] = [];
  const [
    { ata: baseTokenAccount, ix: createBaseTokenAccountIx },
    { ata: quoteTokenAccount, ix: createQuoteTokenAccountIx },
  ] = await Promise.all([
    getOrCreateAssociatedTokenAccount(
      banksClient,
      feeClaimer,
      poolState.baseMint,
      feeClaimer.publicKey,
      TOKEN_PROGRAM_ID
    ),
    getOrCreateAssociatedTokenAccount(
      banksClient,
      feeClaimer,
      quoteMintInfo.mint,
      feeClaimer.publicKey,
      TOKEN_PROGRAM_ID
    ),
  ]);
  createBaseTokenAccountIx && preInstructions.push(createBaseTokenAccountIx);
  createQuoteTokenAccountIx && preInstructions.push(createQuoteTokenAccountIx);

  const unrapSOLIx = unwrapSOLInstruction(feeClaimer.publicKey);

  unrapSOLIx && postInstructions.push(unrapSOLIx);
  const transaction = await program.methods
    .claimTradingFee(maxBaseAmount, maxQuoteAmount)
    .accounts({
      poolAuthority,
      config: poolState.config,
      pool,
      tokenAAccount: baseTokenAccount,
      tokenBAccount: quoteTokenAccount,
      baseVault: poolState.baseVault,
      quoteVault: poolState.quoteVault,
      baseMint: poolState.baseMint,
      quoteMint: quoteMintInfo.mint,
      feeClaimer: feeClaimer.publicKey,
      tokenBaseProgram: TOKEN_PROGRAM_ID,
      tokenQuoteProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .postInstructions(postInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(feeClaimer);
  await processTransactionMaybeThrow(banksClient, transaction);
}
