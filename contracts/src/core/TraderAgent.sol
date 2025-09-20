// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../interfaces/ITraderAgent.sol";
import "../utils/ReentrancyGuard.sol";
import "../libraries/PriceOracle.sol";

contract TraderAgent is ITraderAgent, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    ISwapRouter public immutable swapRouter;
    
    mapping(uint256 => LimitOrder) public limitOrders;
    mapping(address => uint256[]) public userOrders;
    uint256 public nextOrderId = 1;
    
    uint256 public constant MAX_BATCH_SIZE = 10;
    uint256 public constant MIN_EXECUTION_DELAY = 1;
    
    modifier validDeadline(uint256 deadline) {
        require(deadline >= block.timestamp, "TraderAgent: expired deadline");
        _;
    }
    
    modifier onlyOrderOwner(uint256 orderId) {
        require(limitOrders[orderId].user == msg.sender, "TraderAgent: not order owner");
        _;
    }
    
    constructor(address _swapRouter) {
        swapRouter = ISwapRouter(_swapRouter);
    }
    
    function executeOrder(OrderParams calldata params) 
        external 
        payable 
        override 
        nonReentrant 
        validDeadline(params.deadline)
        returns (uint256 amountOut) 
    {
        require(params.amountIn > 0, "TraderAgent: invalid amount");
        
        if (params.tokenIn != address(0)) {
            IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
            IERC20(params.tokenIn).safeApprove(address(swapRouter), params.amountIn);
        } else {
            require(msg.value == params.amountIn, "TraderAgent: incorrect ETH amount");
        }
        
        ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter.ExactInputSingleParams({
            tokenIn: params.tokenIn == address(0) ? _getWETH() : params.tokenIn,
            tokenOut: params.tokenOut == address(0) ? _getWETH() : params.tokenOut,
            fee: 3000,
            recipient: msg.sender,
            deadline: params.deadline,
            amountIn: params.amountIn,
            amountOutMinimum: params.amountOutMin,
            sqrtPriceLimitX96: 0
        });
        
        if (params.tokenIn == address(0)) {
            amountOut = swapRouter.exactInputSingle{value: params.amountIn}(swapParams);
        } else {
            amountOut = swapRouter.exactInputSingle(swapParams);
        }
        
        emit OrderExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut
        );
    }
    
    function placeLimitOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice,
        uint256 deadline
    ) 
        external 
        payable 
        override 
        nonReentrant 
        validDeadline(deadline)
        returns (uint256 orderId) 
    {
        require(amountIn > 0, "TraderAgent: invalid amount");
        require(targetPrice > 0, "TraderAgent: invalid target price");
        
        if (tokenIn != address(0)) {
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        } else {
            require(msg.value == amountIn, "TraderAgent: incorrect ETH amount");
        }
        
        orderId = nextOrderId++;
        
        limitOrders[orderId] = LimitOrder({
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            targetPrice: targetPrice,
            deadline: deadline,
            executed: false
        });
        
        userOrders[msg.sender].push(orderId);
        
        emit LimitOrderPlaced(orderId, msg.sender, tokenIn, tokenOut, amountIn, targetPrice);
    }
    
    function executeLimitOrder(uint256 orderId) external override nonReentrant {
        LimitOrder storage order = limitOrders[orderId];
        require(!order.executed, "TraderAgent: already executed");
        require(order.deadline >= block.timestamp, "TraderAgent: order expired");
        
        uint256 currentPrice = _getCurrentPrice(order.tokenIn, order.tokenOut);
        require(
            (order.tokenIn < order.tokenOut && currentPrice >= order.targetPrice) ||
            (order.tokenIn > order.tokenOut && currentPrice <= order.targetPrice),
            "TraderAgent: price condition not met"
        );
        
        order.executed = true;
        
        OrderParams memory params = OrderParams({
            tokenIn: order.tokenIn,
            tokenOut: order.tokenOut,
            amountIn: order.amountIn,
            amountOutMin: 0,
            deadline: block.timestamp + 300,
            routeData: ""
        });
        
        if (order.tokenIn != address(0)) {
            IERC20(order.tokenIn).safeApprove(address(swapRouter), order.amountIn);
        }
        
        ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter.ExactInputSingleParams({
            tokenIn: order.tokenIn == address(0) ? _getWETH() : order.tokenIn,
            tokenOut: order.tokenOut == address(0) ? _getWETH() : order.tokenOut,
            fee: 3000,
            recipient: order.user,
            deadline: block.timestamp + 300,
            amountIn: order.amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        
        if (order.tokenIn == address(0)) {
            swapRouter.exactInputSingle{value: order.amountIn}(swapParams);
        } else {
            swapRouter.exactInputSingle(swapParams);
        }
        
        emit LimitOrderExecuted(orderId);
    }
    
    function cancelLimitOrder(uint256 orderId) 
        external 
        override 
        nonReentrant 
        onlyOrderOwner(orderId) 
    {
        LimitOrder storage order = limitOrders[orderId];
        require(!order.executed, "TraderAgent: already executed");
        
        order.executed = true;
        
        if (order.tokenIn != address(0)) {
            IERC20(order.tokenIn).safeTransfer(order.user, order.amountIn);
        } else {
            payable(order.user).transfer(order.amountIn);
        }
        
        emit LimitOrderCancelled(orderId);
    }
    
    function batchExecuteOrders(OrderParams[] calldata orders) 
        external 
        payable 
        override 
        nonReentrant 
    {
        require(orders.length <= MAX_BATCH_SIZE, "TraderAgent: batch too large");
        require(orders.length > 0, "TraderAgent: empty batch");
        
        uint256 totalETHValue = 0;
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].tokenIn == address(0)) {
                totalETHValue += orders[i].amountIn;
            }
        }
        require(msg.value == totalETHValue, "TraderAgent: incorrect ETH amount");
        
        for (uint256 i = 0; i < orders.length; i++) {
            _executeSingleOrder(orders[i]);
        }
    }
    
    function _executeSingleOrder(OrderParams calldata params) private {
        require(params.deadline >= block.timestamp, "TraderAgent: expired deadline");
        require(params.amountIn > 0, "TraderAgent: invalid amount");
        
        if (params.tokenIn != address(0)) {
            IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
            IERC20(params.tokenIn).safeApprove(address(swapRouter), params.amountIn);
        }
        
        ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter.ExactInputSingleParams({
            tokenIn: params.tokenIn == address(0) ? _getWETH() : params.tokenIn,
            tokenOut: params.tokenOut == address(0) ? _getWETH() : params.tokenOut,
            fee: 3000,
            recipient: msg.sender,
            deadline: params.deadline,
            amountIn: params.amountIn,
            amountOutMinimum: params.amountOutMin,
            sqrtPriceLimitX96: 0
        });
        
        uint256 amountOut;
        if (params.tokenIn == address(0)) {
            amountOut = swapRouter.exactInputSingle{value: params.amountIn}(swapParams);
        } else {
            amountOut = swapRouter.exactInputSingle(swapParams);
        }
        
        emit OrderExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut
        );
    }
    
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }
    
    function getOrderDetails(uint256 orderId) external view returns (LimitOrder memory) {
        return limitOrders[orderId];
    }
    
    function _getCurrentPrice(address tokenIn, address tokenOut) private view returns (uint256) {
        address poolAddress = _getPoolAddress(tokenIn, tokenOut);
        return PriceOracle.getPrice(poolAddress, tokenIn, tokenOut);
    }
    
    function _getPoolAddress(address tokenA, address tokenB) private pure returns (address) {
        return address(0);
    }
    
    function _getWETH() private pure returns (address) {
        return 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    }
    
    receive() external payable {}
}