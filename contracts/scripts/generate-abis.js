const fs = require('fs');
const path = require('path');

async function generateABIs() {
  console.log('🔄 Generating ABI files for frontend integration...\n');
  
  // Read deployment info
  const deploymentPath = './deployments.json';
  if (!fs.existsSync(deploymentPath)) {
    console.error('❌ deployments.json not found. Please run deployment first.');
    process.exit(1);
  }
  
  const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // Contract names to process
  const contracts = [
    'TraderAgent',
    'RouterDefense', 
    'CrossChainRouter',
    'AIStrategyOptimizer',
    'QuantGuardPro'
  ];
  
  // Create output directory
  const outputDir = '../frontend/src/contracts';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const contractsConfig = {
    network: deployments.network,
    chainId: deployments.chainId,
    contracts: {},
    external: deployments.external
  };
  
  // Process each contract
  for (const contractName of contracts) {
    try {
      const artifactPath = `./artifacts/src/core/${contractName}.sol/${contractName}.json`;
      
      // Handle AIStrategyOptimizer which is in ai folder
      const aiArtifactPath = `./artifacts/src/ai/${contractName}.sol/${contractName}.json`;
      
      let artifact;
      if (fs.existsSync(artifactPath)) {
        artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      } else if (fs.existsSync(aiArtifactPath)) {
        artifact = JSON.parse(fs.readFileSync(aiArtifactPath, 'utf8'));
      } else {
        console.warn(`⚠️  Artifact not found for ${contractName}, skipping...`);
        continue;
      }
      
      // Extract ABI
      const abi = artifact.abi;
      
      // Save individual ABI file
      const abiPath = path.join(outputDir, `${contractName}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
      
      // Add to contracts config
      contractsConfig.contracts[contractName] = {
        address: deployments.contracts[contractName],
        abi: abi
      };
      
      console.log(`✅ Generated ABI for ${contractName}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${contractName}:`, error.message);
    }
  }
  
  // Save combined contracts config
  const configPath = path.join(outputDir, 'contracts.json');
  fs.writeFileSync(configPath, JSON.stringify(contractsConfig, null, 2));
  console.log('✅ Generated combined contracts config');
  
  // Generate TypeScript types
  console.log('\n🔤 Generating TypeScript type definitions...');
  generateTypeDefinitions(contractsConfig, outputDir);
  
  // Generate React hooks
  console.log('🎣 Generating React hooks...');
  generateReactHooks(contractsConfig, outputDir);
  
  console.log('\n🎉 Frontend integration files generated successfully!');
  console.log(`📁 Files generated in: ${outputDir}`);
  console.log('\n📋 Next steps for frontend integration:');
  console.log('1. Install required dependencies: ethers, @rainbow-me/rainbowkit, wagmi');
  console.log('2. Import the generated contracts config');
  console.log('3. Setup Web3 provider with Monad testnet');
  console.log('4. Use the generated hooks in your React components');
}

function generateTypeDefinitions(config, outputDir) {
  const typeDefinitions = `// Auto-generated TypeScript definitions for RouteX contracts
// Generated on: ${new Date().toISOString()}

export interface ContractConfig {
  network: string;
  chainId: number;
  contracts: {
    ${Object.keys(config.contracts).map(name => `${name}: ContractInfo;`).join('\n    ')}
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
  ${Object.entries(config.contracts).map(([name, info]) => 
    `${name.toUpperCase()}: '${info.address}' as const,`
  ).join('\n  ')}
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  chainId: ${config.chainId},
  name: 'Monad Testnet',
  currency: 'ETH',
  rpcUrl: 'https://testnet-rpc.monad.xyz/',
  blockExplorer: 'https://testnet.monadexplorer.com/',
} as const;

// External contract addresses
export const EXTERNAL_CONTRACTS = {
  UNISWAP_ROUTER: '${config.external.uniswapRouter}',
  WETH: '${config.external.weth}',
  USDC: '${config.external.usdc}',
  DAI: '${config.external.dai}',
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
`;

  const typesPath = path.join(outputDir, 'types.ts');
  fs.writeFileSync(typesPath, typeDefinitions);
  console.log('✅ Generated TypeScript types');
}

function generateReactHooks(config, outputDir) {
  const reactHooks = `// Auto-generated React hooks for RouteX contracts
// Generated on: ${new Date().toISOString()}

import { useContract, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { CONTRACT_ADDRESSES } from './types';
import { SwapParams, TradeOrder, QuantStrategy } from './types';
${Object.keys(config.contracts).map(name => 
  `import ${name}ABI from './${name}.json';`
).join('\n')}

// Contract instances hooks
${Object.keys(config.contracts).map(name => `
export function use${name}Contract() {
  return useContract({
    address: CONTRACT_ADDRESSES.${name.toUpperCase()},
    abi: ${name}ABI,
  });
}`).join('\n')}

// TraderAgent hooks
export function useExecuteSwap() {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.TRADER_AGENT,
    abi: TraderAgentABI,
    functionName: 'executeOrder',
  });
  
  return useContractWrite(config);
}

export function usePlaceLimitOrder() {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.TRADER_AGENT,
    abi: TraderAgentABI,
    functionName: 'placeLimitOrder',
  });
  
  return useContractWrite(config);
}

export function useUserOrders(userAddress: string) {
  return useContractRead({
    address: CONTRACT_ADDRESSES.TRADER_AGENT,
    abi: TraderAgentABI,
    functionName: 'getUserOrders',
    args: [userAddress],
    enabled: !!userAddress,
  });
}

// RouterDefense hooks
export function useProtectedSwap() {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.ROUTER_DEFENSE,
    abi: RouterDefenseABI,
    functionName: 'protectedSwap',
  });
  
  return useContractWrite(config);
}

export function useGetOptimalRoute(
  tokenIn: string,
  tokenOut: string,
  amountIn: string
) {
  return useContractRead({
    address: CONTRACT_ADDRESSES.ROUTER_DEFENSE,
    abi: RouterDefenseABI,
    functionName: 'getOptimalRoute',
    args: [tokenIn, tokenOut, amountIn],
    enabled: !!(tokenIn && tokenOut && amountIn),
  });
}

// CrossChainRouter hooks
export function useInitiateCrossChainSwap() {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.CROSSCHAINROUTER,
    abi: CrossChainRouterABI,
    functionName: 'initiateCrossChainSwap',
  });
  
  return useContractWrite(config);
}

