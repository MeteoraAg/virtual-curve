import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BanksClient } from "solana-bankrun";
import {
  deriveClaimFeeOperatorAddress,
  deriveMigrationMetadataAddress,
  derivePoolAuthority,
} from "../utils/accounts";
import { VirtualCurveProgram } from "../utils/types";
import {
  getOrCreateAssociatedTokenAccount,
  getVirtualPool,
  getTokenAccount,
  processTransactionMaybeThrow,
  TREASURY,
  getClaimFeeOperator,
} from "../utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";

export type CreateClaimfeeOperatorParams = {
  admin: Keypair;
  operator: PublicKey;
};

export async function createClaimFeeOperator(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: CreateClaimfeeOperatorParams
): Promise<PublicKey> {
  const { operator, admin } = params;
  const claimFeeOperator = deriveClaimFeeOperatorAddress(operator);
  const transaction = await program.methods
    .createClaimFeeOperator()
    .accounts({
      claimFeeOperator,
      operator,
      admin: admin.publicKey,
    })
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(admin);

  await processTransactionMaybeThrow(banksClient, transaction);

  const claimFeeOperatorState = await getClaimFeeOperator(
    banksClient,
    program,
    claimFeeOperator
  );
  expect(claimFeeOperatorState.operator.toString()).eq(operator.toString());

  return claimFeeOperator;
}

export async function closeClaimFeeOperator(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  admin: Keypair,
  claimFeeOperator: PublicKey
): Promise<any> {
  const transaction = await program.methods
    .closeClaimFeeOperator()
    .accounts({
      claimFeeOperator,
      rentReceiver: admin.publicKey,
      admin: admin.publicKey,
    })
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(admin);

  await processTransactionMaybeThrow(banksClient, transaction);
}

export type ClaimProtocolFeeParams = {
  operator: Keypair;
  pool: PublicKey;
};
export async function claimProtocolFee(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: ClaimProtocolFeeParams
): Promise<any> {
  const { operator, pool } = params;
  const poolState = await getVirtualPool(banksClient, program, pool);
  const poolAuthority = derivePoolAuthority();
  const claimFeeOperator = deriveClaimFeeOperatorAddress(operator.publicKey);
  const quoteMintInfo = await getTokenAccount(
    banksClient,
    poolState.quoteVault
  );

  const preInstructions: TransactionInstruction[] = [];
  const [
    { ata: tokenBaseAccount, ix: createBaseTokenAccountIx },
    { ata: tokenQuoteAccount, ix: createQuoteTokenAccountIx },
  ] = await Promise.all([
    getOrCreateAssociatedTokenAccount(
      banksClient,
      operator,
      poolState.baseMint,
      TREASURY,
      TOKEN_PROGRAM_ID
    ),
    getOrCreateAssociatedTokenAccount(
      banksClient,
      operator,
      quoteMintInfo.mint,
      TREASURY,
      TOKEN_PROGRAM_ID
    ),
  ]);
  createBaseTokenAccountIx && preInstructions.push(createBaseTokenAccountIx);
  createQuoteTokenAccountIx && preInstructions.push(createQuoteTokenAccountIx);

  const transaction = await program.methods
    .claimProtocolFee()
    .accounts({
      poolAuthority,
      config: poolState.config,
      pool,
      baseVault: poolState.baseVault,
      quoteVault: poolState.quoteVault,
      baseMint: poolState.baseMint,
      quoteMint: quoteMintInfo.mint,
      tokenBaseAccount,
      tokenQuoteAccount,
      claimFeeOperator,
      operator: operator.publicKey,
      tokenBaseProgram: TOKEN_PROGRAM_ID,
      tokenQuoteProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(operator);
  await processTransactionMaybeThrow(banksClient, transaction);
}

export type ProtocolWithdrawSurplusParams = {
  operator: Keypair;
  virtualPool: PublicKey;
};
export async function protocolWithdrawSurplus(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  params: ProtocolWithdrawSurplusParams
): Promise<any> {
  const { operator, virtualPool } = params;
  const poolState = await getVirtualPool(banksClient, program, virtualPool);
  const poolAuthority = derivePoolAuthority();
  const claimFeeOperator = deriveClaimFeeOperatorAddress(operator.publicKey);
  const quoteMintInfo = await getTokenAccount(
    banksClient,
    poolState.quoteVault
  );

  const migrationMetadata = deriveMigrationMetadataAddress(virtualPool);

  const preInstructions: TransactionInstruction[] = [];
  const { ata: tokenQuoteAccount, ix: createQuoteTokenAccountIx } =
    await getOrCreateAssociatedTokenAccount(
      banksClient,
      operator,
      quoteMintInfo.mint,
      TREASURY,
      TOKEN_PROGRAM_ID
    );
  createQuoteTokenAccountIx && preInstructions.push(createQuoteTokenAccountIx);

  const transaction = await program.methods
    .protocolWithdrawSurplus()
    .accounts({
      poolAuthority,
      config: poolState.config,
      migrationMetadata,
      virtualPool,
      quoteVault: poolState.quoteVault,
      quoteMint: quoteMintInfo.mint,
      tokenQuoteAccount,
      claimFeeOperator,
      operator: operator.publicKey,
      tokenQuoteProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .transaction();

  transaction.recentBlockhash = (await banksClient.getLatestBlockhash())[0];
  transaction.sign(operator);
  await processTransactionMaybeThrow(banksClient, transaction);
}
