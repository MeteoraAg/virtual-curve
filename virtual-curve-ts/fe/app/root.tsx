import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/cloudflare'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'

import './tailwind.css'
import { Adapter, UnifiedWalletProvider } from '@jup-ag/wallet-adapter'
import { useMemo } from 'react'
import WalletNotification from './components/WalletNotification'
import { VirtualProgramProvider } from './contexts/VirtualProgramContext'
import { Toaster } from 'sonner'
import { Buffer } from 'buffer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

globalThis.Buffer = Buffer
export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export async function loader({ context }: LoaderFunctionArgs) {
  return {
    RPC_ENDPOINT:
      context.cloudflare.env.RPC_ENDPOINT || process.env.RPC_ENDPOINT,
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), [])

  const wallets: Adapter[] = useMemo(() => {
    return [new PhantomWalletAdapter(), new SolflareWalletAdapter()].filter(
      (item) => item && item.name && item.icon
    ) as Adapter[]
  }, [])

  const data = useLoaderData<typeof loader>()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <VirtualProgramProvider rpcEndpoint={data.RPC_ENDPOINT!}>
            <UnifiedWalletProvider
              wallets={wallets}
              config={{
                env: 'mainnet-beta',
                autoConnect: true,
                metadata: {
                  name: 'UnifiedWallet',
                  description: 'UnifiedWallet',
                  url: 'https://jup.ag',
                  iconUrls: ['https://jup.ag/favicon.ico'],
                },
                notificationCallback: WalletNotification,
                theme: 'dark',
                lang: 'en',
              }}
            >
              <Toaster />

              {children}
            </UnifiedWalletProvider>
          </VirtualProgramProvider>
        </QueryClientProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}
