// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICrossChainRouter {
    struct CrossChainSwapParams {
        uint256 srcChainId;
        uint256 dstChainId;
        address srcToken;
        address dstToken;
        uint256 amountIn;
        uint256 amountOutMin;
        address recipient;
        uint256 deadline;
        bytes bridgeData;
        uint256 nonce;
    }

    struct BridgeInfo {
        address bridgeAddress;
        uint256 fee;
        uint256 estimatedTime;
        bool isActive;
        uint256 maxAmount;
        uint256 minAmount;
    }

    struct CrossChainCommitment {
        bytes32 commitment;
        uint256 srcChainId;
        uint256 dstChainId;
        uint256 deadline;
        bool revealed;
        bool executed;
        address user;
    }

    event CrossChainSwapInitiated(
        bytes32 indexed swapId,
        address indexed user,
        uint256 srcChainId,
        uint256 dstChainId,
        address srcToken,
        address dstToken,
        uint256 amountIn
    );

    event CrossChainSwapCompleted(
        bytes32 indexed swapId,
        uint256 amountOut,
        uint256 bridgeFee
    );

    event CrossChainCommitmentMade(
        bytes32 indexed commitment,
        address indexed user,
        uint256 srcChainId,
        uint256 dstChainId
    );

    event BridgeAdded(address bridge, uint256 chainId);
    event BridgeRemoved(address bridge, uint256 chainId);

    function initiateCrossChainSwap(
        CrossChainSwapParams calldata params
    ) external payable returns (bytes32 swapId);

    function commitCrossChainOrder(
        bytes32 commitment,
        uint256 srcChainId,
        uint256 dstChainId,
        uint256 deadline
    ) external;

    function revealCrossChainOrder(
        CrossChainSwapParams calldata params,
        bytes32 salt
    ) external payable returns (bytes32 swapId);

    function getOptimalBridge(
        uint256 srcChainId,
        uint256 dstChainId,
        address token,
        uint256 amount
    ) external view returns (BridgeInfo memory);

    function getSupportedChains() external view returns (uint256[] memory);
    
    function estimateCrossChainFee(
        uint256 srcChainId,
        uint256 dstChainId,
        address token,
        uint256 amount
    ) external view returns (uint256 fee, uint256 estimatedTime);
}