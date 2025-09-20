'use client'

import { ReactNode } from 'react'
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { RainbowKitProvider, darkTheme, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { monadTestnet, supportedChains } from '../config/web3'

// Configure chains
const { chains, publicClient, webSocketPublicClient } = configureChains(
  supportedChains,
  [publicProvider()]
)

// Configure wallets
const { connectors } = getDefaultWallets({
  appName: 'RouteX',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'default-project-id',
  chains,
})

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 30000, // 30 seconds
    },
  },
})

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider
          chains={chains}
          theme={darkTheme({
            accentColor: '#7c3aed',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          appInfo={{
            appName: 'RouteX',
            learnMoreUrl: 'https://routex.io/docs',
          }}
        >
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f9fafb',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f9fafb',
                },
              },
            }}
          />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  )
}