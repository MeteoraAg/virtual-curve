import { VirtualCurve } from "../../target/types/virtual_curve";
import { IdlAccounts, Program } from "@coral-xyz/anchor";

export type VirtualCurveProgram = Program<VirtualCurve>;

export type Pool = IdlAccounts<VirtualCurve>["pool"];
export type Config = IdlAccounts<VirtualCurve>["config"];
