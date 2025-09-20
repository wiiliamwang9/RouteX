// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IAIStrategyOptimizer.sol";
import "../libraries/PriceOracle.sol";

contract AIStrategyOptimizer is IAIStrategyOptimizer, Ownable {
    mapping(address => MarketData) public marketData;
    mapping(address => TradingSignal) public tradingSignals;
    mapping(address => uint256) public userReputationScores;
    mapping(string => uint256) public modelVersions;
    mapping(address => mapping(address => uint256)) public pairVolatilityIndex;
    
    address[] public trackedTokens;
    uint256 public constant MAX_CONFIDENCE = 100;
    uint256 public constant VOLATILITY_THRESHOLD = 500; // 5%
    uint256 public constant MIN_LIQUIDITY = 100000 * 1e18;
    
    struct AIModel {
        string modelType;
        uint256 version;
        uint256 accuracy;
        uint256 lastUpdated;
        bool isActive;
    }
    
    mapping(string => AIModel) public aiModels;
    string[] public activeModels;
    
    constructor() {
        _initializeModels();
    }
    
    function getOptimalRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 maxSlippage,
        uint256 maxGasPrice
    ) 
        external 
        view 
        override 
        returns (AIRouteRecommendation memory) 
    {
        MarketData memory tokenInData = marketData[tokenIn];
        MarketData memory tokenOutData = marketData[tokenOut];
        
        require(tokenInData.timestamp > 0 && tokenOutData.timestamp > 0, "AI: insufficient market data");
        
        uint256 volatilityScore = _calculateVolatilityScore(tokenIn, tokenOut);
        uint256 liquidityScore = _calculateLiquidityScore(tokenInData, tokenOutData);
        uint256 gasEfficiencyScore = _calculateGasEfficiency(maxGasPrice);
        
        address[] memory optimalPath = _generateOptimalPath(tokenIn, tokenOut, amountIn);
        uint256[] memory percentages = _calculateOptimalPercentages(optimalPath, amountIn);
        
        uint256 expectedSlippage = _predictSlippage(tokenIn, tokenOut, amountIn);
        uint256 expectedGas = _estimateGasCost(optimalPath, amountIn);
        
        uint256 confidenceScore = _calculateConfidence(
            volatilityScore,
            liquidityScore,
            gasEfficiencyScore,
            expectedSlippage,
            maxSlippage
        );
        
        bytes memory strategyData = _encodeStrategyData(
            volatilityScore,
            liquidityScore,
            expectedSlippage
        );
        
        return AIRouteRecommendation({
            path: optimalPath,
            percentages: percentages,
            expectedGasCost: expectedGas,
            expectedSlippage: expectedSlippage,
            confidenceScore: confidenceScore,
            timeEstimate: _estimateExecutionTime(optimalPath),
            strategyData: strategyData
        });
    }
    
    function getTradingSignal(
        address token,
        uint256 timeframe
    ) 
        external 
        view 
        override 
        returns (TradingSignal memory) 
    {
        MarketData memory data = marketData[token];
        require(data.timestamp > 0, "AI: no market data for token");
        
        uint8 signal = _generateTradingSignal(data, timeframe);
        uint8 strength = _calculateSignalStrength(data);
        uint256 targetPrice = _predictTargetPrice(data, timeframe);
        uint256 confidence = _calculateSignalConfidence(data, timeframe);
        string memory reason = _generateSignalReason(signal, data);
        
        return TradingSignal({
            tokenIn: address(0),
            tokenOut: token,
            signal: signal,
            strength: strength,
            targetPrice: targetPrice,
            confidence: confidence,
            timeHorizon: timeframe,
            reason: reason
        });
    }
    
    function assessRisk(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) 
        external 
        view 
        override 
        returns (RiskAssessment memory) 
    {
        MarketData memory tokenInData = marketData[tokenIn];
        MarketData memory tokenOutData = marketData[tokenOut];
        
        uint256 volatilityRisk = _assessVolatilityRisk(tokenInData, tokenOutData);
        uint256 liquidityRisk = _assessLiquidityRisk(tokenInData, tokenOutData, amountIn);
        uint256 slippageRisk = _assessSlippageRisk(tokenIn, tokenOut, amountIn);
        uint256 gasRisk = _assessGasRisk();
        
        uint256 overallRisk = (volatilityRisk + liquidityRisk + slippageRisk + gasRisk) / 4;
        
        string[] memory warnings = _generateWarnings(
            volatilityRisk,
            liquidityRisk,
            slippageRisk,
            gasRisk
        );
        
        return RiskAssessment({
            volatilityRisk: volatilityRisk,
            liquidityRisk: liquidityRisk,
            slippageRisk: slippageRisk,
            gasRisk: gasRisk,
            overallRisk: overallRisk,
            warnings: warnings
        });
    }
    
    function updateMarketData(MarketData[] calldata data) external override {
        require(msg.sender == owner() || _isAuthorizedDataProvider(msg.sender), "AI: unauthorized");
        
        for (uint256 i = 0; i < data.length; i++) {
            MarketData memory newData = data[i];
            require(newData.timestamp <= block.timestamp, "AI: future timestamp");
            
            MarketData storage existing = marketData[newData.token];
            if (existing.timestamp == 0) {
                trackedTokens.push(newData.token);
            }
            
            marketData[newData.token] = newData;
            
            _updateVolatilityIndex(newData.token, newData.volatility);
            _updateTradingSignal(newData.token, newData);
        }
    }
    
    function trainModel(
        bytes calldata trainingData,
        string calldata modelType
    ) 
        external 
        override 
        onlyOwner 
        returns (bool success) 
    {
        require(bytes(modelType).length > 0, "AI: invalid model type");
        
        AIModel storage model = aiModels[modelType];
        model.version++;
        model.lastUpdated = block.timestamp;
        
        uint256 newAccuracy = _processTrainingData(trainingData, modelType);
        require(newAccuracy > model.accuracy, "AI: model accuracy did not improve");
        
        model.accuracy = newAccuracy;
        model.isActive = true;
        
        if (!_isModelInActiveList(modelType)) {
            activeModels.push(modelType);
        }
        
        emit ModelUpdated(modelType, model.version, newAccuracy);
        return true;
    }
    
    function getPriorityScore(
        address user,
        uint256 gasPrice,
        uint256 deadline
    ) 
        external 
        view 
        override 
        returns (uint256 score) 
    {
        uint256 reputationScore = userReputationScores[user];
        uint256 urgencyScore = _calculateUrgencyScore(deadline);
        uint256 gasPriceScore = _calculateGasPriceScore(gasPrice);
        
        score = (reputationScore * 40 + urgencyScore * 30 + gasPriceScore * 30) / 100;
        
        if (score > 100) score = 100;
    }
    
    function predictOptimalTiming(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) 
        external 
        view 
        override 
        returns (uint256 optimalTimestamp, uint256 confidence) 
    {
        MarketData memory tokenInData = marketData[tokenIn];
        MarketData memory tokenOutData = marketData[tokenOut];
        
        uint256 currentVolatility = pairVolatilityIndex[tokenIn][tokenOut];
        uint256 liquidityScore = _calculateLiquidityScore(tokenInData, tokenOutData);
        
        if (currentVolatility < VOLATILITY_THRESHOLD && liquidityScore > 70) {
            optimalTimestamp = block.timestamp;
            confidence = 85;
        } else {
            optimalTimestamp = block.timestamp + _predictCooldownPeriod(currentVolatility);
            confidence = 65;
        }
    }
    
    function getPersonalizedStrategy(
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) 
        external 
        view 
        override 
        returns (AIRouteRecommendation memory) 
    {
        uint256 userReputation = userReputationScores[user];
        
        AIRouteRecommendation memory baseStrategy = this.getOptimalRoute(
            tokenIn,
            tokenOut,
            amountIn,
            500, // 5% max slippage
            100 * 1e9 // 100 gwei max gas
        );
        
        if (userReputation >= 80) {
            baseStrategy.percentages = _adjustForHighReputation(baseStrategy.percentages);
            baseStrategy.confidenceScore = (baseStrategy.confidenceScore * 110) / 100;
        } else if (userReputation <= 30) {
            baseStrategy.percentages = _adjustForLowReputation(baseStrategy.percentages);
            baseStrategy.expectedSlippage = (baseStrategy.expectedSlippage * 120) / 100;
        }
        
        return baseStrategy;
    }
    
    function _generateOptimalPath(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private view returns (address[] memory) {
        if (_hasDirectPair(tokenIn, tokenOut)) {
            address[] memory directPath = new address[](2);
            directPath[0] = tokenIn;
            directPath[1] = tokenOut;
            return directPath;
        }
        
        address bestIntermediate = _findBestIntermediate(tokenIn, tokenOut, amountIn);
        address[] memory indirectPath = new address[](3);
        indirectPath[0] = tokenIn;
        indirectPath[1] = bestIntermediate;
        indirectPath[2] = tokenOut;
        return indirectPath;
    }
    
    function _calculateOptimalPercentages(
        address[] memory path,
        uint256 amountIn
    ) private view returns (uint256[] memory) {
        uint256[] memory percentages = new uint256[](path.length - 1);
        
        if (path.length == 2) {
            percentages[0] = 10000; // 100%
        } else {
            // 分配权重给不同路径
            percentages[0] = 6000; // 60%
            percentages[1] = 4000; // 40%
        }
        
        return percentages;
    }
    
    function _calculateVolatilityScore(
        address tokenIn,
        address tokenOut
    ) private view returns (uint256) {
        uint256 volatility = pairVolatilityIndex[tokenIn][tokenOut];
        if (volatility == 0) return 50;
        
        if (volatility < 100) return 90;
        if (volatility < 300) return 70;
        if (volatility < 500) return 50;
        return 20;
    }
    
    function _calculateLiquidityScore(
        MarketData memory tokenInData,
        MarketData memory tokenOutData
    ) private pure returns (uint256) {
        uint256 avgLiquidity = (tokenInData.liquidity + tokenOutData.liquidity) / 2;
        
        if (avgLiquidity >= MIN_LIQUIDITY * 10) return 95;
        if (avgLiquidity >= MIN_LIQUIDITY * 5) return 80;
        if (avgLiquidity >= MIN_LIQUIDITY) return 60;
        return 30;
    }
    
    function _calculateGasEfficiency(uint256 maxGasPrice) private pure returns (uint256) {
        if (maxGasPrice <= 50 * 1e9) return 90;
        if (maxGasPrice <= 100 * 1e9) return 70;
        if (maxGasPrice <= 200 * 1e9) return 50;
        return 20;
    }
    
    function _predictSlippage(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private view returns (uint256) {
        MarketData memory tokenInData = marketData[tokenIn];
        uint256 liquidityRatio = (amountIn * 10000) / tokenInData.liquidity;
        
        if (liquidityRatio < 10) return 5;   // 0.05%
        if (liquidityRatio < 50) return 20;  // 0.2%
        if (liquidityRatio < 100) return 50; // 0.5%
        return 150; // 1.5%
    }
    
    function _estimateGasCost(
        address[] memory path,
        uint256 amountIn
    ) private pure returns (uint256) {
        uint256 baseGas = 100000;
        uint256 pathMultiplier = path.length - 1;
        return baseGas * pathMultiplier;
    }
    
    function _calculateConfidence(
        uint256 volatilityScore,
        uint256 liquidityScore,
        uint256 gasEfficiencyScore,
        uint256 expectedSlippage,
        uint256 maxSlippage
    ) private pure returns (uint256) {
        uint256 slippageScore = expectedSlippage <= maxSlippage ? 90 : 30;
        
        return (volatilityScore * 25 + liquidityScore * 35 + 
                gasEfficiencyScore * 20 + slippageScore * 20) / 100;
    }
    
    function _encodeStrategyData(
        uint256 volatilityScore,
        uint256 liquidityScore,
        uint256 expectedSlippage
    ) private pure returns (bytes memory) {
        return abi.encode(volatilityScore, liquidityScore, expectedSlippage);
    }
    
    function _estimateExecutionTime(address[] memory path) private pure returns (uint256) {
        return path.length * 15; // 15 seconds per hop
    }
    
    function _generateTradingSignal(
        MarketData memory data,
        uint256 timeframe
    ) private pure returns (uint8) {
        if (data.priceChange24h > 500) return 2; // sell
        if (data.priceChange24h < -300) return 1; // buy
        return 0; // hold
    }
    
    function _calculateSignalStrength(MarketData memory data) private pure returns (uint8) {
        uint256 absChange = data.priceChange24h >= 0 ? 
            uint256(data.priceChange24h) : uint256(-data.priceChange24h);
        
        if (absChange > 1000) return 10;
        if (absChange > 500) return 7;
        if (absChange > 200) return 5;
        return 3;
    }
    
    function _predictTargetPrice(
        MarketData memory data,
        uint256 timeframe
    ) private pure returns (uint256) {
        int256 trend = data.priceChange24h;
        uint256 projectedChange = (uint256(trend >= 0 ? trend : -trend) * timeframe) / 86400;
        
        if (trend >= 0) {
            return data.price + projectedChange;
        } else {
            return data.price > projectedChange ? data.price - projectedChange : 0;
        }
    }
    
    function _calculateSignalConfidence(
        MarketData memory data,
        uint256 timeframe
    ) private pure returns (uint256) {
        if (data.volume24h > 1000000 * 1e18) return 85;
        if (data.volume24h > 100000 * 1e18) return 70;
        return 50;
    }
    
    function _generateSignalReason(
        uint8 signal,
        MarketData memory data
    ) private pure returns (string memory) {
        if (signal == 1) return "Strong bullish momentum detected";
        if (signal == 2) return "Overbought conditions, consider taking profits";
        return "Sideways movement, wait for clearer signals";
    }
    
    function _assessVolatilityRisk(
        MarketData memory tokenInData,
        MarketData memory tokenOutData
    ) private pure returns (uint256) {
        uint256 avgVolatility = (tokenInData.volatility + tokenOutData.volatility) / 2;
        if (avgVolatility > 1000) return 90;
        if (avgVolatility > 500) return 60;
        return 30;
    }
    
    function _assessLiquidityRisk(
        MarketData memory tokenInData,
        MarketData memory tokenOutData,
        uint256 amountIn
    ) private pure returns (uint256) {
        uint256 minLiquidity = tokenInData.liquidity < tokenOutData.liquidity ? 
            tokenInData.liquidity : tokenOutData.liquidity;
        
        uint256 ratio = (amountIn * 100) / minLiquidity;
        if (ratio > 10) return 90;
        if (ratio > 5) return 60;
        return 20;
    }
    
    function _assessSlippageRisk(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private view returns (uint256) {
        uint256 predictedSlippage = _predictSlippage(tokenIn, tokenOut, amountIn);
        if (predictedSlippage > 200) return 90;
        if (predictedSlippage > 100) return 60;
        return 30;
    }
    
    function _assessGasRisk() private view returns (uint256) {
        // 基于当前网络拥堵情况评估 Gas 风险
        return 40; // 中等风险
    }
    
    function _generateWarnings(
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 slippageRisk,
        uint256 gasRisk
    ) private pure returns (string[] memory) {
        string[] memory warnings = new string[](4);
        uint256 warningCount = 0;
        
        if (volatilityRisk > 70) {
            warnings[warningCount] = "High volatility detected";
            warningCount++;
        }
        if (liquidityRisk > 70) {
            warnings[warningCount] = "Low liquidity may cause high slippage";
            warningCount++;
        }
        if (slippageRisk > 70) {
            warnings[warningCount] = "Expected slippage exceeds recommended threshold";
            warningCount++;
        }
        if (gasRisk > 70) {
            warnings[warningCount] = "High gas prices detected";
            warningCount++;
        }
        
        // 调整数组大小
        assembly {
            mstore(warnings, warningCount)
        }
        
        return warnings;
    }
    
    function _initializeModels() private {
        aiModels["route_optimizer"] = AIModel({
            modelType: "route_optimizer",
            version: 1,
            accuracy: 75,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        aiModels["price_predictor"] = AIModel({
            modelType: "price_predictor",
            version: 1,
            accuracy: 68,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        activeModels.push("route_optimizer");
        activeModels.push("price_predictor");
    }
    
    function _isAuthorizedDataProvider(address provider) private view returns (bool) {
        // 实现数据提供者授权逻辑
        return provider == owner();
    }
    
    function _updateVolatilityIndex(address token, uint256 volatility) private {
        // 更新代币波动性指数
        for (uint256 i = 0; i < trackedTokens.length; i++) {
            if (trackedTokens[i] != token) {
                pairVolatilityIndex[token][trackedTokens[i]] = volatility;
                pairVolatilityIndex[trackedTokens[i]][token] = volatility;
            }
        }
    }
    
    function _updateTradingSignal(address token, MarketData memory data) private {
        TradingSignal storage signal = tradingSignals[token];
        signal.tokenOut = token;
        signal.signal = _generateTradingSignal(data, 3600);
        signal.strength = _calculateSignalStrength(data);
        signal.confidence = _calculateSignalConfidence(data, 3600);
        
        emit TradingSignalUpdated(token, signal.signal, signal.strength, signal.confidence);
    }
    
    function _processTrainingData(
        bytes calldata trainingData,
        string calldata modelType
    ) private pure returns (uint256) {
        // 模拟 AI 模型训练过程
        // 在实际实现中，这里会调用链下的 AI 训练服务
        return 80; // 返回新的准确率
    }
    
    function _isModelInActiveList(string calldata modelType) private view returns (bool) {
        for (uint256 i = 0; i < activeModels.length; i++) {
            if (keccak256(bytes(activeModels[i])) == keccak256(bytes(modelType))) {
                return true;
            }
        }
        return false;
    }
    
    function _calculateUrgencyScore(uint256 deadline) private view returns (uint256) {
        uint256 timeLeft = deadline > block.timestamp ? deadline - block.timestamp : 0;
        if (timeLeft < 60) return 100;   // 1 minute
        if (timeLeft < 300) return 80;   // 5 minutes
        if (timeLeft < 900) return 60;   // 15 minutes
        return 40;
    }
    
    function _calculateGasPriceScore(uint256 gasPrice) private pure returns (uint256) {
        if (gasPrice >= 200 * 1e9) return 100; // 200+ gwei
        if (gasPrice >= 100 * 1e9) return 80;  // 100+ gwei
        if (gasPrice >= 50 * 1e9) return 60;   // 50+ gwei
        return 40;
    }
    
    function _predictCooldownPeriod(uint256 volatility) private pure returns (uint256) {
        if (volatility > 1000) return 3600;  // 1 hour
        if (volatility > 500) return 1800;   // 30 minutes
        return 900; // 15 minutes
    }
    
    function _hasDirectPair(address tokenIn, address tokenOut) private view returns (bool) {
        // 检查是否存在直接交易对
        return pairVolatilityIndex[tokenIn][tokenOut] > 0;
    }
    
    function _findBestIntermediate(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private view returns (address) {
        // 寻找最佳中间代币
        // 简化实现，返回 WETH 作为默认中间代币
        return 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    }
    
    function _adjustForHighReputation(
        uint256[] memory percentages
    ) private pure returns (uint256[] memory) {
        // 为高信誉用户优化路由分配
        return percentages;
    }
    
    function _adjustForLowReputation(
        uint256[] memory percentages
    ) private pure returns (uint256[] memory) {
        // 为低信誉用户使用更保守的路由分配
        return percentages;
    }
    
    // 管理员功能
    function updateUserReputation(address user, uint256 score) external onlyOwner {
        require(score <= 100, "AI: score too high");
        userReputationScores[user] = score;
    }
    
    function addTrackedToken(address token) external onlyOwner {
        trackedTokens.push(token);
    }
}