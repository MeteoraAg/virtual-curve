import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createVaultIfNotExists,
  DAMM_PROGRAM_ID,
  deriveDammPoolAddress,
  deriveLpMintAddress,
  deriveMetadatAccount,
  deriveMigrationMetadataAddress,
  derivePoolAuthority,
  deriveProtocolFeeAddress,
  deriveVaultLPAddress,
  getVirtualPool,
  getTokenAccount,
  METAPLEX_PROGRAM_ID,
  processTransactionMaybeThrow,
  VAULT_PROGRAM_ID,
  VirtualCurveProgram,
  createLockEscrowIx,
  getOrCreateAssociatedTokenAccount,
  getMeteoraDammMigrationMetadata,
} from "../utils";
import { BanksClient } from "solana-bankrun";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export type CreateMeteoraMetadata = {
  payer: Keypair;
  virtualPool: PublicKey;
  config: PublicKey;
};

export async function createMeteoraMetadata(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: CreateMeteoraMetadata
): Promise<any> {
  const { payer, virtualPool, config } = params;
  const migrationMetadata = deriveMigrationMetadataAddress(virtualPool);
  const transaction = await program.methods
    .migrationMeteoraDammCreateMetadata()
    .accounts({
      virtualPool,
      config,
      migrationMetadata,
      payer: payer.publicKey,
    })
    .transaction();
  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer);
  await processTransactionMaybeThrow(banksClient, transaction);
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
  const virtualPoolState = await getVirtualPool(
    banksClient,
    program,
    virtualPool
  );
  const quoteMintInfo = await getTokenAccount(
    banksClient,
    virtualPoolState.quoteVault
  );
  const poolAuthority = derivePoolAuthority();
  const migrationMetadata = deriveMigrationMetadataAddress(virtualPool);

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
    .migrateMeteoraDamm()
    .accounts({
      virtualPool,
      migrationMetadata,
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
      units: 400_000,
    })
  );
  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer);
  await processTransactionMaybeThrow(banksClient, transaction);
}

export type LockLPDammForCreatorParams = {
  payer: Keypair;
  virtualPool: PublicKey;
  dammConfig: PublicKey;
};

export async function lockLpForCreatorDamm(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: LockLPDammForCreatorParams
) {
  const { payer, virtualPool, dammConfig } = params;
  const virtualPoolState = await getVirtualPool(
    banksClient,
    program,
    virtualPool
  );
  const quoteMintInfo = await getTokenAccount(
    banksClient,
    virtualPoolState.quoteVault
  );
  const dammPool = deriveDammPoolAddress(
    dammConfig,
    virtualPoolState.baseMint,
    quoteMintInfo.mint
  );
  const poolAuthority = derivePoolAuthority();
  const migrationMetadata = deriveMigrationMetadataAddress(virtualPool);

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

  const lpMint = deriveLpMintAddress(dammPool);

  const lockEscrowKey = PublicKey.findProgramAddressSync(
    [
      Buffer.from("lock_escrow"),
      dammPool.toBuffer(),
      virtualPoolState.creator.toBuffer(),
    ],
    DAMM_PROGRAM_ID
  )[0];

  const lockEscrowData = await banksClient.getAccount(lockEscrowKey);
  if (!lockEscrowData) {
    await createLockEscrowIx(
      banksClient,
      payer,
      dammPool,
      lpMint,
      virtualPoolState.creator,
      lockEscrowKey
    );
  }

  const preInstructions: TransactionInstruction[] = [];
  const { ata: escrowVault, ix: createEscrowVaultIx } =
    await getOrCreateAssociatedTokenAccount(
      banksClient,
      payer,
      lpMint,
      lockEscrowKey,
      TOKEN_PROGRAM_ID
    );

  createEscrowVaultIx && preInstructions.push(createEscrowVaultIx);

  const sourceTokens = getAssociatedTokenAddressSync(
    lpMint,
    poolAuthority,
    true
  );
  const transaction = await program.methods
    .migrateMeteoraDammLockLpTokenForCreator()
    .accounts({
      migrationMetadata,
      poolAuthority,
      pool: dammPool,
      lpMint,
      lockEscrow: lockEscrowKey,
      owner: virtualPoolState.creator,
      sourceTokens,
      escrowVault,
      ammProgram: DAMM_PROGRAM_ID,
      aVault,
      bVault,
      aVaultLp,
      bVaultLp,
      aVaultLpMint,
      bVaultLpMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer);
  await processTransactionMaybeThrow(banksClient, transaction);
}

export type LockLPDammForPartnerParams = LockLPDammForCreatorParams;

export async function lockLpForPartnerDamm(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: LockLPDammForPartnerParams
) {
  const { payer, virtualPool, dammConfig } = params;
  const virtualPoolState = await getVirtualPool(
    banksClient,
    program,
    virtualPool
  );
  const quoteMintInfo = await getTokenAccount(
    banksClient,
    virtualPoolState.quoteVault
  );
  const dammPool = deriveDammPoolAddress(
    dammConfig,
    virtualPoolState.baseMint,
    quoteMintInfo.mint
  );
  const poolAuthority = derivePoolAuthority();
  const migrationMetadata = deriveMigrationMetadataAddress(virtualPool);
  const meteoraMigrationDammMetadataState =
    await getMeteoraDammMigrationMetadata(
      banksClient,
      program,
      migrationMetadata
    );

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

  const lpMint = deriveLpMintAddress(dammPool);

  const lockEscrowKey = PublicKey.findProgramAddressSync(
    [
      Buffer.from("lock_escrow"),
      dammPool.toBuffer(),
      meteoraMigrationDammMetadataState.partner.toBuffer(),
    ],
    DAMM_PROGRAM_ID
  )[0];

  const lockEscrowData = await banksClient.getAccount(lockEscrowKey);
  if (!lockEscrowData) {
    await createLockEscrowIx(
      banksClient,
      payer,
      dammPool,
      lpMint,
      meteoraMigrationDammMetadataState.partner,
      lockEscrowKey
    );
  }

  const preInstructions: TransactionInstruction[] = [];
  const { ata: escrowVault, ix: createEscrowVaultIx } =
    await getOrCreateAssociatedTokenAccount(
      banksClient,
      payer,
      lpMint,
      lockEscrowKey,
      TOKEN_PROGRAM_ID
    );

  createEscrowVaultIx && preInstructions.push(createEscrowVaultIx);

  const sourceTokens = getAssociatedTokenAddressSync(
    lpMint,
    poolAuthority,
    true
  );
  const transaction = await program.methods
    .migrateMeteoraDammLockLpTokenForCreator()
    .accounts({
      migrationMetadata,
      poolAuthority,
      pool: dammPool,
      lpMint,
      lockEscrow: lockEscrowKey,
      owner: meteoraMigrationDammMetadataState.partner,
      sourceTokens,
      escrowVault,
      ammProgram: DAMM_PROGRAM_ID,
      aVault,
      bVault,
      aVaultLp,
      bVaultLp,
      aVaultLpMint,
      bVaultLpMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(payer);
  await processTransactionMaybeThrow(banksClient, transaction);
}
