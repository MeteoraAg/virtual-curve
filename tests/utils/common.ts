import {
  AnchorProvider,
  BN,
  IdlAccounts,
  Program,
  Wallet,
  web3,
} from "@coral-xyz/anchor";
import {
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  getAssociatedTokenAddressSync,
  MintLayout,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { VirtualCurve } from "../../target/types/virtual_curve";
import VirtualCurveIDL from "../../target/idl/virtual_curve.json";

import VaultIDL from "../../idls/dynamic_vault.json";
import { Vault } from "./idl/dynamic-vault";

import AmmIDL from "../../idls/dynamic_amm.json";
import { Amm as Damm } from "./idl/dynamic-amm";

import { VirtualCurveProgram } from "./types";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  DAMM_PROGRAM_ID,
  VAULT_PROGRAM_ID,
  VIRTUAL_CURVE_PROGRAM_ID,
} from "./constants";
import { BanksClient } from "solana-bankrun";

export type DynamicVault = IdlAccounts<Vault>["vault"];
const BASE_ADDRESS = new PublicKey(
  "HWzXGcGHy4tcpYfaRDCyLNzXqBTv3E6BttpCH2vJxArv"
);

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

export function createVaultProgram(): Program<Vault> {
  const wallet = new Wallet(Keypair.generate());
  const provider = new AnchorProvider(
    new Connection(clusterApiUrl("devnet")),
    wallet,
    {}
  );

  const program = new Program<Vault>(
    VaultIDL as Vault,
    VAULT_PROGRAM_ID,
    provider
  );
  return program;
}

export function createDammProgram() {
  const wallet = new Wallet(Keypair.generate());
  const provider = new AnchorProvider(
    new Connection(clusterApiUrl("devnet")),
    wallet,
    {}
  );
  const program = new Program<Damm>(AmmIDL as Damm, DAMM_PROGRAM_ID, provider);
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

export async function createInitializePermissionlessDynamicVaultIx(
  mint: PublicKey,
  payer: PublicKey
): Promise<{
  vaultKey: PublicKey;
  tokenVaultKey: PublicKey;
  lpMintKey: PublicKey;
  instruction: TransactionInstruction;
}> {
  const program = createVaultProgram();
  const vaultKey = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), mint.toBuffer(), BASE_ADDRESS.toBuffer()],
    program.programId
  )[0];

  const tokenVaultKey = PublicKey.findProgramAddressSync(
    [Buffer.from("token_vault"), vaultKey.toBuffer()],
    program.programId
  )[0];

  const lpMintKey = PublicKey.findProgramAddressSync(
    [Buffer.from("lp_mint"), vaultKey.toBuffer()],
    program.programId
  )[0];

  const ix = await program.methods
    .initialize()
    .accounts({
      vault: vaultKey,
      tokenVault: tokenVaultKey,
      tokenMint: mint,
      lpMint: lpMintKey,
      payer,
      rent: SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  return {
    instruction: ix,
    vaultKey,
    tokenVaultKey,
    lpMintKey,
  };
}

export async function createVaultIfNotExists(
  mint: PublicKey,
  banksClient: BanksClient,
  payer: Keypair
): Promise<{
  vaultPda: PublicKey;
  tokenVaultPda: PublicKey;
  lpMintPda: PublicKey;
}> {
  const vaultIx = await createInitializePermissionlessDynamicVaultIx(
    mint,
    payer.publicKey
  );

  const vaultAccount = await banksClient.getAccount(vaultIx.vaultKey);
  if (!vaultAccount) {
    let tx = new Transaction();
    const [recentBlockhash] = await banksClient.getLatestBlockhash();
    tx.recentBlockhash = recentBlockhash;
    tx.add(vaultIx.instruction);
    tx.sign(payer);
    await banksClient.processTransaction(tx);
  }

  return {
    vaultPda: vaultIx.vaultKey,
    tokenVaultPda: vaultIx.tokenVaultKey,
    lpMintPda: vaultIx.lpMintKey,
  };
}

export async function getDynamicVault(
  banksClient: BanksClient,
  vault: PublicKey
): Promise<DynamicVault> {
  const program = createVaultProgram();
  const account = await banksClient.getAccount(vault);
  return program.coder.accounts.decode("Vault", Buffer.from(account.data));
}

export async function createDammConfig(
  banksClient: BanksClient,
  payer: Keypair,
  poolCreatorAuthority: PublicKey
): Promise<PublicKey> {
  const program = createDammProgram();
  const params = {
    tradeFeeNumerator: new BN(1_000),
    protocolTradeFeeNumerator: new BN(10),
    activationDuration: new BN(0),
    vaultConfigKey: PublicKey.default,
    poolCreatorAuthority: poolCreatorAuthority,
    partnerFeeNumerator: new BN(0),
    activationType: 0, //slot
    index: new BN(1),
  };
  const [config] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), params.index.toBuffer("le", 8)],
    DAMM_PROGRAM_ID
  );
  const transaction = await program.methods
    .createConfig(params)
    .accounts({
      config,
      admin: payer.publicKey,
    })
    .transaction();

  const [recentBlockhash] = await banksClient.getLatestBlockhash();
  transaction.recentBlockhash = recentBlockhash;
  transaction.sign(payer);
  await banksClient.processTransaction(transaction);

  return config;
}

export async function createLockEscrowIx(
  banksClient: BanksClient,
  payer: Keypair,
  pool: PublicKey,
  lpMint: PublicKey,
  escrowOwner: PublicKey,
  lockEscrowKey: PublicKey
): Promise<PublicKey> {
  const program = createDammProgram();

  const transaction = await program.methods
    .createLockEscrow()
    .accounts({
      pool,
      lpMint,
      owner: escrowOwner,
      lockEscrow: lockEscrowKey,
      systemProgram: SystemProgram.programId,
      payer: payer.publicKey,
    })
    .transaction();

  const [recentBlockhash] = await banksClient.getLatestBlockhash();
  transaction.recentBlockhash = recentBlockhash;
  transaction.sign(payer);
  await banksClient.processTransaction(transaction);

  return lockEscrowKey;
}
