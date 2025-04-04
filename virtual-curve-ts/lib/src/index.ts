import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  type GetProgramAccountsFilter,
} from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { Idl } from './idl'
import {
  type VirtualCurveProgram,
  type InitializePoolParameters,
  type SwapParameters,
  type ConfigParameters,
  type CreateClaimFeeOperatorAccounts,
  type CloseClaimFeeOperatorAccounts,
  type ClaimProtocolFeeAccounts,
  type CreateConfigAccounts,
  type ClaimTradingFeeAccounts,
  type InitializeVirtualPoolWithSplTokenAccounts,
  type InitializeVirtualPoolWithToken2022Accounts,
  type SwapAccounts,
  type MigrationDammV2CreateMetadataAccounts,
  type MigrateMeteoraDammAccounts,
  type MigrateMeteoraDammLockLpTokenForCreatorAccounts,
  type MigrateMeteoraDammLockLpTokenForPartnerAccounts,
  type VirtualPool,
  type PoolConfig,
} from './types'
import BN from 'bn.js'
import { quoteExactIn } from './quote'
import { METADATA_PROGRAM_ID, SOL_MINT, TOKEN_PROGRAM_ID } from './constants'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  findAssociatedTokenAddress,
} from './ata'
import {
  createCloseAccountInstruction,
  createSyncNativeInstruction,
} from '@solana/spl-token'

// Define a type for accounts that might have optional fields
type AccountsWithOptionalFields<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] | null : T[P]
}

export const FEE_DENOMINATOR = 1_000_000_000

export class VirtualCurveSDK {
  private program: VirtualCurveProgram
  private connection: Connection
  private provider: AnchorProvider

  constructor(connection: Connection) {
    this.connection = connection
    this.provider = new AnchorProvider(connection, null as any, {
      commitment: 'confirmed',
    })
    this.program = new Program(Idl, this.provider)
  }

