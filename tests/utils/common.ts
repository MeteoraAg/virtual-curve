import {
  AnchorProvider,
  Instruction,
  Program,
  Wallet,
  web3,
  workspace,
} from "@coral-xyz/anchor";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createMint,
  getAssociatedTokenAddressSync,
  MintLayout,
  mintTo,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { VirtualCurve } from "../../target/types/virtual_curve";
import VirtualCurveIDL from "../../target/idl/virtual_curve.json";

import { VirtualCurveProgram } from "./types";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { VIRTUAL_CURVE_PROGRAM_ID } from "./constants";
import { BanksClient } from "solana-bankrun";

export function createVirtualCurveProgram(): VirtualCurveProgram {
  const wallet = new Wallet(Keypair.generate());
  const provider = new AnchorProvider(
    new Connection(clusterApiUrl("devnet")),
    wallet,
    {}
  );

  const program = new Program<VirtualCurve>(
    VirtualCurveIDL as VirtualCurve,
    VIRTUAL_CURVE_PROGRAM_ID,
    provider
  );
  return program;
}

export async function processTransactionMaybeThrow(
  banksClient: BanksClient,
  transaction: Transaction
) {
  const transactionMeta = await banksClient.tryProcessTransaction(transaction);
  if (transactionMeta.result && transactionMeta.result.length > 0) {
    throw Error(transactionMeta.result);
  }
}

export const wrapSOLInstruction = (
  from: PublicKey,
  to: PublicKey,
  amount: bigint
): TransactionInstruction[] => {
  return [
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: amount,
    }),
    new TransactionInstruction({
      keys: [
        {
          pubkey: to,
          isSigner: false,
          isWritable: true,
        },
      ],
      data: Buffer.from(new Uint8Array([17])),
      programId: TOKEN_PROGRAM_ID,
    }),
  ];
};

export const unwrapSOLInstruction = (
  owner: PublicKey,
  allowOwnerOffCurve = true
) => {
  const wSolATAAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    owner,
    allowOwnerOffCurve
  );
  if (wSolATAAccount) {
    const closedWrappedSolInstruction = createCloseAccountInstruction(
      wSolATAAccount,
      owner,
      owner,
      [],
      TOKEN_PROGRAM_ID
    );
    return closedWrappedSolInstruction;
  }
  return null;
};

export async function getOrCreateAssociatedTokenAccount(
  banksClient: BanksClient,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
  program: PublicKey
): Promise<{ ata: PublicKey; ix?: TransactionInstruction }> {
  const ataKey = getAssociatedTokenAddressSync(mint, owner, true, program);

  const account = await banksClient.getAccount(ataKey);
  if (account === null) {
    const createAtaIx = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      ataKey,
      owner,
      mint,
      program
    );

    return { ata: ataKey, ix: createAtaIx };
  }

  return { ata: ataKey, ix: undefined };
}

export async function getTokenAccount(
  banksClient: BanksClient,
  key: PublicKey
) {
  const account = await banksClient.getAccount(key);
  const tokenAccountState = AccountLayout.decode(account.data);
  return tokenAccountState;
}

export async function getMint(banksClient: BanksClient, mint: PublicKey) {
  const account = await banksClient.getAccount(mint);
  const mintState = MintLayout.decode(account.data);
  return mintState;
}

export async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export const SET_COMPUTE_UNIT_LIMIT_IX =
  web3.ComputeBudgetProgram.setComputeUnitLimit({
    units: 1_400_000,
  });
