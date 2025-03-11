import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { createVirtualCurveProgram } from "./utils";

import { closeClaimFeeOperator, createClaimFeeOperator } from "./instructions";
import { ProgramTestContext } from "solana-bankrun";
import { startTest } from "./utils/setup";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { VirtualCurveProgram } from "./utils/types";

describe("Admin functions", () => {
  let admin: web3.Keypair;
  let operator: web3.Keypair;
  let context: ProgramTestContext;
  let program: VirtualCurveProgram;
  let claimFeeOperator: PublicKey;
  before(async () => {
    context = await startTest();
    admin = context.payer;
    operator = new web3.Keypair();

    program = createVirtualCurveProgram();
  });

  it("Create claim fee operator", async () => {
    claimFeeOperator = await createClaimFeeOperator(
      context.banksClient,
      program,
      {
        admin,
        operator: operator.publicKey,
      }
    );
  });

  it("Close claim fee operator", async () => {
    await closeClaimFeeOperator(
      context.banksClient,
      program,
      admin,
      claimFeeOperator
    );
  });
});
