// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ITraderAgent {
    struct OrderParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        uint256 deadline;
        bytes routeData;
    }

    struct LimitOrder {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 targetPrice;
        uint256 deadline;
        bool executed;
    }

    event OrderExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    event LimitOrderPlaced(
        uint256 indexed orderId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice
    );

    event LimitOrderExecuted(uint256 indexed orderId);
    event LimitOrderCancelled(uint256 indexed orderId);

    function executeOrder(OrderParams calldata params) external payable returns (uint256 amountOut);
    
    function placeLimitOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice,
        uint256 deadline
    ) external payable returns (uint256 orderId);
    
    function executeLimitOrder(uint256 orderId) external;
    function cancelLimitOrder(uint256 orderId) external;
    function batchExecuteOrders(OrderParams[] calldata orders) external payable;
}