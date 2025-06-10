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
import { VirtualCurveProgram } from "./utils/types";
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

describe("Create pool with token2022", () => {
  let context: ProgramTestContext;
  let admin: Keypair;
  let operator: Keypair;
  let partner: Keypair;
  let user: Keypair;
  let poolCreator: Keypair;
  let program: VirtualCurveProgram;
  // token2022 pool
  let creatorUpdateAuthorityToken2022Config: PublicKey;
  let immutableToken2022Config: PublicKey;
  let partnerUpdateAuthorityToken2022Config: PublicKey;
  let creatorUpdateAndMintAuthorityToken2022Config: PublicKey;
  let partnerUpdateAndMintAuthorityToken2022Config: PublicKey;
  // spl pool
  let creatorUpdateAuthoritySplConfig: PublicKey;
  let immutableSplConfig: PublicKey;
  let partnerUpdateAuthoritySplConfig: PublicKey;
  let creatorUpdateAndMintAuthoritySplConfig: PublicKey;
  let partnerUpdateAndMintAuthoritySplConfig: PublicKey;

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
      tokenUpdateAuthority: 0, // creator
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

    // token 2022 config
    // creator update authority
    params.instructionParams.tokenUpdateAuthority = 0;
    creatorUpdateAuthorityToken2022Config = await createConfig(
      context.banksClient,
      program,
      params
    );

    // immutable
    params.instructionParams.tokenUpdateAuthority = 1;
    immutableToken2022Config = await createConfig(
      context.banksClient,
      program,
      params
    );

    // partner update authority config
    params.instructionParams.tokenUpdateAuthority = 2;
    partnerUpdateAuthorityToken2022Config = await createConfig(
      context.banksClient,
      program,
      params
    );

    // create update authority and mint authority
    params.instructionParams.tokenUpdateAuthority = 3;
    creatorUpdateAndMintAuthorityToken2022Config = await createConfig(
      context.banksClient,
      program,
      params
    );
    // partner update authority and mint authority
    params.instructionParams.tokenUpdateAuthority = 4;
    partnerUpdateAndMintAuthorityToken2022Config = await createConfig(
      context.banksClient,
      program,
      params
    );

    // spl token
    params.instructionParams.tokenType = 0;
    // creator update authority
    params.instructionParams.tokenUpdateAuthority = 0;
    creatorUpdateAuthoritySplConfig = await createConfig(
      context.banksClient,
      program,
      params
    );

    // immutable
    params.instructionParams.tokenUpdateAuthority = 1;
    immutableSplConfig = await createConfig(
      context.banksClient,
      program,
      params
    );

    // partner update authority config
    params.instructionParams.tokenUpdateAuthority = 2;
    partnerUpdateAuthoritySplConfig = await createConfig(
      context.banksClient,
      program,
      params
    );

    // create update authority and mint authority
    params.instructionParams.tokenUpdateAuthority = 3;
    creatorUpdateAndMintAuthoritySplConfig = await createConfig(
      context.banksClient,
      program,
      params
    );
    // partner update authority and mint authority
    params.instructionParams.tokenUpdateAuthority = 4;
    partnerUpdateAndMintAuthoritySplConfig = await createConfig(
      context.banksClient,
      program,
      params
    );
  });

  it("Token2022: creator can update update_authority", async () => {
    const name = "test token 2022";
    const symbol = "TOKEN2022";
    const uri = "token2022.com";

    const virtualPool = await createPoolWithToken2022(
      context.banksClient,
      program,
      {
        payer: operator,
        poolCreator,
        quoteMint: NATIVE_MINT,
        config: creatorUpdateAuthorityToken2022Config,
        instructionParams: {
          name,
          symbol,
          uri,
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const tlvData = (
      await context.banksClient.getAccount(virtualPoolState.baseMint)
    ).data.slice(ACCOUNT_SIZE + ACCOUNT_TYPE_SIZE);
    const metadataPointer = MetadataPointerLayout.decode(
      getExtensionData(ExtensionType.MetadataPointer, Buffer.from(tlvData))
    );
    expect(metadataPointer.authority.toString()).eq(
      poolCreator.publicKey.toString()
    );
  });

  it("Token2022: immutable", async () => {
    const name = "test token 2022";
    const symbol = "TOKEN2022";
    const uri = "token2022.com";

    const virtualPool = await createPoolWithToken2022(
      context.banksClient,
      program,
      {
        payer: operator,
        poolCreator,
        quoteMint: NATIVE_MINT,
        config: immutableToken2022Config,
        instructionParams: {
          name,
          symbol,
          uri,
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const tlvData = (
      await context.banksClient.getAccount(virtualPoolState.baseMint)
    ).data.slice(ACCOUNT_SIZE + ACCOUNT_TYPE_SIZE);
    const metadataPointer = MetadataPointerLayout.decode(
      getExtensionData(ExtensionType.MetadataPointer, Buffer.from(tlvData))
    );

    expect(metadataPointer.authority.toString()).eq(
      PublicKey.default.toString()
    );
  });

  it("Token2022: partner can update update_authority", async () => {
    const virtualPool = await createPoolWithToken2022(
      context.banksClient,
      program,
      {
        poolCreator,
        payer: operator,
        quoteMint: NATIVE_MINT,
        config: partnerUpdateAuthorityToken2022Config,
        instructionParams: {
          name: "test token spl",
          symbol: "TEST",
          uri: "abc.com",
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const tlvData = (
      await context.banksClient.getAccount(virtualPoolState.baseMint)
    ).data.slice(ACCOUNT_SIZE + ACCOUNT_TYPE_SIZE);
    const metadataPointer = MetadataPointerLayout.decode(
      getExtensionData(ExtensionType.MetadataPointer, Buffer.from(tlvData))
    );
    expect(metadataPointer.authority.toString()).eq(
      partner.publicKey.toString()
    );
  });

  it("Token2022: Creator can update update_authority and as mint authority", async () => {
    const name = "test token 2022";
    const symbol = "TOKEN2022";
    const uri = "token2022.com";

    const virtualPool = await createPoolWithToken2022(
      context.banksClient,
      program,
      {
        payer: operator,
        poolCreator,
        quoteMint: NATIVE_MINT,
        config: creatorUpdateAndMintAuthorityToken2022Config,
        instructionParams: {
          name,
          symbol,
          uri,
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
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

    const metadataPointer = MetadataPointerLayout.decode(
      getExtensionData(ExtensionType.MetadataPointer, Buffer.from(tlvData))
    );
    expect(metadataPointer.authority.toString()).eq(
      poolCreator.publicKey.toString()
    );
  });

  it("Token2022: partner can update update_authority and as mint authority", async () => {
    const name = "test token 2022";
    const symbol = "TOKEN2022";
    const uri = "token2022.com";

    const virtualPool = await createPoolWithToken2022(
      context.banksClient,
      program,
      {
        payer: operator,
        poolCreator,
        quoteMint: NATIVE_MINT,
        config: partnerUpdateAndMintAuthorityToken2022Config,
        instructionParams: {
          name,
          symbol,
          uri,
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
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

    const metadataPointer = MetadataPointerLayout.decode(
      getExtensionData(ExtensionType.MetadataPointer, Buffer.from(tlvData))
    );
    expect(metadataPointer.authority.toString()).eq(
      partner.publicKey.toString()
    );
  });

  it("Spl token: creator can update update_authority", async () => {
    const virtualPool = await createPoolWithSplToken(
      context.banksClient,
      program,
      {
        poolCreator,
        payer: operator,
        quoteMint: NATIVE_MINT,
        config: creatorUpdateAuthoritySplConfig,
        instructionParams: {
          name: "test token spl",
          symbol: "TEST",
          uri: "abc.com",
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const metadataAddress = deriveMetadataAccount(virtualPoolState.baseMint);

    let metadataAccount = await context.banksClient.getAccount(metadataAddress);

    const data = {
      executable: metadataAccount.executable,
      owner: metadataAccount.owner,
      lamports: metadataAccount.lamports,
      rentEpoch: metadataAccount.rentEpoch,
      data: metadataAccount.data,
      publicKey: metadataAddress,
    };
    const metadata = deserializeMetadata(data as any);

    expect(metadata.updateAuthority).eq(poolCreator.publicKey.toString());
  });

  it("Spl token: immutable", async () => {
    const virtualPool = await createPoolWithSplToken(
      context.banksClient,
      program,
      {
        poolCreator,
        payer: operator,
        quoteMint: NATIVE_MINT,
        config: immutableSplConfig,
        instructionParams: {
          name: "test token spl",
          symbol: "TEST",
          uri: "abc.com",
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const metadataAddress = deriveMetadataAccount(virtualPoolState.baseMint);

    let metadataAccount = await context.banksClient.getAccount(metadataAddress);

    const data = {
      executable: metadataAccount.executable,
      owner: metadataAccount.owner,
      lamports: metadataAccount.lamports,
      rentEpoch: metadataAccount.rentEpoch,
      data: metadataAccount.data,
      publicKey: metadataAddress,
    };
    const metadata = deserializeMetadata(data as any);

    expect(metadata.updateAuthority).eq(PublicKey.default.toString());
  });

  it("Spl token: partner can update update_authority", async () => {
    const virtualPool = await createPoolWithSplToken(
      context.banksClient,
      program,
      {
        poolCreator,
        payer: operator,
        quoteMint: NATIVE_MINT,
        config: partnerUpdateAuthoritySplConfig,
        instructionParams: {
          name: "test token spl",
          symbol: "TEST",
          uri: "abc.com",
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
      context.banksClient,
      program,
      virtualPool
    );

    const metadataAddress = deriveMetadataAccount(virtualPoolState.baseMint);

    let metadataAccount = await context.banksClient.getAccount(metadataAddress);

    const data = {
      executable: metadataAccount.executable,
      owner: metadataAccount.owner,
      lamports: metadataAccount.lamports,
      rentEpoch: metadataAccount.rentEpoch,
      data: metadataAccount.data,
      publicKey: metadataAddress,
    };
    const metadata = deserializeMetadata(data as any);

    expect(metadata.updateAuthority).eq(partner.publicKey.toString());
  });

  it("Spl token: creator can update update_authority and mint authority", async () => {
    const virtualPool = await createPoolWithSplToken(
      context.banksClient,
      program,
      {
        poolCreator,
        payer: operator,
        quoteMint: NATIVE_MINT,
        config: creatorUpdateAndMintAuthoritySplConfig,
        instructionParams: {
          name: "test token spl",
          symbol: "TEST",
          uri: "abc.com",
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
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

    const metadataAddress = deriveMetadataAccount(virtualPoolState.baseMint);

    let metadataAccount = await context.banksClient.getAccount(metadataAddress);

    const dataDecode = {
      executable: metadataAccount.executable,
      owner: metadataAccount.owner,
      lamports: metadataAccount.lamports,
      rentEpoch: metadataAccount.rentEpoch,
      data: metadataAccount.data,
      publicKey: metadataAddress,
    };
    const metadata = deserializeMetadata(dataDecode as any);

    expect(metadata.updateAuthority).eq(poolCreator.publicKey.toString());
  });

  it("Spl token: partner can update update_authority and mint authority", async () => {
    const virtualPool = await createPoolWithSplToken(
      context.banksClient,
      program,
      {
        poolCreator,
        payer: operator,
        quoteMint: NATIVE_MINT,
        config: partnerUpdateAndMintAuthoritySplConfig,
        instructionParams: {
          name: "test token spl",
          symbol: "TEST",
          uri: "abc.com",
        },
      }
    );
    const virtualPoolState = await getVirtualPool(
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

    const metadataAddress = deriveMetadataAccount(virtualPoolState.baseMint);

    let metadataAccount = await context.banksClient.getAccount(metadataAddress);

    const dataDecode = {
      executable: metadataAccount.executable,
      owner: metadataAccount.owner,
      lamports: metadataAccount.lamports,
      rentEpoch: metadataAccount.rentEpoch,
      data: metadataAccount.data,
      publicKey: metadataAddress,
    };
    const metadata = deserializeMetadata(dataDecode as any);

    expect(metadata.updateAuthority).eq(partner.publicKey.toString());
  });
});
