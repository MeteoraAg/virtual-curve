import { BN } from "bn.js";
import { ProgramTestContext } from "solana-bankrun";
import { deserializeMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  BaseFee,
  ConfigParameters,
  createConfig,
  CreateConfigParams,
  createPoolWithSplToken,
  createPoolWithToken2022,
} from "./instructions";
import { Pool, VirtualCurveProgram } from "./utils/types";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { deriveMetadataAccount, fundSol, startTest } from "./utils";
import {
  createVirtualCurveProgram,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  U64_MAX,
} from "./utils";
import { getVirtualPool } from "./utils/fetcher";
import {
  ACCOUNT_SIZE,
  ACCOUNT_TYPE_SIZE,
  ExtensionType,
  getExtensionData,
  MetadataPointerLayout,
  MintLayout,
  NATIVE_MINT,
} from "@solana/spl-token";
import { expect } from "chai";

describe.only("Mintable token", () => {
  let context: ProgramTestContext;
  let admin: Keypair;
  let operator: Keypair;
  let partner: Keypair;
  let user: Keypair;
  let poolCreator: Keypair;
  let program: VirtualCurveProgram;
  let creatorMintAuthorityConfig: PublicKey;
  let partnerMintAuthorityConfig: PublicKey;
  let creatorMintAuthorityConfigSplToken: PublicKey;
  let partnerMintAuthorityConfigSplToken: PublicKey;
  let virtualPool: PublicKey;
  let virtualPoolState: Pool;

  before(async () => {
    context = await startTest();
    admin = context.payer;
    operator = Keypair.generate();
    partner = Keypair.generate();
    user = Keypair.generate();
    poolCreator = Keypair.generate();
    const receivers = [
      operator.publicKey,
      partner.publicKey,
      user.publicKey,
      poolCreator.publicKey,
    ];
    await fundSol(context.banksClient, admin, receivers);
    program = createVirtualCurveProgram();
  });

  it("Partner create config", async () => {
    const baseFee: BaseFee = {
      cliffFeeNumerator: new BN(2_500_000),
      numberOfPeriod: 0,
      reductionFactor: new BN(0),
      periodFrequency: new BN(0),
      feeSchedulerMode: 0,
    };

    const curves = [];

    for (let i = 1; i <= 16; i++) {
      if (i == 16) {
        curves.push({
          sqrtPrice: MAX_SQRT_PRICE,
          liquidity: U64_MAX.shln(30 + i),
        });
      } else {
        curves.push({
          sqrtPrice: MAX_SQRT_PRICE.muln(i * 5).divn(100),
          liquidity: U64_MAX.shln(30 + i),
        });
      }
    }

    const instructionParams: ConfigParameters = {
      poolFees: {
        baseFee,
        dynamicFee: null,
      },
      activationType: 0,
      collectFeeMode: 0,
      migrationOption: 1, // damm v2
      tokenType: 1, // token 2022
      tokenDecimal: 6,
      migrationQuoteThreshold: new BN(LAMPORTS_PER_SOL * 5),
      partnerLpPercentage: 0,
      creatorLpPercentage: 0,
      partnerLockedLpPercentage: 95,
      creatorLockedLpPercentage: 5,
      sqrtStartPrice: MIN_SQRT_PRICE.shln(32),
      lockedVesting: {
        amountPerPeriod: new BN(0),
        cliffDurationFromMigrationTime: new BN(0),
        frequency: new BN(0),
        numberOfPeriod: new BN(0),
        cliffUnlockAmount: new BN(0),
      },
      migrationFeeOption: 0,
      tokenSupply: null,
      migrationFee: {
        creatorFeePercentage: 0,
        feePercentage: 0,
      },
      creatorTradingFeePercentage: 0,
      tokenUpdateAuthority: 3, // creator mint authority
      padding0: [],
      padding1: [],
      curve: curves,
    };
    let params: CreateConfigParams = {
      payer: partner,
      leftoverReceiver: partner.publicKey,
      feeClaimer: partner.publicKey,
      quoteMint: NATIVE_MINT,
      instructionParams,
    };
    creatorMintAuthorityConfig = await createConfig(
      context.banksClient,
      program,
      params
    );
    params.instructionParams.tokenType = 0;
    creatorMintAuthorityConfigSplToken = await createConfig(
      context.banksClient,
      program,
      params
    );

    params.instructionParams.tokenUpdateAuthority = 4; // partner mint authority
    params.instructionParams.tokenType = 1;
    partnerMintAuthorityConfig = await createConfig(
      context.banksClient,
      program,
      params
    );
    params.instructionParams.tokenType = 0;
    partnerMintAuthorityConfigSplToken = await createConfig(
      context.banksClient,
      program,
      params
    );
  });

  it("Create token2022 pool from config as creator is mint authority", async () => {
    const name = "test token 2022";
    const symbol = "TOKEN2022";
    const uri = "token2022.com";

    virtualPool = await createPoolWithToken2022(context.banksClient, program, {
      payer: operator,
      poolCreator,
      quoteMint: NATIVE_MINT,
      config: creatorMintAuthorityConfig,
      instructionParams: {
        name,
        symbol,
        uri,
      },
    });
    virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const tlvData = (
      await context.banksClient.getAccount(virtualPoolState.baseMint)
    ).data.slice(ACCOUNT_SIZE + ACCOUNT_TYPE_SIZE);
    const dataDecoded = MintLayout.decode(Buffer.from(tlvData));
    expect(dataDecoded.mintAuthority.toString()).eq(
      poolCreator.publicKey.toString()
    );
  });

  it("Create token2022 pool from config as partner is mint authority", async () => {
    const name = "test token 2022";
    const symbol = "TOKEN2022";
    const uri = "token2022.com";

    virtualPool = await createPoolWithToken2022(context.banksClient, program, {
      payer: operator,
      poolCreator,
      quoteMint: NATIVE_MINT,
      config: partnerMintAuthorityConfig,
      instructionParams: {
        name,
        symbol,
        uri,
      },
    });
    virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const tlvData = (
      await context.banksClient.getAccount(virtualPoolState.baseMint)
    ).data.slice(ACCOUNT_SIZE + ACCOUNT_TYPE_SIZE);
    const dataDecoded = MintLayout.decode(Buffer.from(tlvData));
    expect(dataDecoded.mintAuthority.toString()).eq(
      partner.publicKey.toString()
    );
  });

  it("Create spl token pool from config as creator is mint authority", async () => {
    virtualPool = await createPoolWithSplToken(context.banksClient, program, {
      poolCreator,
      payer: operator,
      quoteMint: NATIVE_MINT,
      config: creatorMintAuthorityConfigSplToken,
      instructionParams: {
        name: "test token spl",
        symbol: "TEST",
        uri: "abc.com",
      },
    });
    virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const data = (
      await context.banksClient.getAccount(virtualPoolState.baseMint)
    ).data;
    const dataDecoded = MintLayout.decode(Buffer.from(data));
    expect(dataDecoded.mintAuthority.toString()).eq(
      poolCreator.publicKey.toString()
    );
  });

  it("Create spl pool from config as partner is mint authority", async () => {
    virtualPool = await createPoolWithSplToken(context.banksClient, program, {
      poolCreator,
      payer: operator,
      quoteMint: NATIVE_MINT,
      config: partnerMintAuthorityConfigSplToken,
      instructionParams: {
        name: "test token spl",
        symbol: "TEST",
        uri: "abc.com",
      },
    });
    virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const data = (
      await context.banksClient.getAccount(virtualPoolState.baseMint)
    ).data;
    const dataDecoded = MintLayout.decode(Buffer.from(data));
    expect(dataDecoded.mintAuthority.toString()).eq(
      partner.publicKey.toString()
    );
  });
});
