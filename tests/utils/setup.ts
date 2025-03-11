import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { startAnchor } from "solana-bankrun";
import {
  DAMM_PROGRAM_ID,
  VAULT_PROGRAM_ID,
  VIRTUAL_CURVE_PROGRAM_ID,
} from "./constants";
import { METAPLEX_PROGRAM_ID } from ".";

export const LOCAL_ADMIN_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from([
    230, 207, 238, 109, 95, 154, 47, 93, 183, 250, 147, 189, 87, 15, 117, 184,
    44, 91, 94, 231, 126, 140, 238, 134, 29, 58, 8, 182, 88, 22, 113, 234, 8,
    234, 192, 109, 87, 125, 190, 55, 129, 173, 227, 8, 104, 201, 104, 13, 31,
    178, 74, 80, 54, 14, 77, 78, 226, 57, 47, 122, 166, 165, 57, 144,
  ])
);

export const VAULT_BASE_KEY = LOCAL_ADMIN_KEYPAIR.publicKey;

export async function startTest() {
  // Program name need to match fixtures program name
  return startAnchor(
    "./",
    [
      {
        name: "virtual_curve",
        programId: new PublicKey(VIRTUAL_CURVE_PROGRAM_ID),
      },
      {
        name: "metaplex",
        programId: new PublicKey(METAPLEX_PROGRAM_ID),
      },
      {
        name: "amm",
        programId: new PublicKey(DAMM_PROGRAM_ID),
      },
      {
        name: "vault",
        programId: new PublicKey(VAULT_PROGRAM_ID),
      },
    ],
    [
      {
        address: LOCAL_ADMIN_KEYPAIR.publicKey,
        info: {
          executable: false,
          owner: SystemProgram.programId,
          lamports: LAMPORTS_PER_SOL * 100,
          data: new Uint8Array(),
        },
      },
    ]
  );
}
