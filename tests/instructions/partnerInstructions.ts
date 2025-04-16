import { Keypair, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { VirtualCurveProgram } from "../utils/types";
import { BanksClient } from "solana-bankrun";
import {
  derivePoolAuthority,
  processTransactionMaybeThrow,
  getOrCreateAssociatedTokenAccount,
  unwrapSOLInstruction,
  getTokenAccount,
  derivePartnerMetadata,
} from "../utils";
import { getConfig, getPartnerMetadata, getVirtualPool } from "../utils/fetcher";
import { expect } from "chai";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

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

export type LockedVestingParams = {
  amountPerPeriod: BN;
  cliffDurationFromMigrationTime: BN;
  frequency: BN;
  numberOfPeriod: BN;
  cliffUnlockAmount: BN;
}

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
  partnerLpPercentage: number;
  partnerLockedLpPercentage: number;
  creatorLpPercentage: number;
  creatorLockedLpPercentage: number;
  sqrtStartPrice: BN;
  lockedVesting: LockedVestingParams;
  migrationFeeOption: number;
  padding: number[];
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
  expect(configState.partnerLpPercentage).equal(instructionParams.partnerLpPercentage);
  expect(configState.partnerLockedLpPercentage).equal(instructionParams.partnerLockedLpPercentage);
  expect(configState.creatorLpPercentage).equal(instructionParams.creatorLpPercentage);
  expect(configState.creatorLockedLpPercentage).equal(instructionParams.creatorLockedLpPercentage);

  return config.publicKey;
}

export async function createPartnerMetadata(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: {
    name: string,
    website: string,
    logo: string,
    feeClaimer: Keypair,
    payer: Keypair

  }
) {
  const { payer, feeClaimer, name, website, logo } = params;
  const partnerMetadata = derivePartnerMetadata(feeClaimer.publicKey);
  const transaction = await program.methods
    .createPartnerMetadata({
      padding: new Array(96).fill(0),
      name,
      website,
      logo,
    })
    .accountsPartial({
      partnerMetadata,
      feeClaimer: feeClaimer.publicKey,
      payer: payer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer, feeClaimer);

  await processTransactionMaybeThrow(banksClient, transaction);
  //
  const metadataState = await getPartnerMetadata(banksClient, program, partnerMetadata);
  expect(metadataState.feeClaimer.toString()).equal(feeClaimer.publicKey.toString());
  expect(metadataState.name.toString()).equal(name.toString());
  expect(metadataState.website.toString()).equal(website.toString());
  expect(metadataState.logo.toString()).equal(logo.toString());
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
  const configState = await getConfig(banksClient, program, poolState.config);
  const poolAuthority = derivePoolAuthority();

  const quoteMintInfo = await getTokenAccount(
    banksClient,
    poolState.quoteVault
  );

  const tokenBaseProgram =
    configState.tokenType == 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

  const tokenQuoteProgram =
    configState.quoteTokenFlag == 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

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
      tokenBaseProgram
    ),
    getOrCreateAssociatedTokenAccount(
      banksClient,
      feeClaimer,
      quoteMintInfo.mint,
      feeClaimer.publicKey,
      tokenQuoteProgram
    ),
  ]);
  createBaseTokenAccountIx && preInstructions.push(createBaseTokenAccountIx);
  createQuoteTokenAccountIx && preInstructions.push(createQuoteTokenAccountIx);

  const unrapSOLIx = unwrapSOLInstruction(feeClaimer.publicKey);

  unrapSOLIx && postInstructions.push(unrapSOLIx);
  const transaction = await program.methods
    .claimTradingFee(maxBaseAmount, maxQuoteAmount)
    .accountsPartial({
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
      tokenBaseProgram,
      tokenQuoteProgram,
    })
    .preInstructions(preInstructions)
    .postInstructions(postInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(feeClaimer);
  await processTransactionMaybeThrow(banksClient, transaction);
}

export type PartnerWithdrawSurplusParams = {
  feeClaimer: Keypair;
  virtualPool: PublicKey;
};
export async function partnerWithdrawSurplus(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: PartnerWithdrawSurplusParams
): Promise<any> {
  const { feeClaimer, virtualPool } = params;
  const poolState = await getVirtualPool(banksClient, program, virtualPool);
  const poolAuthority = derivePoolAuthority();

  const quoteMintInfo = await getTokenAccount(
    banksClient,
    poolState.quoteVault
  );

  const preInstructions: TransactionInstruction[] = [];
  const postInstructions: TransactionInstruction[] = [];
  const { ata: tokenQuoteAccount, ix: createQuoteTokenAccountIx } =
    await getOrCreateAssociatedTokenAccount(
      banksClient,
      feeClaimer,
      quoteMintInfo.mint,
      feeClaimer.publicKey,
      TOKEN_PROGRAM_ID
    );

  createQuoteTokenAccountIx && preInstructions.push(createQuoteTokenAccountIx);

  const unrapSOLIx = unwrapSOLInstruction(feeClaimer.publicKey);

  unrapSOLIx && postInstructions.push(unrapSOLIx);
  const transaction = await program.methods
    .partnerWithdrawSurplus()
    .accountsPartial({
      poolAuthority,
      config: poolState.config,
      virtualPool,
      tokenQuoteAccount,
      quoteVault: poolState.quoteVault,
      quoteMint: quoteMintInfo.mint,
      feeClaimer: feeClaimer.publicKey,
      tokenQuoteProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .postInstructions(postInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(feeClaimer);
  await processTransactionMaybeThrow(banksClient, transaction);
}