  private getEventAuthority(): PublicKey {
    const [eventAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('__event_authority')],
      this.program.programId
    )
    return eventAuthority
  }

  // Admin Functions
  async createClaimFeeOperator(
    params: Omit<CreateClaimFeeOperatorAccounts, 'program' | 'eventAuthority'>
  ) {
    const accounts = {
      ...params,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
    }

    const ix = await this.program.methods
      .createClaimFeeOperator()
      .accounts(accounts)
      .instruction()

    return ix
  }

  async closeClaimFeeOperator(
    params: Omit<CloseClaimFeeOperatorAccounts, 'program' | 'eventAuthority'>
  ) {
    const accounts = {
      ...params,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
    }

    const ix = await this.program.methods
      .closeClaimFeeOperator()
      .accounts(accounts)
      .instruction()

    return ix
  }

  // Partner Functions
  async createConfig(
    params: Omit<CreateConfigAccounts, 'program' | 'eventAuthority'>,
    configParameters: ConfigParameters
  ) {
    const { ...rest } = params
    const accounts = {
      ...rest,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
    }

    const ix = await this.program.methods
      .createConfig(configParameters)
      .accounts(accounts)
      .instruction()

    return ix
  }

  async migrationMeteoraDammCreateMetadata(
    params: Omit<MigrationDammV2CreateMetadataAccounts, 'program'>
  ) {
    const ix = await this.program.methods
      .migrationMeteoraDammCreateMetadata()
      .accounts({
        ...params,
        program: this.program.programId,
      })
      .instruction()

    return ix
  }

  async migrateMeteoraDamm(
    params: Omit<MigrateMeteoraDammAccounts, 'program' | 'eventAuthority'>
  ) {
    const accounts = {
      ...params,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
    }

    const ix = await this.program.methods
      .migrateMeteoraDamm()
      .accounts(accounts)
      .instruction()

    return ix
  }

  async migrateMeteoraDammLockLpTokenForCreator(
    params: Omit<
      MigrateMeteoraDammLockLpTokenForCreatorAccounts,
      'program' | 'eventAuthority'
    >
  ) {
    const accounts = {
      ...params,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
    }

    const ix = await this.program.methods
      .migrateMeteoraDammLockLpTokenForCreator()
      .accounts(accounts)
      .instruction()

    return ix
  }

  async migrateMeteoraDammLockLpTokenForPartner(
    params: Omit<
      MigrateMeteoraDammLockLpTokenForPartnerAccounts,
      'program' | 'eventAuthority'
    >
  ) {
    const accounts = {
      ...params,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
    }

    const ix = await this.program.methods
      .migrateMeteoraDammLockLpTokenForPartner()
      .accounts(accounts)
      .instruction()

    return ix
  }

  // User Functions
  async initializeVirtualPoolWithSplToken(
    params: Required<
      Omit<
        InitializeVirtualPoolWithSplTokenAccounts,
        | 'program'
        | 'eventAuthority'
        | 'baseVault'
        | 'quoteVault'
        | 'pool'
        | 'systemProgram'
        | 'metadataAddress'
        | 'mintMetadata'
        | 'metadataProgram'
        | 'poolAuthority'
      >
    >,
    initializeParams: InitializePoolParameters
  ) {
    const isQuoteMintBiggerThanBaseMint =
      new PublicKey(params.quoteMint!)
        .toBuffer()
        .compare(new Uint8Array(new PublicKey(params.baseMint!).toBuffer())) > 0

    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_authority')],
      this.program.programId
    )

    const [pool] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('pool'),
        new PublicKey(params.config).toBuffer(),
        isQuoteMintBiggerThanBaseMint
          ? new PublicKey(params.quoteMint).toBuffer()
          : new PublicKey(params.baseMint!).toBuffer(),
        isQuoteMintBiggerThanBaseMint
          ? new PublicKey(params.baseMint!).toBuffer()
          : new PublicKey(params.quoteMint).toBuffer(),
      ],
      this.program.programId
    )

    const [baseVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('token_vault'),
        new PublicKey(params.baseMint!).toBuffer(),
        pool.toBuffer(),
      ],
      this.program.programId
    )

    const [quoteVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('token_vault'),
        new PublicKey(params.quoteMint!).toBuffer(),
        pool.toBuffer(),
      ],
      this.program.programId
    )

    const [mintMetadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        new PublicKey(params.baseMint!).toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )

    const accounts: InitializeVirtualPoolWithSplTokenAccounts = {
      ...params,
      poolAuthority,
      systemProgram: SystemProgram.programId,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
      baseVault,
      quoteVault,
      pool,
      metadataProgram: METADATA_PROGRAM_ID,
      mintMetadata,
    }

    const ix = await this.program.methods
      .initializeVirtualPoolWithSplToken(initializeParams)
      .accounts(accounts)
      .instruction()

    return ix
  }

  async initializeVirtualPoolWithToken2022(
    params: Omit<InitializeVirtualPoolWithToken2022Accounts, 'program'>,
    initializeParams: InitializePoolParameters
  ) {
    const { ...rest } = params
    const accounts = {
      ...rest,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
    }

    const ix = await this.program.methods
      .initializeVirtualPoolWithToken2022(initializeParams)
      .accounts({
        ...accounts,
        program: this.program.programId,
      })
      .instruction()

    return ix
  }

  async swap(
    params: Omit<
      SwapAccounts,
      | 'program'
      | 'eventAuthority'
      | 'inputTokenAccount'
      | 'outputTokenAccount'
      | 'poolAuthority'
    > & { user: PublicKey; swapBaseForQuote: boolean },
    swapParams: SwapParameters
  ) {
    const inputMint = params.swapBaseForQuote
      ? new PublicKey(params.baseMint)
      : new PublicKey(params.quoteMint)
    const outputMint = params.swapBaseForQuote
      ? new PublicKey(params.quoteMint)
      : new PublicKey(params.baseMint)

    const isSOLInput = inputMint.toString() === SOL_MINT.toString()
    const isSOLOutput = outputMint.toString() === SOL_MINT.toString()

    const inputTokenAccount = findAssociatedTokenAddress(
      params.user,
      inputMint,
      new PublicKey(params.tokenQuoteProgram)
    )

    const outputTokenAccount = findAssociatedTokenAddress(
      params.user,
      outputMint,
      new PublicKey(params.tokenBaseProgram)
    )

    const ixs = []
    const cleanupIxs = []
    if (isSOLInput) {
      ixs.push(
        createAssociatedTokenAccountIdempotentInstruction(
          params.user,
          inputTokenAccount,
          params.user,
          inputMint
        )
      )
      ixs.push(
        SystemProgram.transfer({
          fromPubkey: params.user,
          toPubkey: inputTokenAccount,
          lamports: swapParams.amountIn.toNumber(),
        }),
        createSyncNativeInstruction(inputTokenAccount)
      )
      cleanupIxs.push(
        createCloseAccountInstruction(
          inputTokenAccount,
          params.user,
          params.user,
          [],
          TOKEN_PROGRAM_ID
        )
      )
    }

    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        params.user,
        outputTokenAccount,
        params.user,
        outputMint
      )
    )

    if (isSOLOutput) {
      cleanupIxs.push(
        createCloseAccountInstruction(
          outputTokenAccount,
          params.user,
          params.user,
          [],
          TOKEN_PROGRAM_ID
        )
      )
    }

    const ix = await this.program.methods
      .swap(swapParams)
      .accounts({
        ...params,
        inputTokenAccount,
        outputTokenAccount,
        program: this.program.programId,
      })
      .instruction()
    ixs.push(ix)
    ixs.push(...cleanupIxs)
    return ixs
  }

  // Fee Management
  async claimProtocolFee(
    params: Omit<ClaimProtocolFeeAccounts, 'program' | 'eventAuthority'>
  ) {
    const accounts = {
      ...params,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
    }

    const ix = await this.program.methods
      .claimProtocolFee()
      .accounts(accounts)
      .instruction()

    return ix
  }

  async claimTradingFee(
    params: Omit<ClaimTradingFeeAccounts, 'program' | 'eventAuthority'> & {
      maxAmountA: typeof BN | string | number
      maxAmountB: typeof BN | string | number
    }
  ) {
    const { maxAmountA, maxAmountB, ...rest } = params
    const accounts = {
      ...rest,
      eventAuthority: this.getEventAuthority(),
      program: this.program.programId,
    }

    // Convert to BN if needed
    const amountA =
      maxAmountA instanceof BN ? maxAmountA : new BN(maxAmountA.toString())
    const amountB =
      maxAmountB instanceof BN ? maxAmountB : new BN(maxAmountB.toString())

    const ix = await this.program.methods
      .claimTradingFee(amountA, amountB)
      .accounts(accounts)
      .instruction()

    return ix
  }

  // Account fetching
  async getPool(poolAddress: PublicKey | string) {
    const address =
      typeof poolAddress === 'string' ? new PublicKey(poolAddress) : poolAddress
    return await this.program.account.virtualPool.fetch(address)
  }

  async getConfig(configAddress: PublicKey | string) {
    const address =
      typeof configAddress === 'string'
        ? new PublicKey(configAddress)
        : configAddress
    return await this.program.account.config.fetch(address)
  }

  async getClaimFeeOperator(operatorAddress: PublicKey | string) {
    const address =
      typeof operatorAddress === 'string'
        ? new PublicKey(operatorAddress)
        : operatorAddress
    return await this.program.account.claimFeeOperator.fetch(address)
  }

  async getMeteoraDammMigrationMetadata(metadataAddress: PublicKey | string) {
    const address =
      typeof metadataAddress === 'string'
        ? new PublicKey(metadataAddress)
        : metadataAddress
    return await this.program.account.meteoraDammMigrationMetadata.fetch(
      address
    )
  }

  /**
   * Retrieves pools with optional filtering by owner
   * @param owner Optional PublicKey or string to filter pools by owner
   * @returns Array of pool accounts with their addresses
   */
  async getPools(owner?: PublicKey | string) {
    const filters: GetProgramAccountsFilter[] = []

    if (owner) {
      const ownerKey = typeof owner === 'string' ? new PublicKey(owner) : owner
      filters.push({
        memcmp: {
          offset: 292, // Correct offset for the owner field after the discriminator and other fields
          bytes: ownerKey.toBase58(),
          encoding: 'base58',
        },
      })
    }

    return await this.program.account.virtualPool.all(filters)
  }

  /**
   * Retrieves configs with optional filtering by owner
   * @param owner Optional PublicKey or string to filter configs by owner
   * @returns Array of config accounts with their addresses
   */
  async getPoolConfigs(owner?: PublicKey | string) {
    const filters: GetProgramAccountsFilter[] = []

    if (owner) {
      const ownerKey = typeof owner === 'string' ? new PublicKey(owner) : owner
      filters.push({
        memcmp: {
          offset: 72,
          bytes: ownerKey.toBase58(),
          encoding: 'base58',
        },
      })
    }

    return await this.program.account.poolConfig.all(filters)
  }

  async getPoolConfig(configAddress: PublicKey | string) {
    const address =
      typeof configAddress === 'string'
        ? new PublicKey(configAddress)
        : configAddress
    return await this.program.account.poolConfig.fetch(address)
  }

  quoteExactIn(
    virtualPool: VirtualPool,
    config: PoolConfig,
    swapBaseForQuote: boolean,
    amountIn: BN,
    hasReferral: boolean,
    currentPoint: BN
  ) {
    return quoteExactIn(
      virtualPool,
      config,
      swapBaseForQuote,
      amountIn,
      hasReferral,
      currentPoint
    )
  }
}

export * from './constants'
