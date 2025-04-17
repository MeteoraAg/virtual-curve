import { Link } from '@remix-run/react'
import { CircleDot } from 'lucide-react'
import { useUnifiedWalletContext, useWallet } from '@jup-ag/wallet-adapter'

interface HeaderProps {
  currentPath?: string
}

export default function Header({ currentPath = '' }: HeaderProps) {
  const { connected: isConnected } = useWallet()
  const { setShowModal } = useUnifiedWalletContext()

  const handleConnectWallet = () => {
    // In a real implementation, this would connect to a Solana wallet
    setShowModal(true)
  }

  return (
    <header className="container mx-auto px-4 py-6 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Link prefetch="render" to="/" className="flex items-center gap-2">
          <CircleDot className="w-6 h-6 text-white" strokeWidth={1.5} />
          <h1 className="text-2xl font-bold">Virtual Curve</h1>
        </Link>
      </div>
      <nav className="hidden md:flex gap-6">
        <Link
          prefetch="render"
          to="/"
          className={
            currentPath === '/'
              ? 'text-purple-300 border-b border-purple-300 pb-1'
              : 'hover:text-purple-300 transition'
          }
        >
          Home
        </Link>
        <Link
          prefetch="render"
          to="/explore-pools"
          className={
            currentPath === '/explore-pools'
              ? 'text-purple-300 border-b border-purple-300 pb-1'
              : 'hover:text-purple-300 transition'
          }
        >
          Explore Pools
        </Link>
        <Link
          prefetch="render"
          to="/create-config"
          className={
            currentPath === '/create-config'
              ? 'text-purple-300 border-b border-purple-300 pb-1'
              : 'hover:text-purple-300 transition'
          }
        >
          Configurations
        </Link>
        <Link
          prefetch="render"
          to="/create-pool"
          className={
            currentPath === '/create-pool'
              ? 'text-purple-300 border-b border-purple-300 pb-1'
              : 'hover:text-purple-300 transition'
          }
        >
          Create Pool
        </Link>
        <Link
          prefetch="render"
          to="/docs"
          className={
            currentPath === '/docs'
              ? 'text-purple-300 border-b border-purple-300 pb-1'
              : 'hover:text-purple-300 transition'
          }
        >
          Docs
        </Link>
      </nav>
      <div>
        {isConnected ? (
          <button className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-2 rounded-full font-medium hover:opacity-90 transition">
            Connected
          </button>
        ) : (
          <button
            onClick={handleConnectWallet}
            className="bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-2 rounded-full font-medium hover:opacity-90 transition"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}
