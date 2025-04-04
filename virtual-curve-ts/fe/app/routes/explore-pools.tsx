import { useState, useEffect, useMemo } from 'react'
import { Link } from '@remix-run/react'
import type { MetaFunction } from '@remix-run/cloudflare'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  CheckCircle,
  Box,
  TrendingUp,
  LineChart,
  Waves,
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useVirtualProgram } from '~/contexts/VirtualProgramContext'
import { ParsedAccountData } from '@solana/web3.js'

export const meta: MetaFunction = () => {
  return [
    { title: 'Explore Pools - Virtual Curve' },
    {
      name: 'description',
      content: 'Browse and discover token pools on Virtual Curve.',
    },
  ]
}

export default function ExplorePools() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('liquidity')
  const { sdk, connection } = useVirtualProgram()

  // Fetch pools using TanStack Query
  const {
    data: allPools, // Renamed to avoid conflict with filtered pools state
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pools'], // Unique key for this query
    queryFn: async () => {
      const pools = (await sdk?.getPools()) || []

      return pools
    }, // The function to fetch data
    enabled: !!sdk,
  })

  // Filter and sort pools based on user selections and fetched data
  const filteredAndSortedPools = useMemo(() => {
    if (!allPools) return [] // Return empty array if no data yet

    console.log('Recalculating filtered/sorted pools. Data:', allPools)

    let processedPools = [...allPools]

    // Apply search filter
    if (searchTerm) {
      processedPools = processedPools.filter((pool) =>
        pool.account.baseMint
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      processedPools = processedPools.filter((pool) => {
        if (filterType === 'all') {
          return true
        } else if (filterType === 'SPL-Token') {
          return pool.account.poolType === 0
        } else if (filterType === 'Token2022') {
          return pool.account.poolType === 1
        }
      })
    }

    // Apply sorting
    // Make a mutable copy for sorting
    processedPools = [...processedPools].sort((a, b) => {
      switch (sortBy) {
        case 'liquidity':
          // Ensure parsing handles potential non-numeric chars robustly
          const liquidityA = a.account.baseReserve
          const liquidityB = b.account.baseReserve
          return liquidityB.cmp(liquidityA) // Descending
        default:
          return 0
      }
    })

    console.log('Filtered/Sorted pools:', processedPools)
    return processedPools
  }, [allPools, searchTerm, filterType, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <Header currentPath="/explore-pools" />

      {/* Page Content */}
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">Explore Pools</h1>
            <p className="text-gray-300">
              Discover and trade on Virtual Curve pools
            </p>
          </div>
          <Link
            to="/create-pool"
            className="mt-4 md:mt-0 bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 rounded-full font-medium hover:opacity-90 transition"
          >
            Create New Pool
          </Link>
        </div>

        {/* Search and Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Search Input */}
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-purple-300" strokeWidth={1.5} />
              </div>
              <input
                type="search"
                className="block w-full p-2.5 pl-9 text-sm bg-white/5 border border-white/10 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                placeholder="Search by name or symbol"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-4">
            <select
              className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm focus:ring-purple-500 focus:border-purple-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="SPL-Token">SPL-Token</option>
              <option value="Token2022">Token2022</option>
            </select>

            <select
              className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm focus:ring-purple-500 focus:border-purple-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="liquidity">Highest Liquidity</option>
              <option value="volume">Highest Volume</option>
              <option value="newest">Newest First</option>
              <option value="price">Highest Price</option>
            </select>
          </div>
        </div>

        {/* Pools Grid - Conditionally render based on loading/error/data */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-300">
            Loading pools...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">
            Error loading pools: {error.message}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPools.length > 0 ? (
              filteredAndSortedPools.map((pool) => (
                <div
                  key={pool.publicKey.toString()}
                  className="bg-white/5 rounded-xl overflow-hidden backdrop-blur-sm hover:bg-white/10 transition border border-white/10"
                >
                  {/* Pool curve visualization at the top */}
                  <div className="h-20 w-full relative">
                    {/* Pool type badge */}
                    <span
                      className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium`}
                    >
                      {pool.account.poolType}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="text-lg font-bold">
                            {pool.account.baseMint.toString()}
                          </h3>
                        </div>
                        <p className="text-gray-400 text-xs">$TODO</p>
                      </div>
                      <div className="text-right">
                        {/* <p className="font-medium text-sm">
                          {pool.account.baseReserve
                            .div(pool.account.quoteReserve)
                            .toString()}
                        </p> */}
                        {/* <span
                          className={`text-xs ${
                            pool.priceChange.startsWith('+')
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {pool.priceChange}
                        </span> */}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Liquidity</p>
                        <p className="font-medium">
                          {pool.account.baseReserve.toString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">24h Volume</p>
                        <p className="font-medium">
                          {pool.account.metrics.totalTradingQuoteFee.toString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Creator</p>
                        <p className="font-medium">
                          {pool.account.creator.toString()}
                        </p>
                      </div>
                      {/* <div>
                        <p className="text-gray-400 text-xs">Created</p>
                        <p className="font-medium">
                          {new Date(pool.createdAt).toLocaleDateString()}
                        </p>
                      </div> */}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/pool/${pool.publicKey.toString()}`}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-2 rounded-lg font-medium hover:opacity-90 transition text-center text-sm"
                      >
                        Trade
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-white/5 rounded-lg border border-white/10">
                <Box
                  className="w-8 h-8 mx-auto mb-2 text-gray-400"
                  strokeWidth={1.5}
                />
                <h3 className="text-base font-bold mb-1">No pools found</h3>
                <p className="text-gray-400 text-xs">
                  {allPools && allPools.length > 0
                    ? 'Try adjusting your search or filters'
                    : 'There are currently no pools to display.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
