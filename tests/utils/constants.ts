import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export const VIRTUAL_CURVE_PROGRAM_ID = new PublicKey(
  "2grmPSxKzQBhRrTRjWazVtMkRGFbFaqLakxGEZfnXB5u"
);

export const METAPLEX_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const DAMM_PROGRAM_ID = new PublicKey(
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB"
);

export const VAULT_PROGRAM_ID = new PublicKey(
  "24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi"
);

export const TREASURY = new PublicKey(
  "BJQbRiRWhJCyTYZcAuAL3ngDCx3AyFQGKDq8zhiZAKUw"
);

export const BASIS_POINT_MAX = 10_000;
export const OFFSET = 64;
export const U64_MAX = new BN("18446744073709551615");
export const MIN_SQRT_PRICE = new BN("4295048016");
export const MAX_SQRT_PRICE = new BN("79226673521066979257578248091");
