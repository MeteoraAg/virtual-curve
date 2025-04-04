import { useState, useEffect } from 'react'
import { Link } from '@remix-run/react'
import type { MetaFunction } from '@remix-run/cloudflare'
import { z } from 'zod'
import {
  Settings,
  TrendingUp,
  LineChart,
  Waves,
  ArrowRight,
  Check,
  AlertCircle,
} from 'lucide-react'
import { useForm, FormApi } from '@tanstack/react-form'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useWallet } from '@jup-ag/wallet-adapter'
import { useVirtualProgram } from '../contexts/VirtualProgramContext'
import {
  Keypair,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import { BN } from 'bn.js'
import TokenomicsChart from '../components/TokenomicsChart'
import { TEMPLATES, TemplateKey } from '../lib/templates'
import { useSendTransaction } from '../hooks/useSendTransaction'

export const meta: MetaFunction = () => {
  return [
    { title: 'Create Configuration - Virtual Curve' },
    {
      name: 'description',
      content:
        'Create and save pool configurations for your Virtual Curve pools.',
    },
  ]
}

// Define the schema for the configuration form based on SDK requirements
const configSchema = z.object({
  // Required SDK parameters
  feeClaimer: z.string().min(32, 'Fee claimer must be a valid Solana address'),
  owner: z.string().min(32, 'Owner must be a valid Solana address'),
  quoteMint: z.string().min(32, 'Quote mint must be a valid Solana address'),

  // Pool fees - Base fee
  baseFee: z.object({
    cliffFeeNumerator: z.number().int().min(0),
    numberOfPeriod: z.number().int().min(0),
    periodFrequency: z.number().int().min(0),
    reductionFactor: z.number().int().min(0),
    feeSchedulerMode: z.number().int().min(0).max(1), // 0: FLAT, 1: DECAY
  }),

  // Pool fees - Dynamic fee
  dynamicFee: z.object({
    binStep: z.number().int().min(0),
    binStepU128: z.number().int().min(0),
    filterPeriod: z.number().int().min(0),
    decayPeriod: z.number().int().min(0),
    reductionFactor: z.number().int().min(0),
    maxVolatilityAccumulator: z.number().int().min(0),
    variableFeeControl: z.number().int().min(0),
  }),

  // Other configuration parameters
  collectFeeMode: z.number().int().min(0).max(1), // 0: QuoteToken only, 1: Both tokens
  migrationOption: z.number().int().min(0).max(0), // 0: MeteoraDAMM (only option for now)
  activationType: z.number().int().min(0).max(1), // 0: Slot, 1: Timestamp
  tokenDecimal: z.number().int().min(0).max(9),
  tokenType: z.number().int().min(0).max(1), // 0: SplToken, 1: Token2022
  creatorPostMigrationFeePercentage: z.number().int().min(0).max(100),
  migrationQuoteThreshold: z.number().int().min(0),
  sqrtStartPrice: z.string(),

  // Liquidity distribution parameters
  liquidityDistribution: z
    .array(
      z.object({
        sqrtPrice: z.string().min(1, 'Sqrt price must be a valid string'),
        liquidity: z.string().min(1, 'Liquidity must be a valid string'),
      })
    )
    .min(1),
})

// Define the type based on the schema
type ConfigFormValues = z.infer<typeof configSchema>

interface ChartDisplayProps {
  form: any // TODO type this
  selectedTemplate: string
}

function ChartDisplay({ form, selectedTemplate }: ChartDisplayProps) {
  return (
    <form.Subscribe
      selector={(state: any) => ({
        liquidityPoints: state.values.liquidityDistribution || [],
        migrationQuoteThreshold: state.values.migrationQuoteThreshold || 0,
        tokenDecimal: state.values.tokenDecimal || 6,
      })}
    >
      {(values: any) => (
        <TokenomicsChart
          liquidityPoints={values.liquidityPoints}
          height={220}
          baseDecimals={values.tokenDecimal}
          showLiquidity={true}
          showPrice={true}
          lineColor={
            selectedTemplate === 'exponential'
              ? '#ec4899'
              : selectedTemplate === 'custom'
              ? '#a855f7'
              : '#3b82f6'
          }
          showAnalytics={true}
          showExplanation={true}
          migrationQuoteThreshold={values.migrationQuoteThreshold}
        />
      )}
    </form.Subscribe>
  )
}

export default function ConfigPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | ''>('')
  const [error, setError] = useState<string>('')
  const { publicKey, signTransaction } = useWallet()
  const virtualProgram = useVirtualProgram()
  const { sendTransaction, isLoading } = useSendTransaction()

  // Initialize TanStack Form
  const form = useForm({
    defaultValues: {
      ...(selectedTemplate ? TEMPLATES[selectedTemplate] : {}),
      feeClaimer: publicKey?.toBase58() || '',
      owner: publicKey?.toBase58() || '',
    } as ConfigFormValues,
    onSubmit: async ({ value }) => {
      console.log({ value })
      if (!virtualProgram.sdk) {
        throw new Error('Virtual program not initialized')
      }

      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected')
      }

      if (!virtualProgram.connection) {
        throw new Error('Connection not initialized')
      }

      const { connection, sdk } = virtualProgram
      const tempKeypair = Keypair.generate()
      const params = JSON.stringify(
        {
          config: tempKeypair.publicKey, // we can use a create seed from the user
          feeClaimer: value.feeClaimer,
          owner: value.owner,
          quoteMint: value.quoteMint,
          payer: publicKey,
          systemProgram: SystemProgram.programId,
          configParameters: {
            padding: [],
            activationType: value.activationType,
            collectFeeMode: value.collectFeeMode,
            migrationOption: value.migrationOption,
            poolFees: {
              baseFee: {
                cliffFeeNumerator: new BN(value.baseFee.cliffFeeNumerator),
                numberOfPeriod: value.baseFee.numberOfPeriod,
                periodFrequency: new BN(value.baseFee.periodFrequency),
                reductionFactor: new BN(value.baseFee.reductionFactor),
                feeSchedulerMode: value.baseFee.feeSchedulerMode,
              },
              dynamicFee: null,
            },
            creatorPostMigrationFeePercentage:
              value.creatorPostMigrationFeePercentage,
            curve: value.liquidityDistribution.map(
              ({ sqrtPrice, liquidity }) => ({
                sqrtPrice: new BN(sqrtPrice),
                liquidity: new BN(liquidity),
              })
            ),
            migrationQuoteThreshold: new BN(value.migrationQuoteThreshold),
            sqrtStartPrice: new BN(value.sqrtStartPrice),
            tokenDecimal: value.tokenDecimal,
            tokenType: value.tokenType,
          },
        },
        null,
        2
      )
      console.log(params)
      const ix = await sdk.createConfig(
        {
          config: tempKeypair.publicKey,
          feeClaimer: value.feeClaimer,
          owner: value.owner,
          quoteMint: value.quoteMint,
          payer: publicKey,
          systemProgram: SystemProgram.programId,
        },
        {
          padding: [],
          activationType: value.activationType,
          collectFeeMode: value.collectFeeMode,
          migrationOption: value.migrationOption,
          poolFees: {
            baseFee: {
              cliffFeeNumerator: new BN(value.baseFee.cliffFeeNumerator),
              numberOfPeriod: value.baseFee.numberOfPeriod,
              periodFrequency: new BN(value.baseFee.periodFrequency),
              reductionFactor: new BN(value.baseFee.reductionFactor),
              feeSchedulerMode: value.baseFee.feeSchedulerMode,
            },
            dynamicFee: null,
          },
          curve: value.liquidityDistribution.map(
            ({ sqrtPrice, liquidity }) => ({
              sqrtPrice: new BN(sqrtPrice),
              liquidity: new BN(liquidity),
            })
          ),
          migrationQuoteThreshold: new BN(value.migrationQuoteThreshold),
          sqrtStartPrice: new BN(value.sqrtStartPrice),
          tokenDecimal: value.tokenDecimal,
          tokenType: value.tokenType,
          creatorLockedLpPercentage: 50,
          creatorLpPercentage: 0,
          partnerLockedLpPercentage: 50,
          partnerLpPercentage: 0,
        }
      )

      const blockhash = await connection.getLatestBlockhash()
      let transaction = new Transaction({
        feePayer: publicKey,
        ...blockhash,
      }).add(ix)

      transaction.sign(tempKeypair)

      // Use the sendTransaction hook instead of directly sending and confirming
      await sendTransaction(transaction, connection, {
        onSuccess: (signature) => {
          console.log('Config created successfully, tx:', signature)
        },
        onError: (err) => {
          console.error('Failed to create config:', err)
          setError(err.message)
        },
      })
    },
    validators: {
      onSubmit: configSchema,
    },
  })

  // Handle template selection
  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template as TemplateKey)
    // Update the form values with the template values
    form.reset({
      ...form.state.values,
      ...TEMPLATES[template as TemplateKey],
      feeClaimer: publicKey?.toBase58() || '',
      owner: publicKey?.toBase58() || '',
    })

    setError('')
  }

  // Add a new liquidity distribution point
  const addLiquidityPoint = () => {
    const currentValues = form.state.values
    const liquidityDistribution = [...currentValues.liquidityDistribution]
    const lastPoint = liquidityDistribution[liquidityDistribution.length - 1]

    // Convert to number for calculations, but store as string
    const lastSqrtPrice = lastPoint ? Number(lastPoint.sqrtPrice) : 1000
    const lastLiquidity = lastPoint ? Number(lastPoint.liquidity) : 100000000

    const newSqrtPrice = Math.round(lastSqrtPrice * 1.5).toString()
    const newLiquidity = Math.round(lastLiquidity * 1.5).toString()

    const newDistribution = [
      ...liquidityDistribution,
      { sqrtPrice: newSqrtPrice, liquidity: newLiquidity },
    ]

    form.setFieldValue('liquidityDistribution', newDistribution)
  }

  // Remove a liquidity distribution point
  const removeLiquidityPoint = (index: number) => {
    const currentValues = form.state.values
    if (currentValues.liquidityDistribution.length <= 1) {
      setError('Cannot remove the last liquidity distribution point')
      return
    }

    const newDistribution = [...currentValues.liquidityDistribution]
    newDistribution.splice(index, 1)

    form.setFieldValue('liquidityDistribution', newDistribution)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <Header currentPath="/create-config" />

      {/* Page Content */}
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">Create Configuration</h1>
            <p className="text-gray-300">
              Design and save pool configurations for future use
            </p>
          </div>
          <Link
            to="/create-pool"
            className="mt-4 md:mt-0 bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 rounded-full font-medium hover:opacity-90 transition flex items-center gap-2"
          >
            <span>Create Pool</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Template Selection */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Choose a Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pump.fun Style Template */}
            <div
              className={`bg-white/5 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition border cursor-pointer ${
                selectedTemplate === 'exponential'
                  ? 'border-pink-500'
                  : 'border-white/10'
              }`}
              onClick={() => handleTemplateSelect('exponential')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleTemplateSelect('exponential')
              }
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-pink-500/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-pink-500" />
                </div>
                {selectedTemplate === 'exponential' && (
                  <div className="bg-pink-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">Pump.fun Style</h3>
              <p className="text-gray-300 text-sm mb-4">
                1% fee with 69k liquidity cap like pump.fun
              </p>
              <div className="h-24 bg-gradient-to-tr from-pink-500/5 to-purple-500/5 rounded-lg flex items-center justify-center">
                <TokenomicsChart
                  liquidityPoints={
                    TEMPLATES.exponential.liquidityDistribution || []
                  }
                  height={96}
                  baseDecimals={form.state.values.tokenDecimal || 6}
                  showLiquidity={false}
                  showPrice={true}
                  lineColor="#ec4899" // pink-500
                  showAnalytics={false} // Don't show analytics in template selection
                  showExplanation={false} // Don't show explanation in template selection
                  migrationQuoteThreshold={
                    TEMPLATES.exponential.migrationQuoteThreshold
                  }
                />
              </div>
            </div>

            {/* Standard Launch Template */}
            {/* <div
              className={`bg-white/5 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition border cursor-pointer ${
                selectedTemplate === 'linear'
                  ? 'border-blue-500'
                  : 'border-white/10'
              }`}
              onClick={() => handleTemplateSelect('linear')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleTemplateSelect('linear')
              }
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <LineChart className="w-6 h-6 text-blue-500" />
                </div>
                {selectedTemplate === 'linear' && (
                  <div className="bg-blue-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">Standard Launch</h3>
              <p className="text-gray-300 text-sm mb-4">
                Linear price growth for traditional token launches
              </p>
              <div className="h-24 bg-gradient-to-tr from-blue-500/5 to-teal-500/5 rounded-lg flex items-center justify-center">
                <TokenomicsChart
                  liquidityPoints={TEMPLATES.linear.liquidityDistribution || []}
                  height={96}
                  baseDecimals={form.state.values.tokenDecimal || 6}
                  showLiquidity={false}
                  showPrice={true}
                  lineColor="#3b82f6" // blue-500
                  showAnalytics={false} // Don't show analytics in template selection
                  showExplanation={false} // Don't show explanation in template selection
                />
              </div>
            </div> */}

            {/* Custom Curve Template */}
            {/* <div
              className={`bg-white/5 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition border cursor-pointer ${
                selectedTemplate === 'custom'
                  ? 'border-purple-500'
                  : 'border-white/10'
              }`}
              onClick={() => handleTemplateSelect('custom')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleTemplateSelect('custom')
              }
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <Waves className="w-6 h-6 text-purple-500" />
                </div>
                {selectedTemplate === 'custom' && (
                  <div className="bg-purple-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">Custom Curve</h3>
              <p className="text-gray-300 text-sm mb-4">
                Variable curve with multi-phase price behavior
              </p>
              <div className="h-24 bg-gradient-to-tr from-purple-500/5 to-indigo-500/5 rounded-lg flex items-center justify-center">
                <TokenomicsChart
                  liquidityPoints={TEMPLATES.custom.liquidityDistribution || []}
                  height={96}
                  baseDecimals={form.state.values.tokenDecimal || 6}
                  showLiquidity={false}
                  showPrice={true}
                  lineColor="#a855f7" // purple-500
                  showAnalytics={false} // Don't show analytics in template selection
                  showExplanation={false} // Don't show explanation in template selection
                />
              </div>
            </div> */}
          </div>
        </div>

        {/* Configuration Form */}
        {selectedTemplate && (
          <div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10 mb-10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <span>Configure Your Pool</span>
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-300">Error</h3>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
              className="space-y-6"
            >
              {/* Fee Claimer and Owner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Fee Claimer</h3>
                  {form.Field({
                    name: 'feeClaimer',
                    children: (field) => (
                      <input
                        type="text"
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-white/10 p-2 rounded-lg"
                      />
                    ),
                  })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Owner</h3>
                  {form.Field({
                    name: 'owner',
                    children: (field) => (
                      <input
                        type="text"
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-white/10 p-2 rounded-lg"
                      />
                    ),
                  })}
                </div>
              </div>

              {/* Quote Mint and Token Decimal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quote Mint</h3>
                  {form.Field({
                    name: 'quoteMint',
                    children: (field) => (
                      <input
                        type="text"
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-white/10 p-2 rounded-lg"
                      />
                    ),
                  })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Token Decimal</h3>
                  {form.Field({
                    name: 'tokenDecimal',
                    children: (field) => (
                      <input
                        type="number"
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(parseInt(e.target.value, 10))
                        }
                        className="w-full bg-white/10 p-2 rounded-lg"
                      />
                    ),
                  })}
                </div>
              </div>

              {/* Token Type and Collect Fee Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Token Type</h3>
                  {form.Field({
                    name: 'tokenType',
                    children: (field) => (
                      <select
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(parseInt(e.target.value, 10))
                        }
                        className="w-full bg-white/10 p-2 rounded-lg"
                      >
                        <option value="0">SplToken</option>
                        <option value="1">Token2022</option>
                      </select>
                    ),
                  })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Collect Fee Mode
                  </h3>
                  {form.Field({
                    name: 'collectFeeMode',
                    children: (field) => (
                      <select
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(parseInt(e.target.value, 10))
                        }
                        className="w-full bg-white/10 p-2 rounded-lg"
                      >
                        <option value="0">QuoteToken only</option>
                        <option value="1">Both tokens</option>
                      </select>
                    ),
                  })}
                </div>
              </div>

              {/* Migration Option and Activation Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Migration Option
                  </h3>
                  {form.Field({
                    name: 'migrationOption',
                    children: (field) => (
                      <select
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(parseInt(e.target.value, 10))
                        }
                        className="w-full bg-white/10 p-2 rounded-lg"
                      >
                        <option value="0">MeteoraDAMM</option>
                      </select>
                    ),
                  })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Activation Type
                  </h3>
                  {form.Field({
                    name: 'activationType',
                    children: (field) => (
                      <select
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(parseInt(e.target.value, 10))
                        }
                        className="w-full bg-white/10 p-2 rounded-lg"
                      >
                        <option value="0">Slot</option>
                        <option value="1">Timestamp</option>
                      </select>
                    ),
                  })}
                </div>
              </div>

              {/* Creator Post Migration Fee Percentage and Migration Quote Threshold */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Creator Post Migration Fee Percentage
                  </h3>
                  {form.Field({
                    name: 'creatorPostMigrationFeePercentage',
                    children: (field) => (
                      <input
                        type="number"
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(parseInt(e.target.value, 10))
                        }
                        className="w-full bg-white/10 p-2 rounded-lg"
                      />
                    ),
                  })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Migration Quote Threshold
                  </h3>
                  {form.Field({
                    name: 'migrationQuoteThreshold',
                    children: (field) => (
                      <input
                        type="number"
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(parseInt(e.target.value, 10))
                        }
                        className="w-full bg-white/10 p-2 rounded-lg"
                      />
                    ),
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Sqrt Start Price
                  </h3>
                  {form.Field({
                    name: 'sqrtStartPrice',
                    children: (field) => (
                      <input
                        type="number"
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full bg-white/10 p-2 rounded-lg"
                      />
                    ),
                  })}
                </div>
              </div>

              {/* Base Fee Section */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-xl font-semibold mb-4">
                  Base Fee Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Cliff Fee Numerator
                    </h3>
                    {form.Field({
                      name: 'baseFee.cliffFeeNumerator',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Number of Period
                    </h3>
                    {form.Field({
                      name: 'baseFee.numberOfPeriod',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Period Frequency
                    </h3>
                    {form.Field({
                      name: 'baseFee.periodFrequency',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Reduction Factor
                    </h3>
                    {form.Field({
                      name: 'baseFee.reductionFactor',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Fee Scheduler Mode
                    </h3>
                    {form.Field({
                      name: 'baseFee.feeSchedulerMode',
                      children: (field) => (
                        <select
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        >
                          <option value="0">FLAT</option>
                          <option value="1">DECAY</option>
                        </select>
                      ),
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic Fee Section */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-xl font-semibold mb-4">
                  Dynamic Fee Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Bin Step</h3>
                    {form.Field({
                      name: 'dynamicFee.binStep',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Bin Step U128
                    </h3>
                    {form.Field({
                      name: 'dynamicFee.binStepU128',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Filter Period
                    </h3>
                    {form.Field({
                      name: 'dynamicFee.filterPeriod',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Decay Period</h3>
                    {form.Field({
                      name: 'dynamicFee.decayPeriod',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Reduction Factor
                    </h3>
                    {form.Field({
                      name: 'dynamicFee.reductionFactor',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Max Volatility Accumulator
                    </h3>
                    {form.Field({
                      name: 'dynamicFee.maxVolatilityAccumulator',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Variable Fee Control
                    </h3>
                    {form.Field({
                      name: 'dynamicFee.variableFeeControl',
                      children: (field) => (
                        <input
                          type="number"
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-white/10 p-2 rounded-lg"
                        />
                      ),
                    })}
                  </div>
                </div>
              </div>

              {/* Liquidity Distribution Preview Graph */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-xl font-semibold mb-4">
                  Liquidity Distribution Preview
                </h3>
                <div className="bg-white/5 rounded-lg p-4">
                  <ChartDisplay
                    form={form}
                    selectedTemplate={selectedTemplate}
                  />
                </div>
              </div>

              {/* Liquidity Distribution Section */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Liquidity Distribution
                  </h3>
                  <button
                    type="button"
                    onClick={addLiquidityPoint}
                    className="bg-white/10 px-3 py-1 rounded-lg text-sm hover:bg-white/20 transition"
                  >
                    + Add Point
                  </button>
                </div>

                {form.Field({
                  name: 'liquidityDistribution',
                  children: (field) => (
                    <>
                      {field.state.value.map(
                        (
                          item: { sqrtPrice: string; liquidity: string },
                          index: number
                        ) => (
                          <div
                            key={index}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 relative"
                          >
                            <div>
                              <h3 className="text-lg font-semibold mb-2">
                                Sqrt Price {index + 1}
                              </h3>
                              <input
                                type="text"
                                value={item.sqrtPrice}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  const newDistribution = [...field.state.value]
                                  newDistribution[index] = {
                                    ...newDistribution[index],
                                    sqrtPrice: newValue,
                                  }
                                  field.handleChange(newDistribution)
                                }}
                                className="w-full bg-white/10 p-2 rounded-lg"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold">
                                  Liquidity {index + 1}
                                </h3>
                                {field.state.value.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeLiquidityPoint(index)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={item.liquidity}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  const newDistribution = [...field.state.value]
                                  newDistribution[index] = {
                                    ...newDistribution[index],
                                    liquidity: newValue,
                                  }
                                  field.handleChange(newDistribution)
                                }}
                                className="w-full bg-white/10 p-2 rounded-lg"
                              />
                            </div>
                          </div>
                        )
                      )}
                    </>
                  ),
                })}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 rounded-full font-medium transition ${
                  isLoading
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:opacity-90'
                }`}
              >
                {isLoading
                  ? 'Creating Configuration...'
                  : 'Create Pool Configuration'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
