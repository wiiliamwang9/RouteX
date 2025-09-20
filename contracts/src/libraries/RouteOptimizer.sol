// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IRouterDefense.sol";

library RouteOptimizer {
    uint256 private constant MAX_ROUTES = 3;
    uint256 private constant PERCENTAGE_BASE = 10000;
    
    struct PoolInfo {
        address pool;
        address token0;
        address token1;
        uint256 liquidity;
        uint256 fee;
    }
    
    function optimizeRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        PoolInfo[] memory availablePools
    ) internal pure returns (IRouterDefense.Route[] memory routes, uint256 expectedAmountOut) {
        routes = new IRouterDefense.Route[](MAX_ROUTES);
        uint256 routeCount = 0;
        expectedAmountOut = 0;
        
        uint256 remainingAmount = amountIn;
        
        for (uint256 i = 0; i < availablePools.length && routeCount < MAX_ROUTES && remainingAmount > 0; i++) {
            PoolInfo memory pool = availablePools[i];
            
            if (!_isValidPool(pool, tokenIn, tokenOut)) continue;
            
            uint256 poolCapacity = _calculatePoolCapacity(pool, amountIn);
            uint256 routeAmount = remainingAmount > poolCapacity ? poolCapacity : remainingAmount;
            
            if (routeAmount == 0) continue;
            
            uint256 percentage = (routeAmount * PERCENTAGE_BASE) / amountIn;
            uint256 expectedOut = _calculateExpectedOutput(pool, tokenIn, tokenOut, routeAmount);
            
            routes[routeCount] = IRouterDefense.Route({
                pool: pool.pool,
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                percentage: percentage
            });
            
            expectedAmountOut += expectedOut;
            remainingAmount -= routeAmount;
            routeCount++;
        }
        
        assembly {
            mstore(routes, routeCount)
        }
    }
    
    function _isValidPool(
        PoolInfo memory pool,
        address tokenIn,
        address tokenOut
    ) private pure returns (bool) {
        return (pool.token0 == tokenIn && pool.token1 == tokenOut) ||
               (pool.token0 == tokenOut && pool.token1 == tokenIn);
    }
    
    function _calculatePoolCapacity(
        PoolInfo memory pool,
        uint256 amountIn
    ) private pure returns (uint256) {
        return (pool.liquidity * 3000) / 10000;
    }
    
    function _calculateExpectedOutput(
        PoolInfo memory pool,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private pure returns (uint256) {
        uint256 feeAmount = (amountIn * pool.fee) / 1000000;
        uint256 amountInAfterFee = amountIn - feeAmount;
        
        return (amountInAfterFee * 997) / 1000;
    }
    
    function calculateSlippage(
        uint256 expectedAmount,
        uint256 actualAmount
    ) internal pure returns (uint256) {
        if (expectedAmount == 0) return 0;
        if (actualAmount >= expectedAmount) return 0;
        
        return ((expectedAmount - actualAmount) * PERCENTAGE_BASE) / expectedAmount;
    }
}