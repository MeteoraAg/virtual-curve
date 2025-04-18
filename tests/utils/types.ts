import { VirtualCurve } from "../../target/types/virtual_curve";
import { DynamicAmm } from "../utils/idl/dynamic_amm";
import { IdlAccounts, Program } from "@coral-xyz/anchor";

export type VirtualCurveProgram = Program<VirtualCurve>;

export type Pool = IdlAccounts<VirtualCurve>["virtualPool"];
export type PoolConfig = IdlAccounts<VirtualCurve>["poolConfig"];
export type PartnerMetadata = IdlAccounts<VirtualCurve>["partnerMetadata"];
export type VirtualPoolMetadata =
  IdlAccounts<VirtualCurve>["virtualPoolMetadata"];
export type ClaimFeeOperator = IdlAccounts<VirtualCurve>["claimFeeOperator"];
export type MeteoraDammMigrationMetadata =
  IdlAccounts<VirtualCurve>["meteoraDammMigrationMetadata"];
export type LockEscrow = IdlAccounts<DynamicAmm>["lockEscrow"];
