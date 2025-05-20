import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { VirtualCurveProgram } from "../utils/types";
import { BanksClient } from "solana-bankrun";
import {
  derivePoolAuthority,
  processTransactionMaybeThrow,
  getOrCreateAssociatedTokenAccount,
  unwrapSOLInstruction,
  getTokenAccount,
  deriveMigrationMetadataAddress,
  getTokenProgram,
} from "../utils";
import { getConfig, getVirtualPool } from "../utils/fetcher";
import {
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";

export type ClaimCreatorTradeFeeParams = {
  creator: Keypair;
  pool: PublicKey;
  maxBaseAmount: BN;
  maxQuoteAmount: BN;
};
export async function claimCreatorTradingFee(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: ClaimCreatorTradeFeeParams
): Promise<any> {
  const { creator, pool, maxBaseAmount, maxQuoteAmount } = params;
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
      creator,
      poolState.baseMint,
      creator.publicKey,
      tokenBaseProgram
    ),
    getOrCreateAssociatedTokenAccount(
      banksClient,
      creator,
      quoteMintInfo.mint,
      creator.publicKey,
      tokenQuoteProgram
    ),
  ]);
  createBaseTokenAccountIx && preInstructions.push(createBaseTokenAccountIx);
  createQuoteTokenAccountIx && preInstructions.push(createQuoteTokenAccountIx);

  if (configState.quoteMint == NATIVE_MINT) {
    const unrapSOLIx = unwrapSOLInstruction(creator.publicKey);
    unrapSOLIx && postInstructions.push(unrapSOLIx);
  }

  const transaction = await program.methods
    .claimCreatorTradingFee(maxBaseAmount, maxQuoteAmount)
    .accountsPartial({
      poolAuthority,
      pool,
      tokenAAccount: baseTokenAccount,
      tokenBAccount: quoteTokenAccount,
      baseVault: poolState.baseVault,
      quoteVault: poolState.quoteVault,
      baseMint: poolState.baseMint,
      quoteMint: quoteMintInfo.mint,
      creator: creator.publicKey,
      tokenBaseProgram,
      tokenQuoteProgram,
    })
    .preInstructions(preInstructions)
    .postInstructions(postInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(creator);
  await processTransactionMaybeThrow(banksClient, transaction);
}

export type CreatorWithdrawSurplusParams = {
  creator: Keypair;
  virtualPool: PublicKey;
};
export async function creatorWithdrawSurplus(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: CreatorWithdrawSurplusParams
): Promise<any> {
  const { creator, virtualPool } = params;
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
      creator,
      quoteMintInfo.mint,
      creator.publicKey,
      TOKEN_PROGRAM_ID
    );

  createQuoteTokenAccountIx && preInstructions.push(createQuoteTokenAccountIx);

  if (quoteMintInfo.mint == NATIVE_MINT) {
    const unrapSOLIx = unwrapSOLInstruction(creator.publicKey);
    unrapSOLIx && postInstructions.push(unrapSOLIx);
  }

  const transaction = await program.methods
    .creatorWithdrawSurplus()
    .accountsPartial({
      poolAuthority,
      config: poolState.config,
      virtualPool,
      tokenQuoteAccount,
      quoteVault: poolState.quoteVault,
      quoteMint: quoteMintInfo.mint,
      creator: creator.publicKey,
      tokenQuoteProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .postInstructions(postInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(creator);
  await processTransactionMaybeThrow(banksClient, transaction);
}

export async function transferCreator(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  virtualPool: PublicKey,
  creator: Keypair,
  newCreator: PublicKey
): Promise<void> {
  const poolState = await getVirtualPool(banksClient, program, virtualPool);
  const migrationMetadata = deriveMigrationMetadataAddress(virtualPool);
  const transaction = await program.methods
    .transferPoolCreator()
    .accountsPartial({
      virtualPool,
      newCreator,
      config: poolState.config,
      creator: creator.publicKey,
    }).remainingAccounts(
      [
        {
          isSigner: false,
          isWritable: false,
          pubkey: migrationMetadata,
        }]
    )
    .transaction();
  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(creator);
  await processTransactionMaybeThrow(banksClient, transaction);
}

export type CreatorWithdrawMigrationFeeParams = {
  creator: Keypair;
  virtualPool: PublicKey;
};
export async function creatorWithdrawMigrationFee(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: CreatorWithdrawMigrationFeeParams
): Promise<void> {
  const { creator, virtualPool } = params;
  const poolAuthority = derivePoolAuthority();
  const poolState = await getVirtualPool(banksClient, program, virtualPool);
  const configState = await getConfig(banksClient, program, poolState.config);

  const preInstructions: TransactionInstruction[] = [];
  const postInstructions: TransactionInstruction[] = [];
  const { ata: tokenQuoteAccount, ix: createQuoteTokenAccountIx } =
    await getOrCreateAssociatedTokenAccount(
      banksClient,
      creator,
      configState.quoteMint,
      creator.publicKey,
      getTokenProgram(configState.quoteTokenFlag)
    );

  createQuoteTokenAccountIx && preInstructions.push(createQuoteTokenAccountIx);

  if (configState.quoteMint.equals(NATIVE_MINT)) {
    const unrapSOLIx = unwrapSOLInstruction(creator.publicKey);
    unrapSOLIx && postInstructions.push(unrapSOLIx);
  }

  const transaction = await program.methods
    .withdrawMigrationFee(1)
    .accountsPartial({
      poolAuthority,
      config: poolState.config,
      virtualPool,
      tokenQuoteAccount,
      quoteVault: poolState.quoteVault,
      quoteMint: configState.quoteMint,
      sender: creator.publicKey,
      tokenQuoteProgram: getTokenProgram(configState.quoteTokenFlag),
    })
    .preInstructions(preInstructions)
    .postInstructions(postInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(creator);
  await processTransactionMaybeThrow(banksClient, transaction);
}
