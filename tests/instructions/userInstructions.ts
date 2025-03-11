import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  deriveMetadatAccount,
  derivePoolAddress,
  derivePoolAuthority,
  deriveTokenVaultAddress,
} from "../utils/accounts";
import { VirtualCurveProgram } from "../utils/types";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { BanksClient } from "solana-bankrun";
import {
  createVaultIfNotExists,
  createVaultProgram,
  DAMM_PROGRAM_ID,
  deriveDammPoolAddress,
  deriveLpMintAddress,
  deriveProtocolFeeAddress,
  deriveVaultLPAddress,
  getVaultPdas,
  METAPLEX_PROGRAM_ID,
  processTransactionMaybeThrow,
  VAULT_PROGRAM_ID,
} from "../utils";
import { getConfig, getPool } from "../utils/fetcher";
import {
  getOrCreateAssociatedTokenAccount,
  getTokenAccount,
  unwrapSOLInstruction,
  wrapSOLInstruction,
} from "../utils";
import { expect } from "chai";

export type InitializePoolParameters = {
  name: string;
  symbol: string;
  uri: string;
};
export type CreatePoolSplTokenParams = {
  payer: Keypair;
  quoteMint: PublicKey;
  config: PublicKey;
  instructionParams: InitializePoolParameters;
};

export type CreatePoolToken2022Params = CreatePoolSplTokenParams;

export async function createPoolWithSplToken(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: CreatePoolSplTokenParams
): Promise<PublicKey> {
  const { payer, quoteMint, config, instructionParams } = params;
  const configState = await getConfig(banksClient, program, config);

  const poolAuthority = derivePoolAuthority();
  const baseMintKP = Keypair.generate();
  const pool = derivePoolAddress(config, baseMintKP.publicKey, quoteMint);
  const baseVault = deriveTokenVaultAddress(baseMintKP.publicKey, pool);
  const quoteVault = deriveTokenVaultAddress(quoteMint, pool);

  const mintMetadata = deriveMetadatAccount(baseMintKP.publicKey);

  const tokenProgram =
    configState.tokenType == 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
  const transaction = await program.methods
    .initializePoolWithSplToken(instructionParams)
    .accounts({
      config,
      baseMint: baseMintKP.publicKey,
      quoteMint,
      pool,
      payer: payer.publicKey,
      creator: payer.publicKey,
      poolAuthority,
      baseVault,
      quoteVault,
      mintMetadata,
      metadataProgram: METAPLEX_PROGRAM_ID,
      tokenQuoteProgram: TOKEN_PROGRAM_ID,
      tokenProgram,
    })
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer, baseMintKP);

  await processTransactionMaybeThrow(banksClient, transaction);

  return pool;
}

