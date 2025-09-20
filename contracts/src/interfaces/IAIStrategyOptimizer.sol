// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAIStrategyOptimizer {
    struct MarketData {
        address token;
        uint256 price;
        uint256 volume24h;
        uint256 liquidity;
        int256 priceChange24h;
        uint256 volatility;
        uint256 timestamp;
    }

    struct AIRouteRecommendation {
        address[] path;
        uint256[] percentages;
        uint256 expectedGasCost;
        uint256 expectedSlippage;
        uint256 confidenceScore;
        uint256 timeEstimate;
        bytes strategyData;
    }

    struct TradingSignal {
        address tokenIn;
        address tokenOut;
        uint8 signal; // 0: hold, 1: buy, 2: sell
        uint8 strength; // 1-10
        uint256 targetPrice;
        uint256 confidence;
        uint256 timeHorizon;
        string reason;
    }

    struct RiskAssessment {
        uint256 volatilityRisk;
        uint256 liquidityRisk;
        uint256 slippageRisk;
        uint256 gasRisk;
        uint256 overallRisk;
        string[] warnings;
    }

    event AIRecommendationGenerated(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 confidenceScore
    );

    event TradingSignalUpdated(
        address indexed token,
        uint8 signal,
        uint8 strength,
        uint256 confidence
    );

    event ModelUpdated(string modelType, uint256 version, uint256 accuracy);

    function getOptimalRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 maxSlippage,
        uint256 maxGasPrice
    ) external view returns (AIRouteRecommendation memory);

    function getTradingSignal(
        address token,
        uint256 timeframe
    ) external view returns (TradingSignal memory);

    function assessRisk(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (RiskAssessment memory);

    function updateMarketData(MarketData[] calldata data) external;

    function trainModel(
        bytes calldata trainingData,
        string calldata modelType
    ) external returns (bool success);

    function getPriorityScore(
        address user,
        uint256 gasPrice,
        uint256 deadline
    ) external view returns (uint256 score);

    function predictOptimalTiming(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 optimalTimestamp, uint256 confidence);

    function getPersonalizedStrategy(
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (AIRouteRecommendation memory);
}