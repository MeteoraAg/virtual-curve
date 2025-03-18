import { PublicKey } from "@solana/web3.js";
import { BanksClient } from "solana-bankrun";
import {
  ClaimFeeOperator,
  Config,
  MeteoraDammMigrationMetadata,
  Pool,
  VirtualCurveProgram,
} from "./types";

export async function getVirtualPool(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  pool: PublicKey
): Promise<Pool> {
  const account = await banksClient.getAccount(pool);
  return program.coder.accounts.decode(
    "virtualPool",
    Buffer.from(account.data)
  );
}

export async function getConfig(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  config: PublicKey
): Promise<Config> {
  const account = await banksClient.getAccount(config);
  return program.coder.accounts.decode("poolConfig", Buffer.from(account.data));
}

export async function getClaimFeeOperator(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  claimFeeOperator: PublicKey
): Promise<ClaimFeeOperator> {
  const account = await banksClient.getAccount(claimFeeOperator);
  return program.coder.accounts.decode(
    "claimFeeOperator",
    Buffer.from(account.data)
  );
}

export async function getMeteoraDammMigrationMetadata(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  migrationMetadata: PublicKey
): Promise<MeteoraDammMigrationMetadata> {
  const account = await banksClient.getAccount(migrationMetadata);
  return program.coder.accounts.decode(
    "meteoraDammMigrationMetadata",
    Buffer.from(account.data)
  );
}