export async function createPoolWithToken2022(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: CreatePoolToken2022Params
): Promise<PublicKey> {
  const { payer, quoteMint, config, instructionParams } = params;

  const poolAuthority = derivePoolAuthority();
  const baseMintKP = Keypair.generate();
  const pool = derivePoolAddress(config, baseMintKP.publicKey, quoteMint);
  const baseVault = deriveTokenVaultAddress(baseMintKP.publicKey, pool);
  const quoteVault = deriveTokenVaultAddress(quoteMint, pool);
  const transaction = await program.methods
    .initializePoolWithToken2022(instructionParams)
    .accounts({
      config,
      baseMint: baseMintKP.publicKey,
      quoteMint,
      pool,
      payer: payer.publicKey,
      creator: payer.publicKey,
      poolAuthority,
      baseVault,
      quoteVault,
      tokenQuoteProgram: TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer, baseMintKP);

  await processTransactionMaybeThrow(banksClient, transaction);

  return pool;
}

export type SwapParams = {
  config: PublicKey;
  payer: Keypair;
  pool: PublicKey;
  inputTokenMint: PublicKey;
  outputTokenMint: PublicKey;
  amountIn: BN;
  minimumAmountOut: BN;
  referralTokenAccount: PublicKey | null;
};

export async function swap(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: SwapParams
): Promise<PublicKey> {
  const {
    config,
    payer,
    pool,
    inputTokenMint,
    outputTokenMint,
    amountIn,
    minimumAmountOut,
    referralTokenAccount,
  } = params;

  const poolAuthority = derivePoolAuthority();
  const poolState = await getPool(banksClient, program, pool);

  const configState = await getConfig(banksClient, program, config);

  const tokenBaseProgram =
    configState.tokenType == 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

  const isInputBaseMint = inputTokenMint.equals(poolState.baseMint);

  const quoteMint = isInputBaseMint ? outputTokenMint : inputTokenMint;
  const [inputTokenProgram, outputTokenProgram] = isInputBaseMint
    ? [tokenBaseProgram, TOKEN_PROGRAM_ID]
    : [TOKEN_PROGRAM_ID, tokenBaseProgram];

  const preInstructions: TransactionInstruction[] = [];
  const postInstructions: TransactionInstruction[] = [];

  const preUserQuoteTokenBalance = 0;
  const preBaseVaultBalance = (
    await getTokenAccount(banksClient, poolState.baseVault)
  ).amount;
  const [
    { ata: inputTokenAccount, ix: createInputTokenXIx },
    { ata: outputTokenAccount, ix: createOutputTokenYIx },
  ] = await Promise.all([
    getOrCreateAssociatedTokenAccount(
      banksClient,
      payer,
      inputTokenMint,
      payer.publicKey,
      inputTokenProgram
    ),
    getOrCreateAssociatedTokenAccount(
      banksClient,
      payer,
      outputTokenMint,
      payer.publicKey,
      outputTokenProgram
    ),
  ]);
  createInputTokenXIx && preInstructions.push(createInputTokenXIx);
  createOutputTokenYIx && preInstructions.push(createOutputTokenYIx);

  if (inputTokenMint.equals(NATIVE_MINT) && !amountIn.isZero()) {
    const wrapSOLIx = wrapSOLInstruction(
      payer.publicKey,
      inputTokenAccount,
      BigInt(amountIn.toString())
    );

    preInstructions.push(...wrapSOLIx);
  }

  if (outputTokenMint.equals(NATIVE_MINT)) {
    const unrapSOLIx = unwrapSOLInstruction(payer.publicKey);

    unrapSOLIx && postInstructions.push(unrapSOLIx);
  }

  const transaction = await program.methods
    .swap({ amountIn, minimumAmountOut })
    .accounts({
      poolAuthority,
      config,
      pool,
      inputTokenAccount,
      outputTokenAccount,
      baseVault: poolState.baseVault,
      quoteVault: poolState.quoteVault,
      baseMint: poolState.baseMint,
      quoteMint,
      payer: payer.publicKey,
      tokenBaseProgram,
      tokenQuoteProgram: TOKEN_PROGRAM_ID,
      referralTokenAccount,
    })
    .preInstructions(preInstructions)
    .postInstructions(postInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer);

  await processTransactionMaybeThrow(banksClient, transaction);

  //
  const userOutputTokenBalance = (
    await getTokenAccount(banksClient, outputTokenAccount)
  ).amount;

  const postBaseVaultBalance = (
    await getTokenAccount(banksClient, poolState.baseVault)
  ).amount;

  // expect(preBaseVaultBalance - postBaseVaultBalance).eq(userOutputTokenBalance);

  return pool;
}

export type MigrateMeteoraParams = {
  payer: Keypair;
  virtualPool: PublicKey;
  dammConfig: PublicKey;
};

export async function migrateToMeteoraDamm(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: MigrateMeteoraParams
): Promise<any> {
  const { payer, virtualPool, dammConfig } = params;
  const virtualPoolState = await getPool(banksClient, program, virtualPool);
  const quoteMintInfo = await getTokenAccount(
    banksClient,
    virtualPoolState.quoteVault
  );
  const poolAuthority = derivePoolAuthority();
  const dammPool = deriveDammPoolAddress(
    dammConfig,
    virtualPoolState.baseMint,
    quoteMintInfo.mint
  );

  const lpMint = deriveLpMintAddress(dammPool);

  const mintMetadata = deriveMetadatAccount(lpMint);

  const [protocolTokenAFee, protocolTokenBFee] = [
    deriveProtocolFeeAddress(virtualPoolState.baseMint, dammPool),
    deriveProtocolFeeAddress(quoteMintInfo.mint, dammPool),
  ];

  const [
    { vaultPda: aVault, tokenVaultPda: aTokenVault, lpMintPda: aVaultLpMint },
    { vaultPda: bVault, tokenVaultPda: bTokenVault, lpMintPda: bVaultLpMint },
  ] = await Promise.all([
    createVaultIfNotExists(virtualPoolState.baseMint, banksClient, payer),
    createVaultIfNotExists(quoteMintInfo.mint, banksClient, payer),
  ]);

  const [aVaultLp, bVaultLp] = [
    deriveVaultLPAddress(aVault, dammPool),
    deriveVaultLPAddress(bVault, dammPool),
  ];

  const virtualPoolLp = getAssociatedTokenAddressSync(
    lpMint,
    poolAuthority,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const transaction = await program.methods
    .migrateToMeteoraDamm()
    .accounts({
      virtualPool,
      config: virtualPoolState.config,
      poolAuthority,
      pool: dammPool,
      dammConfig,
      lpMint,
      tokenAMint: virtualPoolState.baseMint,
      tokenBMint: quoteMintInfo.mint,
      aVault,
      bVault,
      aTokenVault,
      bTokenVault,
      aVaultLpMint,
      bVaultLpMint,
      aVaultLp,
      bVaultLp,
      baseVault: virtualPoolState.baseVault,
      quoteVault: virtualPoolState.quoteVault,
      virtualPoolLp,
      protocolTokenAFee,
      protocolTokenBFee,
      payer: payer.publicKey,
      rent: SYSVAR_RENT_PUBKEY,
      mintMetadata,
      metadataProgram: METAPLEX_PROGRAM_ID,
      ammProgram: DAMM_PROGRAM_ID,
      vaultProgram: VAULT_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .transaction();
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 350_000,
    })
  );
  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer);
  await processTransactionMaybeThrow(banksClient, transaction);
}
