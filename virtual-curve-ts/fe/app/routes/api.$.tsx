import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Transaction,
} from '@solana/web3.js'
import { BN } from 'bn.js'
import { VirtualCurveSDK } from '../../../lib/src'
import { LoaderFunctionArgs } from '@remix-run/cloudflare'

// Initialize connection
const connection = new Connection(
  process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
)

// Initialize SDK
const sdk = new VirtualCurveSDK(connection)

// Helper to convert string to PublicKey
const toPublicKey = (key: string) => new PublicKey(key)

// Define common schemas
const publicKeySchema = t.String({
  pattern: '^[1-9A-HJ-NP-Za-km-z]{32,44}$',
  description: 'Solana public key in base58 format',
})

const bnSchema = t.String({
  pattern: '^[0-9]+$',
  description: 'Big number as string',
})

// Define instruction response schema
const instructionResponseSchema = t.Object({
  instruction: t.Object({
    data: t.String(),
    keys: t.Array(
      t.Object({
        pubkey: t.String(),
        isSigner: t.Boolean(),
        isWritable: t.Boolean(),
      })
    ),
    programId: t.String(),
  }),
})

// Define account response schemas based on IDL
const poolMetricsSchema = t.Object({
  totalProtocolBaseFee: t.String(),
  totalProtocolQuoteFee: t.String(),
  totalTradingBaseFee: t.String(),
  totalTradingQuoteFee: t.String(),
})

const baseFeeStructSchema = t.Object({
  cliffFeeNumerator: t.String(),
  feeSchedulerMode: t.String(),
  padding0: t.Array(t.String()),
  numberOfPeriod: t.String(),
  periodFrequency: t.String(),
  reductionFactor: t.String(),
  padding1: t.String(),
})

const dynamicFeeStructSchema = t.Object({
  initialized: t.String(),
  padding: t.Array(t.String()),
  maxVolatilityAccumulator: t.String(),
  variableFeeControl: t.String(),
  binStep: t.String(),
  filterPeriod: t.String(),
  decayPeriod: t.String(),
  reductionFactor: t.String(),
  lastUpdateTimestamp: t.String(),
  binStepU128: t.String(),
  sqrtPriceReference: t.String(),
  volatilityAccumulator: t.String(),
  volatilityReference: t.String(),
})

const poolFeesStructSchema = t.Object({
  baseFee: baseFeeStructSchema,
  protocolFeePercent: t.String(),
  referralFeePercent: t.String(),
  padding0: t.Array(t.String()),
  dynamicFee: dynamicFeeStructSchema,
  padding1: t.Array(t.String()),
})

// VirtualPool account schema based on IDL
const virtualPoolSchema = t.Object({
  poolFees: poolFeesStructSchema,
  config: t.String(),
  creator: t.String(),
  baseMint: t.String(),
  baseVault: t.String(),
  quoteVault: t.String(),
  baseReserve: t.String(),
  quoteReserve: t.String(),
  protocolBaseFee: t.String(),
  protocolQuoteFee: t.String(),
  tradingBaseFee: t.String(),
  tradingQuoteFee: t.String(),
  sqrtPrice: t.String(),
  activationPoint: t.String(),
  poolType: t.String(),
  isMigrated: t.String(),
  padding0: t.Array(t.String()),
  metrics: poolMetricsSchema,
  padding1: t.Array(t.String()),
})

// Config account schema based on IDL
const baseFeeConfigSchema = t.Object({
  cliffFeeNumerator: t.String(),
  feeSchedulerMode: t.String(),
  padding: t.Array(t.String()),
  numberOfPeriod: t.String(),
  periodFrequency: t.String(),
  reductionFactor: t.String(),
})

const dynamicFeeConfigSchema = t.Object({
  initialized: t.String(),
  padding: t.Array(t.String()),
  maxVolatilityAccumulator: t.String(),
  variableFeeControl: t.String(),
  binStep: t.String(),
  filterPeriod: t.String(),
  decayPeriod: t.String(),
  reductionFactor: t.String(),
  binStepU128: t.String(),
})

