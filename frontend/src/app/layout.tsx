import { Inter } from 'next/font/google'
import { Web3Provider } from '../providers/Web3Provider'
import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'RouteX - Advanced Quantitative Trading',
  description: 'Enterprise-grade quantitative trading infrastructure with AI-powered optimization and MEV protection',
  keywords: 'DeFi, trading, MEV protection, AI optimization, cross-chain, Monad',
  authors: [{ name: 'RouteX Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#7c3aed',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <Web3Provider>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
                      RouteX
                    </h1>
                    <span className="text-sm text-gray-400">
                      Advanced Quantitative Trading
                    </span>
                  </div>
                  
                  <nav className="hidden md:flex items-center space-x-6">
                    <a href="/" className="text-gray-300 hover:text-white transition-colors">
                      Trading
                    </a>
                    <a href="/strategies" className="text-gray-300 hover:text-white transition-colors">
                      Strategies
                    </a>
                    <a href="/analytics" className="text-gray-300 hover:text-white transition-colors">
                      Analytics
                    </a>
                    <a href="/docs" className="text-gray-300 hover:text-white transition-colors">
                      Docs
                    </a>
                  </nav>
                  
                  <div className="flex items-center space-x-3">
                    <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Monad Testnet</span>
                    </div>
                    {/* Wallet connect button will be added by RainbowKit */}
                  </div>
                </div>
              </div>
            </header>
            
            <main className="flex-1">
              {children}
            </main>
            
            <footer className="border-t border-gray-800 bg-gray-900/30 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                  <div className="text-sm text-gray-400">
                    © 2024 RouteX. Built for professional quantitative trading.
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-400">
                    <a href="/privacy" className="hover:text-white transition-colors">
                      Privacy
                    </a>
                    <a href="/terms" className="hover:text-white transition-colors">
                      Terms
                    </a>
                    <a href="https://github.com/routex" className="hover:text-white transition-colors">
                      GitHub
                    </a>
                    <a href="https://discord.gg/routex" className="hover:text-white transition-colors">
                      Discord
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Web3Provider>
      </body>
    </html>
  )
}