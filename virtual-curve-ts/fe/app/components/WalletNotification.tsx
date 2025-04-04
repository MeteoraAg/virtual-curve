import {
  IUnifiedWalletConfig,
  IWalletNotification,
} from '@jup-ag/wallet-adapter/dist/types/contexts/WalletConnectionProvider'
import { toast } from 'sonner'
import { CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react'
import { Fragment } from 'react/jsx-runtime'

const WalletNotification: IUnifiedWalletConfig['notificationCallback'] = {
  onConnect: (props: IWalletNotification) => {
    toast.success(
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-green-200 shadow-md">
        <div className="flex-shrink-0 bg-green-100 p-2 rounded-full">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-base">
            Wallet Connected
          </span>
          <span className="text-sm text-gray-600">{`Connected to wallet ${props.shortAddress}`}</span>
        </div>
      </div>,
      {
        style: {
          padding: 0,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          width: 'auto',
          maxWidth: '380px',
        },
        duration: 4000,
        icon: <Fragment />,
      }
    )
  },
  onConnecting: (props: IWalletNotification) => {
    toast.message(
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-purple-200 shadow-md">
        <div className="flex-shrink-0 bg-purple-100 p-2 rounded-full">
          <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-base">
            Connecting to {props.walletName}
          </span>
          <span className="text-sm text-gray-600">
            Please approve the connection request
          </span>
        </div>
      </div>,
      {
        style: {
          padding: 0,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          width: 'auto',
          maxWidth: '380px',
        },
        icon: <Fragment />,
      }
    )
  },
  onDisconnect: (props: IWalletNotification) => {
    toast.message(
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-md">
        <div className="flex-shrink-0 bg-gray-100 p-2 rounded-full">
          <XCircle className="h-6 w-6 text-gray-600" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-base">
            Disconnected from {props.walletName}
          </span>
          <span className="text-sm text-gray-600">{`Disconnected from wallet ${props.shortAddress}`}</span>
        </div>
      </div>,
      {
        style: {
          padding: 0,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          width: 'auto',
          maxWidth: '380px',
        },
        duration: 3000,
        icon: <Fragment />,
      }
    )
  },
  onNotInstalled: (props: IWalletNotification) => {
    toast.error(
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-red-200 shadow-md">
        <div className="flex-shrink-0 bg-red-100 p-2 rounded-full">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-base">
            {props.walletName} Wallet is not installed
          </span>
          <span className="text-sm text-gray-600">
            {`Please go to the provider`}{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 font-medium hover:text-purple-800 hover:underline"
              href={props.metadata.url}
            >
              {`website`}
            </a>{' '}
            {`to download.`}
          </span>
        </div>
      </div>,
      {
        style: {
          padding: 0,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          width: 'auto',
          maxWidth: '380px',
        },
        duration: 5000,
        icon: <Fragment />,
      }
    )
  },
}

export default WalletNotification
