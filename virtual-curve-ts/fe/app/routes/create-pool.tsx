import { useState, useEffect } from 'react'
import { Link, useSearchParams } from '@remix-run/react'
import type { MetaFunction } from '@remix-run/cloudflare'
import { z } from 'zod'
import {
  Rocket,
  ArrowLeft,
  Save,
  Upload,
  Check,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Header from '../components/Header'
import Footer from '../components/Footer'
import TokenomicsChart from '../components/TokenomicsChart'
import { TEMPLATES } from '../lib/templates'
import { useVirtualProgram } from '~/contexts/VirtualProgramContext'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  FEE_DENOMINATOR,
  TOKEN_PROGRAM_2022_ID,
  TOKEN_PROGRAM_ID,
} from '../../../lib/src'
import { useForm } from '@tanstack/react-form'
import { Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { useSendTransaction } from '~/hooks/useSendTransaction'

export const meta: MetaFunction = () => {
  return [
    { title: 'Create Pool - Virtual Curve' },
    {
      name: 'description',
      content:
        'Create a new token pool on Virtual Curve with customizable price curves.',
    },
  ]
}

// Define the schema for form validation
const poolSchema = z.object({
  tokenName: z.string().min(3, 'Token name must be at least 3 characters'),
  tokenSymbol: z
    .string()
    .min(1, 'Token symbol is required')
    .max(10, 'Token symbol must be 10 characters or less'),
  tokenLogo: z.instanceof(File).optional().nullable(),
  website: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal('')),
  twitter: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal('')),
  telegram: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal('')),
  configPubkey: z.string().min(1, 'Configuration is required'),
})

// Define the FormValues interface
interface FormValues {
  tokenName: string
  tokenSymbol: string
  tokenLogo?: File | null
  website?: string
  twitter?: string
  telegram?: string
  configPubkey: string
}

