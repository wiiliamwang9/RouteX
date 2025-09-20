// Auto-generated React hooks for RouteX contracts
// Generated on: 2025-09-20T06:02:39.950Z

import { useContract, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { CONTRACT_ADDRESSES } from './types';
import { SwapParams, TradeOrder, QuantStrategy } from './types';
import TraderAgentABI from './TraderAgent.json';
import RouterDefenseABI from './RouterDefense.json';
import CrossChainRouterABI from './CrossChainRouter.json';
import AIStrategyOptimizerABI from './AIStrategyOptimizer.json';
import QuantGuardProABI from './QuantGuardPro.json';

// Contract instances hooks

export function useTraderAgentContract() {
  return useContract({
    address: CONTRACT_ADDRESSES.TRADERAGENT,
    abi: TraderAgentABI,
  });
}

export function useRouterDefenseContract() {
  return useContract({
    address: CONTRACT_ADDRESSES.ROUTERDEFENSE,
    abi: RouterDefenseABI,
  });
}

export function useCrossChainRouterContract() {
  return useContract({
    address: CONTRACT_ADDRESSES.CROSSCHAINROUTER,
    abi: CrossChainRouterABI,
  });
}

export function useAIStrategyOptimizerContract() {
  return useContract({
    address: CONTRACT_ADDRESSES.AISTRATEGYOPTIMIZER,
    abi: AIStrategyOptimizerABI,
  });
}

export function useQuantGuardProContract() {
  return useContract({
    address: CONTRACT_ADDRESSES.QUANTGUARDPRO,
    abi: QuantGuardProABI,
  });
}

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
    address: tokenAddress as `0x${string}`,
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
    address: tokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [owner, spender],
    enabled: !!(tokenAddress && owner && spender),
  });
}
