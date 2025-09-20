// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRouterDefense {
    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        address recipient;
        uint256 deadline;
    }

    struct Route {
        address pool;
        address tokenIn;
        address tokenOut;
        uint256 percentage;
    }

    struct CommitRevealOrder {
        bytes32 commitment;
        uint256 deadline;
        bool revealed;
        bool executed;
    }

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        Route[] routes
    );

    event CommitmentMade(address indexed user, bytes32 indexed commitment, uint256 deadline);
    event OrderRevealed(address indexed user, bytes32 indexed commitment);
    event BatchExecuted(uint256 orderCount, uint256 totalGasSaved);

    function protectedSwap(SwapParams calldata params) external payable returns (uint256 amountOut);
    
    function commitOrder(bytes32 commitment, uint256 deadline) external;
    function revealAndExecute(
        SwapParams calldata params,
        uint256 nonce,
        bytes32 salt
    ) external payable returns (uint256 amountOut);
    
    function batchExecuteRevealed() external;
    function getOptimalRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (Route[] memory routes, uint256 expectedAmountOut);
}