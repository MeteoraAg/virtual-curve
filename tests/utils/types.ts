import { VirtualCurve } from "../../target/types/virtual_curve";
import { IdlAccounts, Program } from "@coral-xyz/anchor";

export type VirtualCurveProgram = Program<VirtualCurve>;

export type Pool = IdlAccounts<VirtualCurve>["virtualPool"];
export type PoolConfig = IdlAccounts<VirtualCurve>["poolConfig"];
export type ClaimFeeOperator = IdlAccounts<VirtualCurve>["claimFeeOperator"];
export type MeteoraDammMigrationMetadata =
  IdlAccounts<VirtualCurve>["meteoraDammMigrationMetadata"];
