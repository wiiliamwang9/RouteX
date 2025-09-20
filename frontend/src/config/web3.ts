// Web3 configuration for RouteX frontend
import { Chain } from 'wagmi'
import { NETWORK_CONFIG } from '../contracts/types'

// Monad Testnet configuration
export const monadTestnet: Chain = {
  id: NETWORK_CONFIG.chainId,
  name: NETWORK_CONFIG.name,
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: [NETWORK_CONFIG.rpcUrl] },
    default: { http: [NETWORK_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: NETWORK_CONFIG.blockExplorer },
  },
  testnet: true,
}

// Supported chains
export const supportedChains = [monadTestnet]

// Default chain
export const defaultChain = monadTestnet

// RPC configuration
export const rpcConfig = {
  [NETWORK_CONFIG.chainId]: NETWORK_CONFIG.rpcUrl,
}

// Contract configuration
export const contractConfig = {
  chainId: NETWORK_CONFIG.chainId,
  confirmations: 2, // Number of confirmations to wait
  gasLimitBuffer: 1.2, // 20% buffer for gas limit
  maxGasPriceGwei: 200, // Maximum gas price in gwei
}

// Token configuration for the frontend
export const tokenList = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logoURI: '/tokens/eth.png',
    isNative: true,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    address: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
    decimals: 18,
    logoURI: '/tokens/weth.png',
    isNative: false,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
    decimals: 6,
    logoURI: '/tokens/usdc.png',
    isNative: false,
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0xA3dbBD3887228aE84f08bE839f9e20485759a004',
    decimals: 18,
    logoURI: '/tokens/dai.png',
    isNative: false,
  },
]

// Get token by symbol
export const getTokenBySymbol = (symbol: string) => {
  return tokenList.find(token => token.symbol.toLowerCase() === symbol.toLowerCase())
}

// Get token by address
export const getTokenByAddress = (address: string) => {
  return tokenList.find(token => token.address.toLowerCase() === address.toLowerCase())
}

// Trading configuration
export const tradingConfig = {
  defaultSlippage: 0.5, // 0.5%
  maxSlippage: 5.0, // 5%
  defaultDeadline: 20, // 20 minutes
  maxDeadline: 60, // 60 minutes
  minTradeAmount: '0.001', // Minimum trade amount in ETH
  maxTradeAmount: '100', // Maximum trade amount in ETH
}

// Strategy configuration
export const strategyConfig = {
  types: [
    { value: 'arbitrage', label: 'Arbitrage' },
    { value: 'grid', label: 'Grid Trading' },
    { value: 'dca', label: 'Dollar Cost Averaging' },
    { value: 'momentum', label: 'Momentum' },
    { value: 'mean_reversion', label: 'Mean Reversion' },
    { value: 'yield_farming', label: 'Yield Farming' },
    { value: 'custom', label: 'Custom' },
  ],
  riskLevels: [
    { value: 'low', label: 'Low Risk', color: 'green' },
    { value: 'medium', label: 'Medium Risk', color: 'yellow' },
    { value: 'high', label: 'High Risk', color: 'red' },
  ],
  defaultParams: {
    maxPositionSize: '10000', // $10,000
    maxSlippage: 100, // 1%
    rebalanceInterval: 3600, // 1 hour
    stopLossThreshold: 500, // 5%
    takeProfitThreshold: 1000, // 10%
  }
}