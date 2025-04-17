import { useState } from 'react'
import type { MetaFunction } from '@remix-run/cloudflare'
import { Link } from '@remix-run/react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export const meta: MetaFunction = () => {
  return [
    { title: 'Virtual Curve - Customizable Launchpad Pools on Solana' },
    {
      name: 'description',
      content:
        'Create and trade customizable launchpad pools on Solana with Virtual Curve.',
    },
  ]
}

export default function Index() {
  const [activeTab, setActiveTab] = useState('features')

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 text-white">
      {/* Header */}
      <Header currentPath="/" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Create Your Own{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            Virtual Curve
          </span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
          The customizable launchpad pool for Solana. Create, trade, and manage
          token pools with your own parameters.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/explore-pools"
            className="bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-3 rounded-full font-medium hover:opacity-90 transition"
          >
            Explore Pools
          </Link>
          <Link
            to="/create-pool"
            className="bg-transparent border border-white/20 px-8 py-3 rounded-full font-medium hover:bg-white/10 transition"
          >
            Create Pool
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">
          Why Choose Virtual Curve?
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="bg-white/10 p-8 rounded-xl backdrop-blur-sm">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-14 h-14 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 6V18M18 12H6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">No-Code Creation</h3>
            <p className="text-gray-300">
              Launch your token with a simple interface. No programming
              knowledge required.
            </p>
          </div>
          <div className="bg-white/10 p-8 rounded-xl backdrop-blur-sm">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-14 h-14 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 6V12L16 14"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Fully Customizable</h3>
            <p className="text-gray-300">
              Set your own fee structure, liquidity curve, and token
              distribution parameters.
            </p>
          </div>
          <div className="bg-white/10 p-8 rounded-xl backdrop-blur-sm">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-14 h-14 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Solana-Powered</h3>
            <p className="text-gray-300">
              Benefit from Solana's fast transactions and low fees for your
              token launch.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="container mx-auto px-4 py-20 bg-white/5 rounded-3xl my-10"
      >
        <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
              1
            </div>
            <h3 className="text-xl font-bold mb-3">Connect Wallet</h3>
            <p className="text-gray-300">
              Link your Solana wallet to get started with Virtual Curve.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
              2
            </div>
            <h3 className="text-xl font-bold mb-3">Configure Pool</h3>
            <p className="text-gray-300">
              Set your token parameters, fee structure, and liquidity curve.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
              3
            </div>
            <h3 className="text-xl font-bold mb-3">Deploy Pool</h3>
            <p className="text-gray-300">
              Launch your pool with a single click and receive your unique pool
              URL.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
              4
            </div>
            <h3 className="text-xl font-bold mb-3">Share & Trade</h3>
            <p className="text-gray-300">
              Share your pool with your community and start trading.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">
          What You Can Build
        </h2>

        <div className="flex border-b border-white/20 mb-8">
          <button
            className={`px-6 py-3 ${
              activeTab === 'features'
                ? 'border-b-2 border-purple-500 text-white'
                : 'text-gray-400'
            }`}
            onClick={() => setActiveTab('features')}
          >
            Token Launch
          </button>
          <button
            className={`px-6 py-3 ${
              activeTab === 'pump'
                ? 'border-b-2 border-purple-500 text-white'
                : 'text-gray-400'
            }`}
            onClick={() => setActiveTab('pump')}
          >
            Pump.fun Clone
          </button>
          <button
            className={`px-6 py-3 ${
              activeTab === 'custom'
                ? 'border-b-2 border-purple-500 text-white'
                : 'text-gray-400'
            }`}
            onClick={() => setActiveTab('custom')}
          >
            Custom Curve
          </button>
        </div>

        <div className="bg-white/10 p-8 rounded-xl backdrop-blur-sm">
          {activeTab === 'features' && (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold mb-4">
                  Standard Token Launch
                </h3>
                <p className="text-gray-300 mb-4">
                  Create a traditional token launch with a linear price curve.
                  Perfect for projects looking for a fair and transparent
                  launch.
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Customizable initial price</li>
                  <li>Set your own fee structure</li>
                  <li>Control token supply and distribution</li>
                  <li>Transparent trading mechanism</li>
                </ul>
              </div>
              <div className="md:w-1/2 bg-black/30 rounded-xl p-4 flex items-center justify-center">
                <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-70"></div>
              </div>
            </div>
          )}

          {activeTab === 'pump' && (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold mb-4">
                  Pump.fun Style Launch
                </h3>
                <p className="text-gray-300 mb-4">
                  Create a pump.fun style token with a bonding curve that
                  increases price as more tokens are purchased.
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Exponential price growth</li>
                  <li>Early buyer incentives</li>
                  <li>Automatic liquidity provision</li>
                  <li>Customizable curve parameters</li>
                </ul>
              </div>
              <div className="md:w-1/2 bg-black/30 rounded-xl p-4 flex items-center justify-center">
                <div className="w-full h-64 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg opacity-70"></div>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold mb-4">
                  Custom Liquidity Curve
                </h3>
                <p className="text-gray-300 mb-4">
                  Design your own unique liquidity curve for specialized token
                  economics and trading behavior.
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Multi-point curve definition</li>
                  <li>Dynamic fee structures</li>
                  <li>Price stabilization mechanisms</li>
                  <li>Advanced trading parameters</li>
                </ul>
              </div>
              <div className="md:w-1/2 bg-black/30 rounded-xl p-4 flex items-center justify-center">
                <div className="w-full h-64 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg opacity-70"></div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-12 rounded-3xl backdrop-blur-sm">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Launch Your Token?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Create your customized token launch pool in minutes with Virtual
            Curve. No coding required.
          </p>
          <button className="bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-3 rounded-full font-medium hover:opacity-90 transition text-lg">
            Get Started Now
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-white/10 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-3">What is Virtual Curve?</h3>
            <p className="text-gray-300">
              Virtual Curve is a customizable launchpad for creating token pools
              on Solana. It allows you to create and configure your own token
              launch without writing any code.
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-3">
              How is this different from pump.fun?
            </h3>
            <p className="text-gray-300">
              While pump.fun offers a specific type of bonding curve, Virtual
              Curve allows you to customize every aspect of your token launch,
              including the price curve, fee structure, and distribution
              parameters.
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-3">
              Do I need to know how to code?
            </h3>
            <p className="text-gray-300">
              No coding knowledge is required. Our intuitive interface allows
              you to configure all aspects of your token launch through a simple
              UI.
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-3">
              What fees does Virtual Curve charge?
            </h3>
            <p className="text-gray-300">
              Virtual Curve charges a small protocol fee on transactions. You
              can also set your own creator fees that you'll earn from trades in
              your pool.
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-3">Is Virtual Curve secure?</h3>
            <p className="text-gray-300">
              Yes, Virtual Curve is built on Solana and uses audited smart
              contracts. Your funds and tokens are secured by blockchain
              technology.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
