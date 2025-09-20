'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { SwapForm } from '../components/trading/SwapForm'

export default function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="container-responsive section-padding">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
          Advanced Quantitative Trading
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Professional trading infrastructure with AI-powered optimization, MEV protection, 
          and cross-chain routing capabilities on Monad.
        </p>
        
        {!isConnected && (
          <div className="mb-8">
            <ConnectButton />
          </div>
        )}
      </div>

      {/* Main Trading Interface */}
      {isConnected ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trading Form */}
          <div className="lg:col-span-1">
            <SwapForm />
          </div>
          
          {/* Market Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card card-content text-center">
                <div className="text-2xl font-bold text-green-400">99.2%</div>
                <div className="text-sm text-gray-400">MEV Protection</div>
              </div>
              <div className="card card-content text-center">
                <div className="text-2xl font-bold text-blue-400">&lt;2s</div>
                <div className="text-sm text-gray-400">Avg Execution</div>
              </div>
              <div className="card card-content text-center">
                <div className="text-2xl font-bold text-purple-400">15-30%</div>
                <div className="text-sm text-gray-400">Gas Savings</div>
              </div>
              <div className="card card-content text-center">
                <div className="text-2xl font-bold text-yellow-400">99.8%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
            </div>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card card-content">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  High-Frequency Trading
                </h3>
                <p className="text-gray-300 text-sm">
                  Execute trades in milliseconds with advanced order management and batch processing capabilities.
                </p>
              </div>
              
              <div className="card card-content">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  MEV Protection
                </h3>
                <p className="text-gray-300 text-sm">
                  Advanced commit-reveal mechanisms and batch execution to prevent sandwich attacks and frontrunning.
                </p>
              </div>
              
              <div className="card card-content">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  AI Optimization
                </h3>
                <p className="text-gray-300 text-sm">
                  Machine learning algorithms for optimal route selection, slippage prediction, and risk assessment.
                </p>
              </div>
              
              <div className="card card-content">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Cross-Chain Routing
                </h3>
                <p className="text-gray-300 text-sm">
                  Seamless asset bridging across multiple chains with optimal fee and time analysis.
                </p>
              </div>
            </div>
            
            {/* Network Status */}
            <div className="card card-content">
              <h3 className="text-lg font-semibold mb-4">Network Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white">Monad Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chain ID:</span>
                  <span className="text-white">10143</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Online
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Block Time:</span>
                  <span className="text-white">~1s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Not Connected State */
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card card-content text-center">
              <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">
                Execute trades in under 2 seconds with Monad's parallel processing
              </p>
            </div>
            
            <div className="card card-content text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">MEV Protected</h3>
              <p className="text-gray-400 text-sm">
                Advanced protection against frontrunning and sandwich attacks
              </p>
            </div>
            
            <div className="card card-content text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Powered</h3>
              <p className="text-gray-400 text-sm">
                Smart routing and risk assessment with machine learning
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to access professional quantitative trading tools
            </p>
            <ConnectButton />
          </div>
        </div>
      )}
    </div>
  )
}