export default function CreatePool() {
  const [searchParams, setSearchParams] = useSearchParams()
  const configId = searchParams.get('config')
  const { sendTransaction } = useSendTransaction()

  const { sdk, connection } = useVirtualProgram()
  const wallet = useWallet()

  // Query to fetch configs owned by the current wallet
  const { data: userConfigs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['configs', wallet.publicKey?.toString()],
    queryFn: async () => {
      if (!wallet.publicKey || !sdk) return []

      const configs = await sdk.getPoolConfigs(wallet.publicKey)

      return configs.map((config) => ({
        id: config.publicKey.toString(),
        account: config.account,
      }))
    },
    enabled: !!wallet.publicKey && !!sdk,
  })

  // Initialize TanStack Form
  const form = useForm({
    defaultValues: {
      tokenName: '',
      tokenSymbol: '',
      tokenLogo: null,
      website: '',
      twitter: '',
      telegram: '',
      configPubkey: configId || '',
    } as FormValues,
    onSubmit: async ({ value }) => {
      try {
        if (!sdk || !connection) throw new Error('SDK not initialized')
        if (!wallet.publicKey) throw new Error('Wallet not connected')

        // In a real app, this would be an API call to create the pool
        console.log('Creating pool with values:', value)
        const config = await sdk.getPoolConfig(
          new PublicKey(value.configPubkey)
        )

        if (!config) throw new Error('Config not found')

        const mintKeypair = Keypair.generate()
        const { pool, ix } = await sdk.initializeVirtualPoolWithSplToken(
          {
            baseMint: mintKeypair.publicKey,
            config: value.configPubkey,
            creator: wallet.publicKey,
            quoteMint: config.quoteMint,
            payer: wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenQuoteProgram: TOKEN_PROGRAM_ID,
          },
          {
            name: value.tokenName,
            symbol: value.tokenSymbol,
            uri: value.tokenLogo?.name || '',
          }
        )

        console.log('Pool:', pool)

        const recentBlockhash = await connection.getLatestBlockhash('confirmed')
        const transaction = new Transaction({
          feePayer: wallet.publicKey,
          ...recentBlockhash,
        })

        transaction.add(ix)
        transaction.partialSign(mintKeypair)

        // Use the sendTransaction hook instead of directly sending and confirming
        const resp = await sendTransaction(transaction, connection, {
          onSuccess: (signature) => {
            console.log('Pool created successfully, tx:', signature)
          },
          onError: (err) => {
            console.error('Failed to create Pool:', err)
            // setError(err.message)
          },
        })
        await resp?.unwrap()
      } catch (err) {
        console.error('Submission error:', err)
        throw new Error('Failed to create pool. Please try again.')
      }
    },
    validators: {
      onSubmit: poolSchema,
    },
  })

  // Update form when configId changes
  useEffect(() => {
    if (configId) {
      form.setFieldValue('configPubkey', configId)
    }
  }, [configId])

  // Add a section to display the user's configs
  const renderUserConfigs = () => {
    if (isLoadingConfigs) {
      return (
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      )
    }

    if (!userConfigs || userConfigs.length === 0) {
      return (
        <div className="text-center py-4 text-gray-400">
          No configurations found.{' '}
          <Link
            to="/config"
            className="text-purple-500 underline cursor-pointer"
          >
            Create your first one!
          </Link>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {userConfigs.map((config) => {
          // Extract the actual liquidity points from the config's curve data
          const liquidityPoints =
            config.account.curve?.map((point) => ({
              sqrtPrice: point.sqrtPrice.toString(),
              liquidity: point.liquidity.toString(),
            })) || []

          const feePercentage =
            (Number(config.account.poolFees.baseFee.cliffFeeNumerator) /
              Number(FEE_DENOMINATOR)) *
            100

          // Determine color based on fee percentage
          const lineColor = feePercentage > 2 ? '#ec4899' : '#3b82f6'

          // Check if this config is currently selected
          const isSelected = config.id === form.getFieldValue('configPubkey')

          return (
            <div
              key={config.id}
              className={`${
                isSelected
                  ? 'bg-purple-800/30 border-purple-500'
                  : 'bg-white/10 border-white/20 hover:border-purple-500/50'
              } rounded-lg border transition flex flex-col h-full relative overflow-hidden`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-medium py-1 px-2 rounded-bl-md">
                  Selected
                </div>
              )}

              <div className="p-4 pb-3 relative z-10">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-white mb-4">
                    Config: {config.id.substring(0, 8)}...
                  </h3>
                </div>
                <TokenomicsChart
                  liquidityPoints={liquidityPoints}
                  height={100}
                  baseDecimals={config.account.tokenDecimal}
                  showAnalytics={false}
                  showLiquidity={false}
                  showExplanation={false}
                  lineColor={lineColor}
                  migrationQuoteThreshold={config.account.migrationQuoteThreshold.toNumber()}
                />

                <div className="text-sm text-gray-300 space-y-2 mb-4">
                  <p className="flex justify-between items-center">
                    <span>Trading Fee:</span>
                    <span className="font-medium text-white">
                      {feePercentage.toFixed(2)}%
                    </span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>Fee Schedule:</span>
                    <span className="font-medium text-white">
                      {config.account.poolFees.baseFee.feeSchedulerMode === 0
                        ? 'Fixed'
                        : 'Dynamic'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  form.setFieldValue('configPubkey', config.id)
                  setSearchParams(
                    { config: config.id },
                    { preventScrollReset: true }
                  )
                }}
                className={`mt-auto ${
                  isSelected
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-purple-600/30 hover:bg-purple-600/50'
                } transition py-3 text-center text-sm font-medium w-full rounded-b-lg relative z-10`}
              >
                {isSelected ? 'Selected Configuration' : 'Use This Config'}
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <Header currentPath="/create-pool" />

      {/* Page Content */}
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">Create Pool</h1>
            <p className="text-gray-300">
              Launch your token with a customizable price curve
            </p>
          </div>
          <Link
            to="/config"
            className="mt-4 md:mt-0 bg-white/10 px-6 py-3 rounded-full font-medium hover:bg-white/20 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Configurations</span>
          </Link>
        </div>

        {/* Your Saved Configurations Section */}
        {wallet.connected && (
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 mb-8">
            <h2 className="text-xl font-bold mb-4">
              Your Saved Configurations
            </h2>
            {renderUserConfigs()}
          </div>
        )}

        {form.state.isSubmitted &&
        !form.state.isSubmitting &&
        form.state.errors.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10 text-center">
            <div className="bg-green-500/20 p-4 rounded-full inline-flex mb-6">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Pool Created Successfully!
            </h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              Your token pool has been created and is now live on the Virtual
              Curve platform. Users can now buy and trade your tokens.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/explore-pools"
                className="bg-white/10 px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition"
              >
                Explore Pools
              </Link>
              <button
                onClick={() => {
                  window.location.reload()
                }}
                className="cursor-pointer bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 rounded-xl font-medium hover:opacity-90 transition"
              >
                Create Another Pool
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="space-y-8"
          >
            {/* Token Details Section */}
            <div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Token Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label
                      htmlFor="tokenName"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Token Name*
                    </label>
                    {form.Field({
                      name: 'tokenName',
                      children: (field) => (
                        <input
                          id="tokenName"
                          name={field.name}
                          type="text"
                          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
                          placeholder="e.g. Virtual Coin"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                          minLength={3}
                        />
                      ),
                    })}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="tokenSymbol"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Token Symbol*
                    </label>
                    {form.Field({
                      name: 'tokenSymbol',
                      children: (field) => (
                        <input
                          id="tokenSymbol"
                          name={field.name}
                          type="text"
                          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
                          placeholder="e.g. VRTL"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                          maxLength={10}
                        />
                      ),
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="tokenLogo"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Token Logo
                  </label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                    <Upload className="w-10 h-10 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300 mb-2">
                      Drag and drop your logo here
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      PNG, JPG or SVG (max. 2MB)
                    </p>
                    {form.Field({
                      name: 'tokenLogo',
                      children: (field) => (
                        <input
                          type="file"
                          id="tokenLogo"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            field.handleChange(file)
                          }}
                        />
                      ),
                    })}
                    <label
                      htmlFor="tokenLogo"
                      className="bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition cursor-pointer"
                    >
                      Browse Files
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10">
              <h2 className="text-2xl font-bold mb-6">
                Social Links (Optional)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Website
                  </label>
                  {form.Field({
                    name: 'website',
                    children: (field) => (
                      <input
                        id="website"
                        name={field.name}
                        type="url"
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
                        placeholder="https://yourwebsite.com"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    ),
                  })}
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="twitter"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Twitter
                  </label>
                  {form.Field({
                    name: 'twitter',
                    children: (field) => (
                      <input
                        id="twitter"
                        name={field.name}
                        type="url"
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
                        placeholder="https://twitter.com/yourusername"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    ),
                  })}
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="telegram"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Telegram
                  </label>
                  {form.Field({
                    name: 'telegram',
                    children: (field) => (
                      <input
                        id="telegram"
                        name={field.name}
                        type="url"
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
                        placeholder="https://t.me/yourchannel"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    ),
                  })}
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {form.state.errors && form.state.errors.length > 0 && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 space-y-2">
                {form.state.errors.map((error, index) =>
                  Object.entries(error || {}).map(([key, value]) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-red-200">
                        {value.map((v) => v.message).join(', ')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={form.state.isSubmitting}
                className="bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-4 rounded-xl font-medium hover:opacity-90 transition flex items-center gap-2 disabled:opacity-70"
              >
                {form.state.isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Pool...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    <span>Launch Pool</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
