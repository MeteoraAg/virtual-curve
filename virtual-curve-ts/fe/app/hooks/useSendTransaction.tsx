import { useState } from 'react'
import { toast } from 'sonner' // Changed from react-hot-toast to sonner
import { useWallet } from '@jup-ag/wallet-adapter'
import {
  Connection,
  Transaction,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js'
import bs58 from 'bs58'

type SendTransactionOptions = {
  onSuccess?: (signature: string) => void
  onError?: (error: Error) => void
}

export function useSendTransaction() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const { publicKey, signTransaction } = useWallet()

  const sendTransaction = async (
    transaction: Transaction,
    connection: Connection,
    options: SendTransactionOptions = {}
  ) => {
    if (!publicKey || !signTransaction) {
      const walletError = new Error('Wallet not connected')
      setError(walletError)

      toast.error('Wallet not connected. Please connect your wallet.')

      if (options.onError) {
        options.onError(walletError)
      }

      return null
    }

    setIsLoading(true)
    setError(null)
    setSignature(null)

    // Using Sonner promise API instead of toast.loading with ID
    return toast.promise(
      async () => {
        // Set the fee payer if not already set
        transaction.feePayer = transaction.feePayer || publicKey

        // Get latest blockhash if not already set
        if (!transaction.recentBlockhash) {
          const blockhash = await connection.getLatestBlockhash()
          transaction.recentBlockhash = blockhash.blockhash
        }

        // Sign the transaction
        const signedTransaction = await signTransaction(transaction)

        // Send and confirm transaction
        const txSignature = await sendAndConfirmRawTransaction(
          connection,
          signedTransaction.serialize(),
          {
            commitment: 'confirmed',
          }
        )

        setSignature(txSignature)
        setIsLoading(false)

        if (options.onSuccess) {
          options.onSuccess(txSignature)
        }
        console.log({ txSignature })

        return txSignature
      },
      {
        loading: 'Processing transaction...',
        // Use a string message first, then show the link in a separate toast
        success: (txSignature) => {
          // Show a separate toast with the link after successful confirmation

          // Return simple string for the main success toast
          return {
            action: (
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on Explorer
              </a>
            ),
            message: 'Transaction confirmed!',
          }
        },
        error: (err) => {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
          setIsLoading(false)

          if (options.onError) {
            options.onError(error)
          }

          // Return simple string with error message
          return `Transaction failed: ${error.message}`
        },
      }
    )
  }

  return {
    sendTransaction,
    isLoading,
    error,
    signature,
  }
}
