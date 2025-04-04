import { PublicKey } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID } from './constants'

export function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey,
  tokenProgramId: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      walletAddress.toBuffer(),
      tokenProgramId.toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
  )[0]
}

export { createAssociatedTokenAccountIdempotentInstruction } from '@solana/spl-token'
