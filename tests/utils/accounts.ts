import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import { VIRTUAL_CURVE_PROGRAM_ID } from "./constants";

export function getSecondKey(key1: PublicKey, key2: PublicKey) {
  const buf1 = key1.toBuffer();
  const buf2 = key2.toBuffer();
  // Buf1 > buf2
  if (Buffer.compare(buf1, buf2) === 1) {
    return buf2;
  }
  return buf1;
}

export function getFirstKey(key1: PublicKey, key2: PublicKey) {
  const buf1 = key1.toBuffer();
  const buf2 = key2.toBuffer();
  // Buf1 > buf2
  if (Buffer.compare(buf1, buf2) === 1) {
    return buf1;
  }
  return buf2;
}

export function derivePoolAuthority(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool_authority")],
    VIRTUAL_CURVE_PROGRAM_ID
  )[0];
}

export function deriveConfigAddress(index: BN): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config"), index.toArrayLike(Buffer, "le", 8)],
    VIRTUAL_CURVE_PROGRAM_ID
  )[0];
}

export function derivePoolAddress(
  config: PublicKey,
  tokenAMint: PublicKey,
  tokenBMint: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      config.toBuffer(),
      getFirstKey(tokenAMint, tokenBMint),
      getSecondKey(tokenAMint, tokenBMint),
    ],
    VIRTUAL_CURVE_PROGRAM_ID
  )[0];
}

export function deriveTokenVaultAddress(
  tokenMint: PublicKey,
  pool: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("token_vault"), tokenMint.toBuffer(), pool.toBuffer()],
    VIRTUAL_CURVE_PROGRAM_ID
  )[0];
}

export function deriveClaimFeeOperatorAddress(operator: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("cf_operator"), operator.toBuffer()],
    VIRTUAL_CURVE_PROGRAM_ID
  )[0];
}