const poolFeesConfigSchema = t.Object({
  baseFee: baseFeeConfigSchema,
  protocolFeePercent: t.String(),
  referralFeePercent: t.String(),
  padding0: t.Array(t.String()),
  dynamicFee: dynamicFeeConfigSchema,
  padding1: t.Array(t.String()),
})

const liquidityDistributionConfigSchema = t.Object({
  sqrtPrice: t.String(),
  liquidity: t.String(),
})

const configSchema = t.Object({
  quoteMint: t.String(),
  feeClaimer: t.String(),
  owner: t.String(),
  poolFees: poolFeesConfigSchema,
  collectFeeMode: t.String(),
  migrationOption: t.String(),
  activationType: t.String(),
  tokenDecimal: t.String(),
  tokenType: t.String(),
  creatorPostMigrationFeePercentage: t.String(),
  padding0: t.Array(t.String()),
  swapBaseAmount: t.String(),
  migrationQuoteThreshold: t.String(),
  migrationBaseThreshold: t.String(),
  padding: t.Array(t.String()),
  sqrtStartPrice: t.String(),
  curve: t.Array(liquidityDistributionConfigSchema),
})

// ClaimFeeOperator account schema based on IDL
const claimFeeOperatorSchema = t.Object({
  operator: t.String(),
  padding: t.Array(t.String()),
})

// MeteoraDammMigrationMetadata account schema based on IDL
const meteoraDammMigrationMetadataSchema = t.Object({
  virtualPool: t.String(),
  owner: t.String(),
  partner: t.String(),
  lpMint: t.String(),
  lpMintedAmountForCreator: t.String(),
  lpMintedAmountForPartner: t.String(),
  progress: t.String(),
  creatorLockedStatus: t.String(),
  partnerLockedStatus: t.String(),
  padding: t.Array(t.String()),
})

// Define response schemas
const poolResponseSchema = t.Object({
  pool: virtualPoolSchema,
})

const configResponseSchema = t.Object({
  config: configSchema,
})

const claimFeeOperatorResponseSchema = t.Object({
  operator: claimFeeOperatorSchema,
})

const migrationMetadataResponseSchema = t.Object({
  metadata: meteoraDammMigrationMetadataSchema,
})

// Define request schemas
const swapParamsSchema = t.Object({
  amountIn: bnSchema,
  minimumAmountOut: bnSchema,
})

const swapRequestSchema = t.Object({
  poolAuthority: publicKeySchema,
  config: publicKeySchema,
  pool: publicKeySchema,
  inputTokenAccount: publicKeySchema,
  outputTokenAccount: publicKeySchema,
  baseVault: publicKeySchema,
  quoteVault: publicKeySchema,
  baseMint: publicKeySchema,
  quoteMint: publicKeySchema,
  payer: publicKeySchema,
  tokenBaseProgram: publicKeySchema,
  tokenQuoteProgram: publicKeySchema,
  referralTokenAccount: t.Optional(publicKeySchema),
  swapParams: swapParamsSchema,
})

const createConfigRequestSchema = t.Object({
  config: publicKeySchema,
  feeClaimer: publicKeySchema,
  owner: publicKeySchema,
  quoteMint: publicKeySchema,
  payer: publicKeySchema,
  systemProgram: publicKeySchema,
  configParameters: t.Any(),
})

const createClaimFeeOperatorRequestSchema = t.Object({
  claimFeeOperator: publicKeySchema,
  operator: publicKeySchema,
  admin: publicKeySchema,
  systemProgram: publicKeySchema,
})

// Helper function to serialize account data for JSON
function serializeAccount(account: any): any {
  if (account === null || account === undefined) {
    return account
  }

  if (account instanceof BN) {
    return account.toString()
  }

  if (account instanceof PublicKey) {
    return account.toBase58()
  }

  // Convert all numbers to strings to prevent overflow
  if (typeof account === 'number') {
    return account.toString()
  }

  if (Array.isArray(account)) {
    return account.map((item) => serializeAccount(item))
  }

  if (typeof account === 'object') {
    const result: Record<string, any> = {}
    for (const key in account) {
      result[key] = serializeAccount(account[key])
    }
    return result
  }

  return account
}

