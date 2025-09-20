// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ITraderAgent.sol";
import "../interfaces/IRouterDefense.sol";
import "../interfaces/ICrossChainRouter.sol";
import "../interfaces/IAIStrategyOptimizer.sol";
import "../utils/ReentrancyGuard.sol";

contract QuantGuardPro is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct QuantStrategy {
        uint256 id;
        string name;
        address owner;
        StrategyType strategyType;
        StrategyStatus status;
        StrategyConfig config;
        PerformanceMetrics performance;
        uint256 createdAt;
        uint256 lastExecuted;
    }
    
    struct StrategyConfig {
        uint256 maxPositionSize;
        uint256 maxSlippage;
        uint256 maxGasPrice;
        uint256 rebalanceInterval;
        uint256 stopLossThreshold;
        uint256 takeProfitThreshold;
        address[] allowedTokens;
        uint256[] allocations;
        bool enableCrossChain;
        bool enableMEVProtection;
    }
    
    struct PerformanceMetrics {
        uint256 totalTrades;
        uint256 successfulTrades;
        int256 totalPnL;
        uint256 totalVolume;
        uint256 maxDrawdown;
        uint256 sharpeRatio;
        uint256 avgTradeSize;
        uint256 lastUpdateTime;
    }
    
    struct RiskParameters {
        uint256 maxDailyLoss;
        uint256 maxPositionConcentration;
        uint256 volatilityThreshold;
        uint256 liquidityThreshold;
        bool enableEmergencyStop;
    }
    
    enum StrategyType {
        ARBITRAGE,
        GRID_TRADING,
        DCA,
        MOMENTUM,
        MEAN_REVERSION,
        YIELD_FARMING,
        CUSTOM
    }
    
    enum StrategyStatus {
        INACTIVE,
        ACTIVE,
        PAUSED,
        EMERGENCY_STOPPED,
        LIQUIDATING
    }
    
    // Core components
    ITraderAgent public traderAgent;
    IRouterDefense public routerDefense;
    ICrossChainRouter public crossChainRouter;
    IAIStrategyOptimizer public aiOptimizer;
    
    // State variables
    mapping(uint256 => QuantStrategy) public strategies;
    mapping(address => uint256[]) public userStrategies;
    mapping(uint256 => RiskParameters) public strategyRisks;
    mapping(address => bool) public authorizedExecutors;
    
    uint256 public nextStrategyId = 1;
    uint256 public constant MAX_STRATEGIES_PER_USER = 10;
    uint256 public constant PERFORMANCE_FEE = 200; // 2%
    uint256 public constant MANAGEMENT_FEE = 50;   // 0.5%
    
    // Events
    event StrategyCreated(uint256 indexed strategyId, address indexed owner, StrategyType strategyType);
    event StrategyExecuted(uint256 indexed strategyId, uint256 gasUsed, int256 pnl);
    event StrategyPaused(uint256 indexed strategyId, string reason);
    event StrategyResumed(uint256 indexed strategyId);
    event RiskLimitTriggered(uint256 indexed strategyId, string riskType);
    event PerformanceUpdated(uint256 indexed strategyId, PerformanceMetrics metrics);
    event EmergencyStop(uint256 indexed strategyId, string reason);
    
    modifier onlyStrategyOwner(uint256 strategyId) {
        require(strategies[strategyId].owner == msg.sender, "QuantGuard: not strategy owner");
        _;
    }
    
    modifier onlyAuthorizedExecutor() {
        require(authorizedExecutors[msg.sender] || msg.sender == owner(), "QuantGuard: not authorized");
        _;
    }
    
    modifier strategyExists(uint256 strategyId) {
        require(strategies[strategyId].id != 0, "QuantGuard: strategy does not exist");
        _;
    }
    
    constructor(
        address _traderAgent,
        address _routerDefense,
        address _crossChainRouter,
        address _aiOptimizer
    ) {
        traderAgent = ITraderAgent(_traderAgent);
        routerDefense = IRouterDefense(_routerDefense);
        crossChainRouter = ICrossChainRouter(_crossChainRouter);
        aiOptimizer = IAIStrategyOptimizer(_aiOptimizer);
    }
    
    function createStrategy(
        string memory name,
        StrategyType strategyType,
        StrategyConfig memory config,
        RiskParameters memory riskParams
    ) external nonReentrant returns (uint256 strategyId) {
        require(userStrategies[msg.sender].length < MAX_STRATEGIES_PER_USER, "QuantGuard: max strategies reached");
        require(bytes(name).length > 0, "QuantGuard: invalid name");
        require(_validateStrategyConfig(config), "QuantGuard: invalid config");
        
        strategyId = nextStrategyId++;
        
        strategies[strategyId] = QuantStrategy({
            id: strategyId,
            name: name,
            owner: msg.sender,
            strategyType: strategyType,
            status: StrategyStatus.INACTIVE,
            config: config,
            performance: PerformanceMetrics({
                totalTrades: 0,
                successfulTrades: 0,
                totalPnL: 0,
                totalVolume: 0,
                maxDrawdown: 0,
                sharpeRatio: 0,
                avgTradeSize: 0,
                lastUpdateTime: block.timestamp
            }),
            createdAt: block.timestamp,
            lastExecuted: 0
        });
        
        strategyRisks[strategyId] = riskParams;
        userStrategies[msg.sender].push(strategyId);
        
        emit StrategyCreated(strategyId, msg.sender, strategyType);
    }
    
    function activateStrategy(uint256 strategyId) 
        external 
        onlyStrategyOwner(strategyId) 
        strategyExists(strategyId) 
        nonReentrant 
    {
        QuantStrategy storage strategy = strategies[strategyId];
        require(strategy.status == StrategyStatus.INACTIVE, "QuantGuard: strategy not inactive");
        
        // Perform pre-activation checks
        require(_performRiskChecks(strategyId), "QuantGuard: risk checks failed");
        
        strategy.status = StrategyStatus.ACTIVE;
        
        // Initialize AI recommendations
        _initializeAIRecommendations(strategyId);
    }
    
    function executeStrategy(uint256 strategyId) 
        external 
        onlyAuthorizedExecutor 
        strategyExists(strategyId) 
        nonReentrant 
        whenNotPaused 
    {
        QuantStrategy storage strategy = strategies[strategyId];
        require(strategy.status == StrategyStatus.ACTIVE, "QuantGuard: strategy not active");
        
        uint256 gasStart = gasleft();
        
        // Pre-execution risk checks
        require(_performRiskChecks(strategyId), "QuantGuard: risk checks failed");
        
        // Get AI recommendations
        IAIStrategyOptimizer.AIRouteRecommendation memory aiRec = _getAIRecommendation(strategyId);
        
        // Execute strategy based on type
        int256 pnl = _executeStrategyLogic(strategyId, aiRec);
        
        // Update performance metrics
        _updatePerformanceMetrics(strategyId, pnl, gasStart - gasleft());
        
        strategy.lastExecuted = block.timestamp;
        
        emit StrategyExecuted(strategyId, gasStart - gasleft(), pnl);
    }
    
    function pauseStrategy(uint256 strategyId, string memory reason) 
        external 
        onlyStrategyOwner(strategyId) 
        strategyExists(strategyId) 
    {
        QuantStrategy storage strategy = strategies[strategyId];
        require(strategy.status == StrategyStatus.ACTIVE, "QuantGuard: strategy not active");
        
        strategy.status = StrategyStatus.PAUSED;
        
        emit StrategyPaused(strategyId, reason);
    }
    
    function resumeStrategy(uint256 strategyId) 
        external 
        onlyStrategyOwner(strategyId) 
        strategyExists(strategyId) 
    {
        QuantStrategy storage strategy = strategies[strategyId];
        require(strategy.status == StrategyStatus.PAUSED, "QuantGuard: strategy not paused");
        
        // Perform risk checks before resuming
        require(_performRiskChecks(strategyId), "QuantGuard: risk checks failed");
        
        strategy.status = StrategyStatus.ACTIVE;
        
        emit StrategyResumed(strategyId);
    }
    
    function emergencyStopStrategy(uint256 strategyId, string memory reason) 
        external 
        strategyExists(strategyId) 
    {
        require(
            strategies[strategyId].owner == msg.sender || 
            authorizedExecutors[msg.sender] || 
            msg.sender == owner(),
            "QuantGuard: not authorized for emergency stop"
        );
        
        QuantStrategy storage strategy = strategies[strategyId];
        strategy.status = StrategyStatus.EMERGENCY_STOPPED;
        
        // Liquidate positions if necessary
        _emergencyLiquidate(strategyId);
        
        emit EmergencyStop(strategyId, reason);
    }
    
    function updateStrategyConfig(
        uint256 strategyId, 
        StrategyConfig memory newConfig
    ) 
        external 
        onlyStrategyOwner(strategyId) 
        strategyExists(strategyId) 
    {
        require(_validateStrategyConfig(newConfig), "QuantGuard: invalid config");
        
        QuantStrategy storage strategy = strategies[strategyId];
        require(strategy.status != StrategyStatus.ACTIVE, "QuantGuard: cannot update active strategy");
        
        strategy.config = newConfig;
    }
    
    function updateRiskParameters(
        uint256 strategyId, 
        RiskParameters memory newRiskParams
    ) 
        external 
        onlyStrategyOwner(strategyId) 
        strategyExists(strategyId) 
    {
        strategyRisks[strategyId] = newRiskParams;
    }
    
    function getStrategyPerformance(uint256 strategyId) 
        external 
        view 
        strategyExists(strategyId) 
        returns (PerformanceMetrics memory) 
    {
        return strategies[strategyId].performance;
    }
    
    function getUserStrategies(address user) external view returns (uint256[] memory) {
        return userStrategies[user];
    }
    
    function getStrategyDetails(uint256 strategyId) 
        external 
        view 
        strategyExists(strategyId) 
        returns (QuantStrategy memory) 
    {
        return strategies[strategyId];
    }
    
    function simulateStrategy(
        StrategyType strategyType,
        StrategyConfig memory config,
        uint256 simulationPeriod
    ) external view returns (PerformanceMetrics memory simulatedPerformance) {
        // AI-powered strategy simulation
        // This would use historical data and AI models to simulate performance
        return _simulateStrategyPerformance(strategyType, config, simulationPeriod);
    }
    
    // Internal functions
    
    function _validateStrategyConfig(StrategyConfig memory config) private pure returns (bool) {
        if (config.maxPositionSize == 0) return false;
        if (config.maxSlippage > 1000) return false; // Max 10%
        if (config.allowedTokens.length == 0) return false;
        if (config.allowedTokens.length != config.allocations.length) return false;
        
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < config.allocations.length; i++) {
            totalAllocation += config.allocations[i];
        }
        
        return totalAllocation == 10000; // 100%
    }
    
    function _performRiskChecks(uint256 strategyId) private view returns (bool) {
        RiskParameters memory riskParams = strategyRisks[strategyId];
        QuantStrategy memory strategy = strategies[strategyId];
        
        // Check daily loss limit
        if (riskParams.maxDailyLoss > 0) {
            int256 dailyPnL = _calculateDailyPnL(strategyId);
            if (dailyPnL < -int256(riskParams.maxDailyLoss)) {
                return false;
            }
        }
        
        // Check position concentration
        if (riskParams.maxPositionConcentration > 0) {
            uint256 concentration = _calculatePositionConcentration(strategyId);
            if (concentration > riskParams.maxPositionConcentration) {
                return false;
            }
        }
        
        // Check market volatility
        if (riskParams.volatilityThreshold > 0) {
            uint256 marketVolatility = _getMarketVolatility(strategy.config.allowedTokens);
            if (marketVolatility > riskParams.volatilityThreshold) {
                return false;
            }
        }
        
        return true;
    }
    
    function _initializeAIRecommendations(uint256 strategyId) private {
        // Initialize AI model recommendations for the strategy
        QuantStrategy memory strategy = strategies[strategyId];
        
        for (uint256 i = 0; i < strategy.config.allowedTokens.length; i++) {
            address token = strategy.config.allowedTokens[i];
            // Update AI models with strategy preferences
            // This would interact with the AI service
        }
    }
    
    function _getAIRecommendation(uint256 strategyId) 
        private 
        view 
        returns (IAIStrategyOptimizer.AIRouteRecommendation memory) 
    {
        QuantStrategy memory strategy = strategies[strategyId];
        
        // Get personalized AI recommendation
        return aiOptimizer.getPersonalizedStrategy(
            strategy.owner,
            strategy.config.allowedTokens[0], // Primary token
            strategy.config.allowedTokens[1], // Secondary token
            strategy.config.maxPositionSize
        );
    }
    
    function _executeStrategyLogic(
        uint256 strategyId, 
        IAIStrategyOptimizer.AIRouteRecommendation memory aiRec
    ) private returns (int256 pnl) {
        QuantStrategy memory strategy = strategies[strategyId];
        
        if (strategy.strategyType == StrategyType.ARBITRAGE) {
            return _executeArbitrageStrategy(strategyId, aiRec);
        } else if (strategy.strategyType == StrategyType.GRID_TRADING) {
            return _executeGridStrategy(strategyId, aiRec);
        } else if (strategy.strategyType == StrategyType.DCA) {
            return _executeDCAStrategy(strategyId, aiRec);
        } else if (strategy.strategyType == StrategyType.MOMENTUM) {
            return _executeMomentumStrategy(strategyId, aiRec);
        } else if (strategy.strategyType == StrategyType.MEAN_REVERSION) {
            return _executeMeanReversionStrategy(strategyId, aiRec);
        } else if (strategy.strategyType == StrategyType.YIELD_FARMING) {
            return _executeYieldFarmingStrategy(strategyId, aiRec);
        }
        
        return 0;
    }
    
    function _executeArbitrageStrategy(
        uint256 strategyId, 
        IAIStrategyOptimizer.AIRouteRecommendation memory aiRec
    ) private returns (int256 pnl) {
        // Implement arbitrage strategy logic
        // This would identify price differences across DEXs and execute profitable trades
        return 0;
    }
    
    function _executeGridStrategy(
        uint256 strategyId, 
        IAIStrategyOptimizer.AIRouteRecommendation memory aiRec
    ) private returns (int256 pnl) {
        // Implement grid trading strategy
        // Places buy and sell orders at regular intervals
        return 0;
    }
    
    function _executeDCAStrategy(
        uint256 strategyId, 
        IAIStrategyOptimizer.AIRouteRecommendation memory aiRec
    ) private returns (int256 pnl) {
        // Implement Dollar Cost Averaging strategy
        // Regular purchases regardless of price
        return 0;
    }
    
    function _executeMomentumStrategy(
        uint256 strategyId, 
        IAIStrategyOptimizer.AIRouteRecommendation memory aiRec
    ) private returns (int256 pnl) {
        // Implement momentum trading strategy
        // Follow price trends and momentum indicators
        return 0;
    }
    
    function _executeMeanReversionStrategy(
        uint256 strategyId, 
        IAIStrategyOptimizer.AIRouteRecommendation memory aiRec
    ) private returns (int256 pnl) {
        // Implement mean reversion strategy
        // Trade against extreme price movements
        return 0;
    }
    
    function _executeYieldFarmingStrategy(
        uint256 strategyId, 
        IAIStrategyOptimizer.AIRouteRecommendation memory aiRec
    ) private returns (int256 pnl) {
        // Implement yield farming strategy
        // Optimize yield across different protocols
        return 0;
    }
    
    function _updatePerformanceMetrics(
        uint256 strategyId, 
        int256 pnl, 
        uint256 gasUsed
    ) private {
        PerformanceMetrics storage metrics = strategies[strategyId].performance;
        
        metrics.totalTrades++;
        if (pnl > 0) {
            metrics.successfulTrades++;
        }
        
        metrics.totalPnL += pnl;
        metrics.lastUpdateTime = block.timestamp;
        
        // Calculate other metrics
        if (metrics.totalTrades > 0) {
            metrics.avgTradeSize = metrics.totalVolume / metrics.totalTrades;
        }
        
        emit PerformanceUpdated(strategyId, metrics);
    }
    
    function _emergencyLiquidate(uint256 strategyId) private {
        // Implement emergency liquidation logic
        // Close all positions and convert to stable assets
        strategies[strategyId].status = StrategyStatus.LIQUIDATING;
    }
    
    function _calculateDailyPnL(uint256 strategyId) private view returns (int256) {
        // Calculate PnL for the current day
        // This would aggregate trades from the last 24 hours
        return 0;
    }
    
    function _calculatePositionConcentration(uint256 strategyId) private view returns (uint256) {
        // Calculate the concentration of positions
        // Returns percentage of portfolio in largest position
        return 0;
    }
    
    function _getMarketVolatility(address[] memory tokens) private view returns (uint256) {
        // Calculate average market volatility for given tokens
        uint256 totalVolatility = 0;
        
        for (uint256 i = 0; i < tokens.length; i++) {
            // Get volatility from AI service or price oracle
            totalVolatility += 100; // Placeholder
        }
        
        return totalVolatility / tokens.length;
    }
    
    function _simulateStrategyPerformance(
        StrategyType strategyType,
        StrategyConfig memory config,
        uint256 simulationPeriod
    ) private view returns (PerformanceMetrics memory) {
        // AI-powered simulation
        return PerformanceMetrics({
            totalTrades: 100,
            successfulTrades: 75,
            totalPnL: 1000 * 1e18,
            totalVolume: 10000 * 1e18,
            maxDrawdown: 500,
            sharpeRatio: 150,
            avgTradeSize: 100 * 1e18,
            lastUpdateTime: block.timestamp
        });
    }
    
    // Admin functions
    
    function setAuthorizedExecutor(address executor, bool authorized) external onlyOwner {
        authorizedExecutors[executor] = authorized;
    }
    
    function updateCoreComponents(
        address _traderAgent,
        address _routerDefense,
        address _crossChainRouter,
        address _aiOptimizer
    ) external onlyOwner {
        if (_traderAgent != address(0)) traderAgent = ITraderAgent(_traderAgent);
        if (_routerDefense != address(0)) routerDefense = IRouterDefense(_routerDefense);
        if (_crossChainRouter != address(0)) crossChainRouter = ICrossChainRouter(_crossChainRouter);
        if (_aiOptimizer != address(0)) aiOptimizer = IAIStrategyOptimizer(_aiOptimizer);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}