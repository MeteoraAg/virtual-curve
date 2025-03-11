import { PublicKey } from "@solana/web3.js";
import { BanksClient } from "solana-bankrun";
import { Config, Pool, VirtualCurveProgram } from "./types";

export async function getVirtualPool(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  pool: PublicKey
): Promise<Pool> {
  const account = await banksClient.getAccount(pool);
  return program.coder.accounts.decode(
    "VirtualPool",
    Buffer.from(account.data)
  );
}

export async function getConfig(
  banksClient: BanksClient,
  program: VirtualCurveProgram,
  config: PublicKey
): Promise<Config> {
  const account = await banksClient.getAccount(config);
  return program.coder.accounts.decode("Config", Buffer.from(account.data));
}