export function useGetSupportedChains() {
  return useContractRead({
    address: CONTRACT_ADDRESSES.CROSSCHAINROUTER,
    abi: CrossChainRouterABI,
    functionName: 'getSupportedChains',
  });
}

// AIStrategyOptimizer hooks
export function useGetAIRecommendation(
  tokenIn: string,
  tokenOut: string,
  amountIn: string
) {
  return useContractRead({
    address: CONTRACT_ADDRESSES.AISTRATEGYOPTIMIZER,
    abi: AIStrategyOptimizerABI,
    functionName: 'getOptimalRoute',
    args: [tokenIn, tokenOut, amountIn, 50, 100000000000], // maxSlippage: 0.5%, maxGasPrice: 100 gwei
    enabled: !!(tokenIn && tokenOut && amountIn),
  });
}

export function useAssessRisk(
  tokenIn: string,
  tokenOut: string,
  amountIn: string
) {
  return useContractRead({
    address: CONTRACT_ADDRESSES.AISTRATEGYOPTIMIZER,
    abi: AIStrategyOptimizerABI,
    functionName: 'assessRisk',
    args: [tokenIn, tokenOut, amountIn],
    enabled: !!(tokenIn && tokenOut && amountIn),
  });
}

// QuantGuardPro hooks
export function useCreateStrategy() {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARDPRO,
    abi: QuantGuardProABI,
    functionName: 'createStrategy',
  });
  
  return useContractWrite(config);
}

export function useGetUserStrategies(userAddress: string) {
  return useContractRead({
    address: CONTRACT_ADDRESSES.QUANTGUARDPRO,
    abi: QuantGuardProABI,
    functionName: 'getUserStrategies',
    args: [userAddress],
    enabled: !!userAddress,
  });
}

export function useGetStrategyDetails(strategyId: string) {
  return useContractRead({
    address: CONTRACT_ADDRESSES.QUANTGUARDPRO,
    abi: QuantGuardProABI,
    functionName: 'getStrategyDetails',
    args: [strategyId],
    enabled: !!strategyId,
  });
}

export function useActivateStrategy() {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESSES.QUANTGUARDPRO,
    abi: QuantGuardProABI,
    functionName: 'activateStrategy',
  });
  
  return useContractWrite(config);
}

// Utility hooks
export function useTokenBalance(tokenAddress: string, userAddress: string) {
  // Standard ERC20 ABI for balanceOf
  const erc20ABI = [
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
  ];
  
  return useContractRead({
    address: tokenAddress as \`0x\${string}\`,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    enabled: !!(tokenAddress && userAddress),
  });
}

export function useTokenAllowance(
  tokenAddress: string,
  owner: string,
  spender: string
) {
  const erc20ABI = [
    {
      constant: true,
      inputs: [
        { name: "_owner", type: "address" },
        { name: "_spender", type: "address" }
      ],
      name: "allowance",
      outputs: [{ name: "remaining", type: "uint256" }],
      type: "function",
    },
  ];
  
  return useContractRead({
    address: tokenAddress as \`0x\${string}\`,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [owner, spender],
    enabled: !!(tokenAddress && owner && spender),
  });
}
`;

  const hooksPath = path.join(outputDir, 'hooks.ts');
  fs.writeFileSync(hooksPath, reactHooks);
  console.log('✅ Generated React hooks');
}

// Run the script
generateABIs().catch(console.error);