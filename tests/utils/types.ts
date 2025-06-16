import { DynamicBondingCurve } from "../../target/types/dynamic_bonding_curve";
import { DynamicAmm } from "../utils/idl/dynamic_amm";
import { IdlAccounts, IdlTypes, Program } from "@coral-xyz/anchor";
import { CpAmm } from "./idl/damm_v2";

export type VirtualCurveProgram = Program<DynamicBondingCurve>;

export type Pool = IdlAccounts<DynamicBondingCurve>["virtualPool"];
export type PoolConfig = IdlAccounts<DynamicBondingCurve>["poolConfig"];
export type PartnerMetadata =
  IdlAccounts<DynamicBondingCurve>["partnerMetadata"];
export type VirtualPoolMetadata =
  IdlAccounts<DynamicBondingCurve>["virtualPoolMetadata"];
export type ClaimFeeOperator =
  IdlAccounts<DynamicBondingCurve>["claimFeeOperator"];
export type MeteoraDammMigrationMetadata =
  IdlAccounts<DynamicBondingCurve>["meteoraDammMigrationMetadata"];
export type LockEscrow = IdlAccounts<DynamicAmm>["lockEscrow"];

export type CreateDammV2DynamicConfigPredefinedParametersIxArgs =
  IdlTypes<DynamicBondingCurve>["createDammV2DynamicConfigPredefinedParametersArgs"];

export type DammV2Pool = IdlAccounts<CpAmm>["pool"];