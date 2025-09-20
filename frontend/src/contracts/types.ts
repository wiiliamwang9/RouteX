// Auto-generated TypeScript definitions for RouteX contracts
// Generated on: 2025-09-20T06:02:39.949Z

export interface ContractConfig {
  network: string;
  chainId: number;
  contracts: {
    TraderAgent: ContractInfo;
    RouterDefense: ContractInfo;
    CrossChainRouter: ContractInfo;
    AIStrategyOptimizer: ContractInfo;
    QuantGuardPro: ContractInfo;
  };
  external: {
    uniswapRouter: string;
    weth: string;
    usdc: string;
    dai: string;
  };
}

export interface ContractInfo {
  address: string;
  abi: any[];
}

// Contract addresses as constants
export const CONTRACT_ADDRESSES = {
  TRADERAGENT: '0x7267749E1Fa24Cae44e1B76Ec90F3B2f98D2C290' as const,
  ROUTERDEFENSE: '0x458Ec2Bc6E645ccd8f98599D6E4d942ea480ca16' as const,
  CROSSCHAINROUTER: '0x22A8C0BD01f88D3461c98E9bc3399A83dDBB9Cee' as const,
  AISTRATEGYOPTIMIZER: '0xc6aF426FC11BFb6d46ffaB9A57c30ab5437AA09C' as const,
  QUANTGUARDPRO: '0xb10a0b0f6282024D5c3b5256CB312D06177cF4ab' as const,
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 10143,
  name: 'Monad Testnet',
  currency: 'ETH',
  rpcUrl: 'https://testnet-rpc.monad.xyz/',
  blockExplorer: 'https://testnet.monadexplorer.com/',
} as const;

// External contract addresses
export const EXTERNAL_CONTRACTS = {
  UNISWAP_ROUTER: '0x4c4eABd5Fb1D1A7234A48692551eAECFF8194CA7',
  WETH: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
  USDC: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  DAI: '0xA3dbBD3887228aE84f08bE839f9e20485759a004',
} as const;

// Trading types
export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  recipient: string;
  deadline: number;
  slippageTolerance?: number;
}

export interface TradeOrder {
  id: string;
  user: string;
  type: 'market' | 'limit' | 'stop';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut?: string;
  targetPrice?: string;
  status: 'pending' | 'executing' | 'completed' | 'cancelled' | 'failed';
  createdAt: number;
  deadline: number;
  gasPrice?: string;
  nonce?: number;
}

export interface CrossChainSwapParams extends SwapParams {
  srcChainId: number;
  dstChainId: number;
  bridgeType?: string;
}

export interface QuantStrategy {
  id: string;
  name: string;
  description: string;
  type: 'arbitrage' | 'dca' | 'grid' | 'momentum' | 'custom';
  parameters: Record<string, any>;
  isActive: boolean;
  performance: StrategyPerformance;
}

export interface StrategyPerformance {
  totalTrades: number;
  successRate: number;
  totalPnL: string;
  avgTradeSize: string;
  maxDrawdown: number;
  sharpeRatio: number;
  lastUpdated: number;
}

export interface AIRecommendation {
  path: string[];
  percentages: number[];
  expectedGasCost: string;
  expectedSlippage: number;
  confidenceScore: number;
  timeEstimate: number;
  risks: RiskAssessment;
}

export interface RiskAssessment {
  volatilityRisk: number;
  liquidityRisk: number;
  slippageRisk: number;
  gasRisk: number;
  overallRisk: number;
  warnings: string[];
}