const app = new Elysia({
  aot: false,
})
  .use(cors())
  .use(
    swagger({
      path: '/api/swagger',
      documentation: {
        info: {
          title: 'Virtual Curve API',
          version: '1.0.0',
          description:
            'API for generating Virtual Curve transaction instructions',
        },
        tags: [
          { name: 'Admin', description: 'Admin functions' },
          { name: 'Partner', description: 'Partner functions' },
          { name: 'User', description: 'User functions' },
          { name: 'Account', description: 'Account fetching functions' },
        ],
      },
    })
  )
  .get('/', () => 'Virtual Curve API Server')

  // Admin Functions
  .post(
    '/createClaimFeeOperator',
    async ({ body }) => {
      const { claimFeeOperator, operator, admin, systemProgram } = body

      const ix = await sdk.createClaimFeeOperator({
        claimFeeOperator: toPublicKey(claimFeeOperator),
        operator: toPublicKey(operator),
        admin: toPublicKey(admin),
        systemProgram: toPublicKey(systemProgram),
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: createClaimFeeOperatorRequestSchema,
      response: instructionResponseSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Create a claim fee operator',
        description: 'Creates a new claim fee operator account',
      },
    }
  )

  .post(
    '/closeClaimFeeOperator',
    async ({ body }) => {
      const { claimFeeOperator, rentReceiver, admin } = body

      const ix = await sdk.closeClaimFeeOperator({
        claimFeeOperator: toPublicKey(claimFeeOperator),
        rentReceiver: toPublicKey(rentReceiver),
        admin: toPublicKey(admin),
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: t.Object({
        claimFeeOperator: publicKeySchema,
        rentReceiver: publicKeySchema,
        admin: publicKeySchema,
      }),
      response: instructionResponseSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Close a claim fee operator',
        description:
          'Closes an existing claim fee operator account and reclaims rent',
      },
    }
  )

  // Partner Functions
  .post(
    '/createConfig',
    async ({ body }) => {
      const ix = await sdk.createConfig({
        config: toPublicKey(body.config),
        feeClaimer: toPublicKey(body.feeClaimer),
        owner: toPublicKey(body.owner),
        quoteMint: toPublicKey(body.quoteMint),
        payer: toPublicKey(body.payer),
        systemProgram: toPublicKey(body.systemProgram),
        configParameters: body.configParameters,
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: createConfigRequestSchema,
      response: instructionResponseSchema,
      detail: {
        tags: ['Partner'],
        summary: 'Create a new config',
        description: 'Creates a new configuration for the Virtual Curve pool',
      },
    }
  )

  // User Functions
  .post(
    '/swap',
    async ({ body }) => {
      const {
        poolAuthority,
        config,
        pool,
        inputTokenAccount,
        outputTokenAccount,
        baseVault,
        quoteVault,
        baseMint,
        quoteMint,
        payer,
        tokenBaseProgram,
        tokenQuoteProgram,
        referralTokenAccount,
        swapParams,
      } = body

      const ix = await sdk.swap({
        poolAuthority: toPublicKey(poolAuthority),
        config: toPublicKey(config),
        pool: toPublicKey(pool),
        inputTokenAccount: toPublicKey(inputTokenAccount),
        outputTokenAccount: toPublicKey(outputTokenAccount),
        baseVault: toPublicKey(baseVault),
        quoteVault: toPublicKey(quoteVault),
        baseMint: toPublicKey(baseMint),
        quoteMint: toPublicKey(quoteMint),
        payer: toPublicKey(payer),
        tokenBaseProgram: toPublicKey(tokenBaseProgram),
        tokenQuoteProgram: toPublicKey(tokenQuoteProgram),
        referralTokenAccount: referralTokenAccount
          ? toPublicKey(referralTokenAccount)
          : undefined,
        swapParams: {
          amountIn: new BN(swapParams.amountIn),
          minimumAmountOut: new BN(swapParams.minimumAmountOut),
        },
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: swapRequestSchema,
      response: instructionResponseSchema,
      detail: {
        tags: ['User'],
        summary: 'Swap tokens',
        description: 'Swap tokens using the Virtual Curve pool',
      },
    }
  )

  .post(
    '/initializeVirtualPoolWithSplToken',
    async ({ body }) => {
      const {
        config,
        creator,
        baseMint,
        quoteMint,
        payer,
        tokenQuoteProgram,
        tokenProgram,
        initializeParams,
      } = body

      const ix = await sdk.initializeVirtualPoolWithSplToken(
        {
          config: toPublicKey(config),
          creator: toPublicKey(creator),
          baseMint: toPublicKey(baseMint),
          quoteMint: toPublicKey(quoteMint),
          payer: toPublicKey(payer),
          tokenQuoteProgram: toPublicKey(tokenQuoteProgram),
          tokenProgram: toPublicKey(tokenProgram),
        },
        initializeParams
      )

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: t.Object({
        config: publicKeySchema,
        creator: publicKeySchema,
        baseMint: publicKeySchema,
        quoteMint: publicKeySchema,
        payer: publicKeySchema,
        tokenQuoteProgram: publicKeySchema,
        tokenProgram: publicKeySchema,
        initializeParams: t.Object({
          name: t.String(),
          symbol: t.String(),
          uri: t.String(),
        }),
      }),
      response: instructionResponseSchema,
      detail: {
        tags: ['User'],
        summary: 'Initialize virtual pool with SPL token',
        description: 'Creates a new virtual pool with SPL token',
      },
    }
  )

  .post(
    '/initializeVirtualPoolWithToken2022',
    async ({ body }) => {
      const {
        config,
        poolAuthority,
        creator,
        baseMint,
        quoteMint,
        pool,
        baseVault,
        quoteVault,
        payer,
        tokenQuoteProgram,
        tokenProgram,
        systemProgram,
        initializeParams,
      } = body

      const ix = await sdk.initializeVirtualPoolWithToken2022({
        config: toPublicKey(config),
        poolAuthority: toPublicKey(poolAuthority),
        creator: toPublicKey(creator),
        baseMint: toPublicKey(baseMint),
        quoteMint: toPublicKey(quoteMint),
        pool: toPublicKey(pool),
        baseVault: toPublicKey(baseVault),
        quoteVault: toPublicKey(quoteVault),
        payer: toPublicKey(payer),
        tokenQuoteProgram: toPublicKey(tokenQuoteProgram),
        tokenProgram: toPublicKey(tokenProgram),
        systemProgram: toPublicKey(systemProgram),
        initializeParams,
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: t.Object({
        config: publicKeySchema,
        poolAuthority: publicKeySchema,
        creator: publicKeySchema,
        baseMint: publicKeySchema,
        quoteMint: publicKeySchema,
        pool: publicKeySchema,
        baseVault: publicKeySchema,
        quoteVault: publicKeySchema,
        payer: publicKeySchema,
        tokenQuoteProgram: publicKeySchema,
        tokenProgram: publicKeySchema,
        systemProgram: publicKeySchema,
        initializeParams: t.Any(),
      }),
      response: instructionResponseSchema,
      detail: {
        tags: ['User'],
        summary: 'Initialize virtual pool with Token-2022',
        description: 'Creates a new virtual pool with Token-2022 standard',
      },
    }
  )

  // Fee Management
  .post(
    '/claimProtocolFee',
    async ({ body }) => {
      const {
        poolAuthority,
        config,
        pool,
        baseVault,
        quoteVault,
        baseMint,
        quoteMint,
        tokenBaseAccount,
        tokenQuoteAccount,
        claimFeeOperator,
        operator,
        tokenBaseProgram,
        tokenQuoteProgram,
      } = body

      const ix = await sdk.claimProtocolFee({
        poolAuthority: toPublicKey(poolAuthority),
        config: toPublicKey(config),
        pool: toPublicKey(pool),
        baseVault: toPublicKey(baseVault),
        quoteVault: toPublicKey(quoteVault),
        baseMint: toPublicKey(baseMint),
        quoteMint: toPublicKey(quoteMint),
        tokenBaseAccount: toPublicKey(tokenBaseAccount),
        tokenQuoteAccount: toPublicKey(tokenQuoteAccount),
        claimFeeOperator: toPublicKey(claimFeeOperator),
        operator: toPublicKey(operator),
        tokenBaseProgram: toPublicKey(tokenBaseProgram),
        tokenQuoteProgram: toPublicKey(tokenQuoteProgram),
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: t.Object({
        poolAuthority: publicKeySchema,
        config: publicKeySchema,
        pool: publicKeySchema,
        baseVault: publicKeySchema,
        quoteVault: publicKeySchema,
        baseMint: publicKeySchema,
        quoteMint: publicKeySchema,
        tokenBaseAccount: publicKeySchema,
        tokenQuoteAccount: publicKeySchema,
        claimFeeOperator: publicKeySchema,
        operator: publicKeySchema,
        tokenBaseProgram: publicKeySchema,
        tokenQuoteProgram: publicKeySchema,
      }),
      response: instructionResponseSchema,
      detail: {
        tags: ['Admin'],
        summary: 'Claim protocol fee',
        description: 'Claims protocol fees from a virtual pool',
      },
    }
  )

  .post(
    '/claimTradingFee',
    async ({ body }) => {
      const {
        poolAuthority,
        config,
        pool,
        tokenAAccount,
        tokenBAccount,
        baseVault,
        quoteVault,
        baseMint,
        quoteMint,
        feeClaimer,
        tokenBaseProgram,
        tokenQuoteProgram,
        maxAmountA,
        maxAmountB,
      } = body

      const ix = await sdk.claimTradingFee({
        poolAuthority: toPublicKey(poolAuthority),
        config: toPublicKey(config),
        pool: toPublicKey(pool),
        tokenAAccount: toPublicKey(tokenAAccount),
        tokenBAccount: toPublicKey(tokenBAccount),
        baseVault: toPublicKey(baseVault),
        quoteVault: toPublicKey(quoteVault),
        baseMint: toPublicKey(baseMint),
        quoteMint: toPublicKey(quoteMint),
        feeClaimer: toPublicKey(feeClaimer),
        tokenBaseProgram: toPublicKey(tokenBaseProgram),
        tokenQuoteProgram: toPublicKey(tokenQuoteProgram),
        maxAmountA,
        maxAmountB,
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: t.Object({
        poolAuthority: publicKeySchema,
        config: publicKeySchema,
        pool: publicKeySchema,
        tokenAAccount: publicKeySchema,
        tokenBAccount: publicKeySchema,
        baseVault: publicKeySchema,
        quoteVault: publicKeySchema,
        baseMint: publicKeySchema,
        quoteMint: publicKeySchema,
        feeClaimer: publicKeySchema,
        tokenBaseProgram: publicKeySchema,
        tokenQuoteProgram: publicKeySchema,
        maxAmountA: bnSchema,
        maxAmountB: bnSchema,
      }),
      response: instructionResponseSchema,
      detail: {
        tags: ['Partner'],
        summary: 'Claim trading fee',
        description: 'Claims trading fees from a virtual pool',
      },
    }
  )

  // Migration endpoints
  .post(
    '/migrationMeteoraDammCreateMetadata',
    async ({ body }) => {
      const { metadata, virtualPool, config, payer, systemProgram } = body

      const ix = await sdk.migrationMeteoraDammCreateMetadata({
        virtualPool: toPublicKey(virtualPool),
        payer: toPublicKey(payer),
        systemProgram: toPublicKey(systemProgram),
        config: toPublicKey(config),
        migrationMetadata: toPublicKey(metadata),
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: t.Object({
        metadata: publicKeySchema,
        virtualPool: publicKeySchema,
        config: publicKeySchema,
        payer: publicKeySchema,
        systemProgram: publicKeySchema,
      }),
      response: instructionResponseSchema,
      detail: {
        tags: ['Partner'],
        summary: 'Create Meteora DAMM migration metadata',
        description: 'Creates metadata for Meteora DAMM migration',
      },
    }
  )

  .post(
    '/migrateMeteoraDamm',
    async ({ body }) => {
      const {
        virtualPool,
        migrationMetadata,
        config,
        poolAuthority,
        pool,
        dammConfig,
        lpMint,
        tokenAMint,
        tokenBMint,
        aVault,
        bVault,
        aTokenVault,
        bTokenVault,
        aVaultLpMint,
        bVaultLpMint,
        aVaultLp,
        bVaultLp,
        baseVault,
        quoteVault,
        virtualPoolLp,
        protocolTokenAFee,
        protocolTokenBFee,
        payer,
        rent,
        mintMetadata,
        metadataProgram,
        ammProgram,
        vaultProgram,
        tokenProgram,
        associatedTokenProgram,
        systemProgram,
      } = body

      const ix = await sdk.migrateMeteoraDamm({
        virtualPool: toPublicKey(virtualPool),
        migrationMetadata: toPublicKey(migrationMetadata),
        config: toPublicKey(config),
        poolAuthority: toPublicKey(poolAuthority),
        pool: toPublicKey(pool),
        dammConfig: toPublicKey(dammConfig),
        lpMint: toPublicKey(lpMint),
        tokenAMint: toPublicKey(tokenAMint),
        tokenBMint: toPublicKey(tokenBMint),
        aVault: toPublicKey(aVault),
        bVault: toPublicKey(bVault),
        aTokenVault: toPublicKey(aTokenVault),
        bTokenVault: toPublicKey(bTokenVault),
        aVaultLpMint: toPublicKey(aVaultLpMint),
        bVaultLpMint: toPublicKey(bVaultLpMint),
        aVaultLp: toPublicKey(aVaultLp),
        bVaultLp: toPublicKey(bVaultLp),
        baseVault: toPublicKey(baseVault),
        quoteVault: toPublicKey(quoteVault),
        virtualPoolLp: toPublicKey(virtualPoolLp),
        protocolTokenAFee: toPublicKey(protocolTokenAFee),
        protocolTokenBFee: toPublicKey(protocolTokenBFee),
        payer: toPublicKey(payer),
        rent: toPublicKey(rent),
        mintMetadata: toPublicKey(mintMetadata),
        metadataProgram: toPublicKey(metadataProgram),
        ammProgram: toPublicKey(ammProgram),
        vaultProgram: toPublicKey(vaultProgram),
        tokenProgram: toPublicKey(tokenProgram),
        associatedTokenProgram: toPublicKey(associatedTokenProgram),
        systemProgram: toPublicKey(systemProgram),
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: t.Object({
        virtualPool: publicKeySchema,
        migrationMetadata: publicKeySchema,
        config: publicKeySchema,
        poolAuthority: publicKeySchema,
        pool: publicKeySchema,
        dammConfig: publicKeySchema,
        lpMint: publicKeySchema,
        tokenAMint: publicKeySchema,
        tokenBMint: publicKeySchema,
        aVault: publicKeySchema,
        bVault: publicKeySchema,
        aTokenVault: publicKeySchema,
        bTokenVault: publicKeySchema,
        aVaultLpMint: publicKeySchema,
        bVaultLpMint: publicKeySchema,
        aVaultLp: publicKeySchema,
        bVaultLp: publicKeySchema,
        baseVault: publicKeySchema,
        quoteVault: publicKeySchema,
        virtualPoolLp: publicKeySchema,
        protocolTokenAFee: publicKeySchema,
        protocolTokenBFee: publicKeySchema,
        payer: publicKeySchema,
        rent: publicKeySchema,
        mintMetadata: publicKeySchema,
        metadataProgram: publicKeySchema,
        ammProgram: publicKeySchema,
        vaultProgram: publicKeySchema,
        tokenProgram: publicKeySchema,
        associatedTokenProgram: publicKeySchema,
        systemProgram: publicKeySchema,
      }),
      response: instructionResponseSchema,
      detail: {
        tags: ['Partner'],
        summary: 'Migrate Meteora DAMM',
        description:
          'Performs Meteora DAMM migration by migrating liquidity from a DAMM pool to a Virtual Curve pool',
      },
    }
  )

  .post(
    '/migrateMeteoraDammLockLpTokenForCreator',
    async ({ body }) => {
      const {
        migrationMetadata,
        poolAuthority,
        pool,
        lpMint,
        lockEscrow,
        owner,
        sourceTokens,
        escrowVault,
        ammProgram,
        aVault,
        bVault,
        aVaultLp,
        bVaultLp,
        aVaultLpMint,
        bVaultLpMint,
        tokenProgram,
      } = body

      const ix = await sdk.migrateMeteoraDammLockLpTokenForCreator({
        migrationMetadata: toPublicKey(migrationMetadata),
        poolAuthority: toPublicKey(poolAuthority),
        pool: toPublicKey(pool),
        lpMint: toPublicKey(lpMint),
        lockEscrow: toPublicKey(lockEscrow),
        owner: toPublicKey(owner),
        sourceTokens: toPublicKey(sourceTokens),
        escrowVault: toPublicKey(escrowVault),
        ammProgram: toPublicKey(ammProgram),
        aVault: toPublicKey(aVault),
        bVault: toPublicKey(bVault),
        aVaultLp: toPublicKey(aVaultLp),
        bVaultLp: toPublicKey(bVaultLp),
        aVaultLpMint: toPublicKey(aVaultLpMint),
        bVaultLpMint: toPublicKey(bVaultLpMint),
        tokenProgram: toPublicKey(tokenProgram),
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: t.Object({
        migrationMetadata: publicKeySchema,
        poolAuthority: publicKeySchema,
        pool: publicKeySchema,
        lpMint: publicKeySchema,
        lockEscrow: publicKeySchema,
        owner: publicKeySchema,
        sourceTokens: publicKeySchema,
        escrowVault: publicKeySchema,
        ammProgram: publicKeySchema,
        aVault: publicKeySchema,
        bVault: publicKeySchema,
        aVaultLp: publicKeySchema,
        bVaultLp: publicKeySchema,
        aVaultLpMint: publicKeySchema,
        bVaultLpMint: publicKeySchema,
        tokenProgram: publicKeySchema,
      }),
      response: instructionResponseSchema,
      detail: {
        tags: ['Partner'],
        summary: 'Lock LP token for creator',
        description: 'Locks LP token for creator in Meteora DAMM migration',
      },
    }
  )

  .post(
    '/migrateMeteoraDammLockLpTokenForPartner',
    async ({ body }) => {
      const {
        migrationMetadata,
        poolAuthority,
        pool,
        lpMint,
        lockEscrow,
        owner,
        sourceTokens,
        escrowVault,
        ammProgram,
        aVault,
        bVault,
        aVaultLp,
        bVaultLp,
        aVaultLpMint,
        bVaultLpMint,
        tokenProgram,
      } = body

      const ix = await sdk.migrateMeteoraDammLockLpTokenForPartner({
        migrationMetadata: toPublicKey(migrationMetadata),
        poolAuthority: toPublicKey(poolAuthority),
        pool: toPublicKey(pool),
        lpMint: toPublicKey(lpMint),
        lockEscrow: toPublicKey(lockEscrow),
        owner: toPublicKey(owner),
        sourceTokens: toPublicKey(sourceTokens),
        escrowVault: toPublicKey(escrowVault),
        ammProgram: toPublicKey(ammProgram),
        aVault: toPublicKey(aVault),
        bVault: toPublicKey(bVault),
        aVaultLp: toPublicKey(aVaultLp),
        bVaultLp: toPublicKey(bVaultLp),
        aVaultLpMint: toPublicKey(aVaultLpMint),
        bVaultLpMint: toPublicKey(bVaultLpMint),
        tokenProgram: toPublicKey(tokenProgram),
      })

      return {
        instruction: {
          data: Buffer.from(ix.data).toString('base64'),
          keys: ix.keys.map((k) => ({
            pubkey: k.pubkey.toBase58(),
            isSigner: k.isSigner,
            isWritable: k.isWritable,
          })),
          programId: ix.programId.toBase58(),
        },
      }
    },
    {
      body: t.Object({
        migrationMetadata: publicKeySchema,
        poolAuthority: publicKeySchema,
        pool: publicKeySchema,
        lpMint: publicKeySchema,
        lockEscrow: publicKeySchema,
        owner: publicKeySchema,
        sourceTokens: publicKeySchema,
        escrowVault: publicKeySchema,
        ammProgram: publicKeySchema,
        aVault: publicKeySchema,
        bVault: publicKeySchema,
        aVaultLp: publicKeySchema,
        bVaultLp: publicKeySchema,
        aVaultLpMint: publicKeySchema,
        bVaultLpMint: publicKeySchema,
        tokenProgram: publicKeySchema,
      }),
      response: instructionResponseSchema,
      detail: {
        tags: ['Partner'],
        summary: 'Lock LP token for partner',
        description: 'Locks LP token for partner in Meteora DAMM migration',
      },
    }
  )

  // Account fetching with validation
  .get(
    '/getPool/:address',
    async ({ params }) => {
      try {
        const pool = await sdk.getPool(params.address)
        // Apply the serialization function to convert BNs and PublicKeys to strings
        const serializedPool = serializeAccount(pool)
        return { pool: serializedPool }
      } catch (error) {
        return { error: (error as Error).message }
      }
    },
    {
      params: t.Object({
        address: publicKeySchema,
      }),
      response: {
        200: poolResponseSchema,
        400: t.Object({ error: t.String() }),
      },
      detail: {
        tags: ['Account'],
        summary: 'Get pool information',
        description:
          'Fetches information about a Virtual Curve pool. All numeric values are returned as strings.',
      },
    }
  )

  .get(
    '/getConfig/:address',
    async ({ params }) => {
      try {
        const config = await sdk.getConfig(params.address)
        // Apply the serialization function
        const serializedConfig = serializeAccount(config)
        return { config: serializedConfig }
      } catch (error) {
        return { error: (error as Error).message }
      }
    },
    {
      params: t.Object({
        address: publicKeySchema,
      }),
      response: {
        200: configResponseSchema,
        400: t.Object({ error: t.String() }),
      },
      detail: {
        tags: ['Account'],
        summary: 'Get config information',
        description:
          'Fetches information about a Virtual Curve configuration. All numeric values are returned as strings.',
      },
    }
  )

  .get(
    '/getClaimFeeOperator/:address',
    async ({ params }) => {
      try {
        const operator = await sdk.getClaimFeeOperator(params.address)
        // Apply the serialization function
        const serializedOperator = serializeAccount(operator)
        return { operator: serializedOperator }
      } catch (error) {
        return { error: (error as Error).message }
      }
    },
    {
      params: t.Object({
        address: publicKeySchema,
      }),
      response: {
        200: claimFeeOperatorResponseSchema,
        400: t.Object({ error: t.String() }),
      },
      detail: {
        tags: ['Account'],
        summary: 'Get claim fee operator information',
        description:
          'Fetches information about a claim fee operator. All numeric values are returned as strings.',
      },
    }
  )

  .get(
    '/getMeteoraDammMigrationMetadata/:address',
    async ({ params }) => {
      try {
        const metadata = await sdk.getMeteoraDammMigrationMetadata(
          toPublicKey(params.address)
        )
        // Apply the serialization function
        const serializedMetadata = serializeAccount(metadata)
        return { metadata: serializedMetadata }
      } catch (error) {
        return { error: (error as Error).message }
      }
    },
    {
      params: t.Object({
        address: publicKeySchema,
      }),
      response: {
        200: migrationMetadataResponseSchema,
        400: t.Object({ error: t.String() }),
      },
      detail: {
        tags: ['Account'],
        summary: 'Get migration metadata',
        description:
          'Fetches information about Meteora DAMM migration metadata. All numeric values are returned as strings.',
      },
    }
  )

// Export the loader function for Remix
export const loader = async ({
  params,
  request,
  context,
}: LoaderFunctionArgs) => {
  return await app.fetch(request)
}
