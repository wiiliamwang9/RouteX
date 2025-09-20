// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ICrossChainRouter.sol";
import "../utils/ReentrancyGuard.sol";

contract CrossChainRouter is ICrossChainRouter, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    mapping(uint256 => BridgeInfo[]) public supportedBridges;
    mapping(bytes32 => CrossChainCommitment) public crossChainCommitments;
    mapping(bytes32 => bool) public completedSwaps;
    mapping(address => bytes32[]) public userCommitments;
    
    uint256[] public supportedChainIds;
    uint256 public constant COMMITMENT_DELAY = 300; // 5 minutes
    uint256 public constant MAX_SLIPPAGE = 500; // 5%
    
    address public constant LAYERZERO_ENDPOINT = 0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675;
    address public constant AXELAR_GATEWAY = 0x4F4495243837681061C4743b74B3eEdf548D56A5;
    
    modifier validChain(uint256 chainId) {
        require(_isChainSupported(chainId), "CrossChainRouter: unsupported chain");
        _;
    }
    
    modifier validCommitment(bytes32 commitment) {
        CrossChainCommitment storage commitmentData = crossChainCommitments[commitment];
        require(commitmentData.user == msg.sender, "CrossChainRouter: not commitment owner");
        require(!commitmentData.revealed, "CrossChainRouter: already revealed");
        require(commitmentData.deadline >= block.timestamp, "CrossChainRouter: commitment expired");
        _;
    }
    
    constructor() {
        _initializeSupportedChains();
        _initializeBridges();
    }
    
    function initiateCrossChainSwap(
        CrossChainSwapParams calldata params
    ) 
        external 
        payable 
        override 
        nonReentrant 
        validChain(params.srcChainId)
        validChain(params.dstChainId)
        returns (bytes32 swapId) 
    {
        require(params.deadline >= block.timestamp, "CrossChainRouter: expired deadline");
        require(params.amountIn > 0, "CrossChainRouter: invalid amount");
        require(params.srcChainId != params.dstChainId, "CrossChainRouter: same chain");
        
        swapId = keccak256(abi.encodePacked(
            msg.sender,
            params.srcChainId,
            params.dstChainId,
            params.srcToken,
            params.dstToken,
            params.amountIn,
            params.nonce,
            block.timestamp
        ));
        
        require(!completedSwaps[swapId], "CrossChainRouter: swap already exists");
        
        if (params.srcToken != address(0)) {
            IERC20(params.srcToken).safeTransferFrom(msg.sender, address(this), params.amountIn);
        } else {
            require(msg.value >= params.amountIn, "CrossChainRouter: insufficient ETH");
        }
        
        BridgeInfo memory optimalBridge = getOptimalBridge(
            params.srcChainId,
            params.dstChainId,
            params.srcToken,
            params.amountIn
        );
        
        require(optimalBridge.isActive, "CrossChainRouter: no active bridge");
        require(params.amountIn >= optimalBridge.minAmount, "CrossChainRouter: amount too small");
        require(params.amountIn <= optimalBridge.maxAmount, "CrossChainRouter: amount too large");
        
        uint256 bridgeFee = _calculateBridgeFee(optimalBridge, params.amountIn);
        uint256 amountAfterFee = params.amountIn - bridgeFee;
        
        _executeBridge(optimalBridge, params, amountAfterFee);
        
        emit CrossChainSwapInitiated(
            swapId,
            msg.sender,
            params.srcChainId,
            params.dstChainId,
            params.srcToken,
            params.dstToken,
            params.amountIn
        );
        
        completedSwaps[swapId] = true;
    }
    
    function commitCrossChainOrder(
        bytes32 commitment,
        uint256 srcChainId,
        uint256 dstChainId,
        uint256 deadline
    ) 
        external 
        override 
        validChain(srcChainId)
        validChain(dstChainId)
    {
        require(commitment != bytes32(0), "CrossChainRouter: invalid commitment");
        require(deadline > block.timestamp + COMMITMENT_DELAY, "CrossChainRouter: deadline too soon");
        require(deadline <= block.timestamp + 3600, "CrossChainRouter: deadline too far");
        require(crossChainCommitments[commitment].user == address(0), "CrossChainRouter: commitment exists");
        
        crossChainCommitments[commitment] = CrossChainCommitment({
            commitment: commitment,
            srcChainId: srcChainId,
            dstChainId: dstChainId,
            deadline: deadline,
            revealed: false,
            executed: false,
            user: msg.sender
        });
        
        userCommitments[msg.sender].push(commitment);
        
        emit CrossChainCommitmentMade(commitment, msg.sender, srcChainId, dstChainId);
    }
    
    function revealCrossChainOrder(
        CrossChainSwapParams calldata params,
        bytes32 salt
    ) 
        external 
        payable 
        override 
        nonReentrant 
        returns (bytes32 swapId) 
    {
        bytes32 expectedCommitment = keccak256(abi.encodePacked(
            msg.sender,
            params.srcChainId,
            params.dstChainId,
            params.srcToken,
            params.dstToken,
            params.amountIn,
            params.amountOutMin,
            params.recipient,
            params.deadline,
            params.nonce,
            salt
        ));
        
        CrossChainCommitment storage commitment = crossChainCommitments[expectedCommitment];
        require(commitment.user == msg.sender, "CrossChainRouter: invalid reveal");
        require(!commitment.revealed, "CrossChainRouter: already revealed");
        require(!commitment.executed, "CrossChainRouter: already executed");
        require(commitment.deadline >= block.timestamp, "CrossChainRouter: commitment expired");
        require(
            block.timestamp >= commitment.deadline - COMMITMENT_DELAY,
            "CrossChainRouter: reveal too early"
        );
        
        commitment.revealed = true;
        commitment.executed = true;
        
        // Execute the cross-chain swap directly
        swapId = keccak256(abi.encodePacked(
            msg.sender,
            params.srcChainId,
            params.dstChainId,
            params.srcToken,
            params.dstToken,
            params.amountIn,
            params.nonce,
            block.timestamp
        ));
        
        require(!completedSwaps[swapId], "CrossChainRouter: swap already exists");
        
        if (params.srcToken != address(0)) {
            IERC20(params.srcToken).safeTransferFrom(msg.sender, address(this), params.amountIn);
        } else {
            require(msg.value >= params.amountIn, "CrossChainRouter: insufficient ETH");
        }
        
        BridgeInfo memory optimalBridge = getOptimalBridge(
            params.srcChainId,
            params.dstChainId,
            params.srcToken,
            params.amountIn
        );
        
        require(optimalBridge.isActive, "CrossChainRouter: no active bridge");
        require(params.amountIn >= optimalBridge.minAmount, "CrossChainRouter: amount too small");
        require(params.amountIn <= optimalBridge.maxAmount, "CrossChainRouter: amount too large");
        
        uint256 bridgeFee = _calculateBridgeFee(optimalBridge, params.amountIn);
        uint256 amountAfterFee = params.amountIn - bridgeFee;
        
        _executeBridge(optimalBridge, params, amountAfterFee);
        
        emit CrossChainSwapInitiated(
            swapId,
            msg.sender,
            params.srcChainId,
            params.dstChainId,
            params.srcToken,
            params.dstToken,
            params.amountIn
        );
        
        completedSwaps[swapId] = true;
        
        emit CrossChainSwapCompleted(swapId, 0, 0);
    }
    
    function getOptimalBridge(
        uint256 srcChainId,
        uint256 dstChainId,
        address token,
        uint256 amount
    ) 
        public 
        view 
        override 
        returns (BridgeInfo memory) 
    {
        BridgeInfo[] memory bridges = supportedBridges[srcChainId];
        BridgeInfo memory optimalBridge;
        uint256 lowestCost = type(uint256).max;
        
        for (uint256 i = 0; i < bridges.length; i++) {
            if (!bridges[i].isActive) continue;
            if (amount < bridges[i].minAmount || amount > bridges[i].maxAmount) continue;
            
            uint256 totalCost = _calculateBridgeFee(bridges[i], amount) + 
                               _calculateTimeCost(bridges[i].estimatedTime);
            
            if (totalCost < lowestCost) {
                lowestCost = totalCost;
                optimalBridge = bridges[i];
            }
        }
        
        return optimalBridge;
    }
    
    function getSupportedChains() external view override returns (uint256[] memory) {
        return supportedChainIds;
    }
    
    function estimateCrossChainFee(
        uint256 srcChainId,
        uint256 dstChainId,
        address token,
        uint256 amount
    ) 
        external 
        view 
        override 
        returns (uint256 fee, uint256 estimatedTime) 
    {
        BridgeInfo memory bridge = getOptimalBridge(srcChainId, dstChainId, token, amount);
        fee = _calculateBridgeFee(bridge, amount);
        estimatedTime = bridge.estimatedTime;
    }
    
    function _executeBridge(
        BridgeInfo memory bridge,
        CrossChainSwapParams calldata params,
        uint256 amount
    ) private {
        if (bridge.bridgeAddress == LAYERZERO_ENDPOINT) {
            _executeLayerZeroBridge(params, amount);
        } else if (bridge.bridgeAddress == AXELAR_GATEWAY) {
            _executeAxelarBridge(params, amount);
        } else {
            _executeGenericBridge(bridge, params, amount);
        }
    }
    
    function _executeLayerZeroBridge(
        CrossChainSwapParams calldata params,
        uint256 amount
    ) private {
        // LayerZero 跨链实现
        // 这里需要根据 LayerZero 的具体 API 实现
    }
    
    function _executeAxelarBridge(
        CrossChainSwapParams calldata params,
        uint256 amount
    ) private {
        // Axelar 跨链实现
        // 这里需要根据 Axelar 的具体 API 实现
    }
    
    function _executeGenericBridge(
        BridgeInfo memory bridge,
        CrossChainSwapParams calldata params,
        uint256 amount
    ) private {
        // 通用跨链桥实现
        // 根据具体桥的接口实现
    }
    
    function _calculateBridgeFee(
        BridgeInfo memory bridge,
        uint256 amount
    ) private pure returns (uint256) {
        return (amount * bridge.fee) / 10000;
    }
    
    function _calculateTimeCost(uint256 estimatedTime) private pure returns (uint256) {
        return estimatedTime * 100; // 时间成本权重
    }
    
    function _isChainSupported(uint256 chainId) private view returns (bool) {
        for (uint256 i = 0; i < supportedChainIds.length; i++) {
            if (supportedChainIds[i] == chainId) {
                return true;
            }
        }
        return false;
    }
    
    function _initializeSupportedChains() private {
        supportedChainIds.push(1);     // Ethereum
        supportedChainIds.push(137);   // Polygon
        supportedChainIds.push(56);    // BSC
        supportedChainIds.push(42161); // Arbitrum
        supportedChainIds.push(10);    // Optimism
        supportedChainIds.push(43114); // Avalanche
        supportedChainIds.push(250);   // Fantom
        supportedChainIds.push(25);    // Cronos
        supportedChainIds.push(1000);  // Monad (假设)
    }
    
    function _initializeBridges() private {
        // 初始化各链的桥接信息
        _addBridge(1, LAYERZERO_ENDPOINT, 30, 600, true, 1000000 ether, 0.01 ether);
        _addBridge(137, LAYERZERO_ENDPOINT, 25, 300, true, 1000000 ether, 0.01 ether);
        _addBridge(56, AXELAR_GATEWAY, 35, 900, true, 500000 ether, 0.001 ether);
    }
    
    function _addBridge(
        uint256 chainId,
        address bridgeAddress,
        uint256 fee,
        uint256 estimatedTime,
        bool isActive,
        uint256 maxAmount,
        uint256 minAmount
    ) private {
        supportedBridges[chainId].push(BridgeInfo({
            bridgeAddress: bridgeAddress,
            fee: fee,
            estimatedTime: estimatedTime,
            isActive: isActive,
            maxAmount: maxAmount,
            minAmount: minAmount
        }));
    }
    
    function addBridge(
        uint256 chainId,
        address bridgeAddress,
        uint256 fee,
        uint256 estimatedTime,
        uint256 maxAmount,
        uint256 minAmount
    ) external onlyOwner {
        _addBridge(chainId, bridgeAddress, fee, estimatedTime, true, maxAmount, minAmount);
        emit BridgeAdded(bridgeAddress, chainId);
    }
    
    function removeBridge(uint256 chainId, address bridgeAddress) external onlyOwner {
        BridgeInfo[] storage bridges = supportedBridges[chainId];
        for (uint256 i = 0; i < bridges.length; i++) {
            if (bridges[i].bridgeAddress == bridgeAddress) {
                bridges[i] = bridges[bridges.length - 1];
                bridges.pop();
                emit BridgeRemoved(bridgeAddress, chainId);
                break;
            }
        }
    }
    
    function getUserCommitments(address user) external view returns (bytes32[] memory) {
        return userCommitments[user];
    }
}