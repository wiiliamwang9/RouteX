// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../interfaces/IRouterDefense.sol";
import "../utils/ReentrancyGuard.sol";
import "../libraries/RouteOptimizer.sol";

contract RouterDefense is IRouterDefense, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    ISwapRouter public immutable swapRouter;
    
    mapping(address => CommitRevealOrder) public commitments;
    mapping(bytes32 => bool) public usedCommitments;
    address[] public revealedOrders;
    
    uint256 public constant COMMIT_REVEAL_DELAY = 60;
    uint256 public constant MAX_BATCH_SIZE = 20;
    uint256 public constant SLIPPAGE_PROTECTION = 500;
    
    RouteOptimizer.PoolInfo[] public supportedPools;
    mapping(address => mapping(address => address[])) public tokenPairPools;
    
    modifier validCommitment(bytes32 commitment) {
        require(commitment != bytes32(0), "RouterDefense: invalid commitment");
        require(!usedCommitments[commitment], "RouterDefense: commitment used");
        _;
    }
    
    modifier validReveal(bytes32 commitment) {
        CommitRevealOrder storage order = commitments[msg.sender];
        require(order.commitment == commitment, "RouterDefense: invalid reveal");
        require(!order.revealed, "RouterDefense: already revealed");
        require(order.deadline >= block.timestamp, "RouterDefense: commitment expired");
        require(
            block.timestamp >= order.deadline - COMMIT_REVEAL_DELAY,
            "RouterDefense: reveal too early"
        );
        _;
    }
    
    constructor(address _swapRouter) {
        swapRouter = ISwapRouter(_swapRouter);
        _initializePools();
    }
    
    function protectedSwap(SwapParams calldata params) 
        external 
        payable 
        override 
        nonReentrant 
        returns (uint256 amountOut) 
    {
        require(params.deadline >= block.timestamp, "RouterDefense: expired deadline");
        require(params.amountIn > 0, "RouterDefense: invalid amount");
        
        if (params.tokenIn != address(0)) {
            IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
        } else {
            require(msg.value == params.amountIn, "RouterDefense: incorrect ETH amount");
        }
        
        (Route[] memory routes, uint256 expectedAmountOut) = getOptimalRoute(
            params.tokenIn,
            params.tokenOut,
            params.amountIn
        );
        
        require(expectedAmountOut >= params.amountOutMin, "RouterDefense: insufficient output");
        
        amountOut = _executeMultiPathSwap(params, routes);
        
        require(amountOut >= params.amountOutMin, "RouterDefense: slippage exceeded");
        
        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            routes
        );
    }
    
    function commitOrder(bytes32 commitment, uint256 deadline) 
        external 
        override 
        validCommitment(commitment) 
    {
        require(deadline > block.timestamp + COMMIT_REVEAL_DELAY, "RouterDefense: deadline too soon");
        require(deadline <= block.timestamp + 3600, "RouterDefense: deadline too far");
        
        commitments[msg.sender] = CommitRevealOrder({
            commitment: commitment,
            deadline: deadline,
            revealed: false,
            executed: false
        });
        
        usedCommitments[commitment] = true;
        
        emit CommitmentMade(msg.sender, commitment, deadline);
    }
    
    function revealAndExecute(
        SwapParams calldata params,
        uint256 nonce,
        bytes32 salt
    ) 
        external 
        payable 
        override 
        nonReentrant 
        returns (uint256 amountOut) 
    {
        bytes32 expectedCommitment = keccak256(abi.encodePacked(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            params.amountOutMin,
            params.recipient,
            params.deadline,
            nonce,
            salt
        ));
        
        require(
            commitments[msg.sender].commitment == expectedCommitment,
            "RouterDefense: invalid reveal"
        );
        
        CommitRevealOrder storage order = commitments[msg.sender];
        require(!order.revealed, "RouterDefense: already revealed");
        require(!order.executed, "RouterDefense: already executed");
        require(order.deadline >= block.timestamp, "RouterDefense: commitment expired");
        
        order.revealed = true;
        revealedOrders.push(msg.sender);
        
        emit OrderRevealed(msg.sender, expectedCommitment);
        
        if (params.tokenIn != address(0)) {
            IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
        } else {
            require(msg.value == params.amountIn, "RouterDefense: incorrect ETH amount");
        }
        
        (Route[] memory routes, uint256 expectedAmountOut) = getOptimalRoute(
            params.tokenIn,
            params.tokenOut,
            params.amountIn
        );
        
        amountOut = _executeMultiPathSwap(params, routes);
        order.executed = true;
        
        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            routes
        );
    }
    
    function batchExecuteRevealed() external override nonReentrant {
        require(revealedOrders.length > 0, "RouterDefense: no revealed orders");
        
        uint256 executed = 0;
        uint256 gasStart = gasleft();
        
        for (uint256 i = 0; i < revealedOrders.length && executed < MAX_BATCH_SIZE; i++) {
            address user = revealedOrders[i];
            CommitRevealOrder storage order = commitments[user];
            
            if (order.revealed && !order.executed && order.deadline >= block.timestamp) {
                order.executed = true;
                executed++;
            }
        }
        
        if (executed > 0) {
            _clearRevealedOrders();
        }
        
        uint256 gasUsed = gasStart - gasleft();
        uint256 gasSaved = executed * 21000;
        
        emit BatchExecuted(executed, gasSaved);
    }
    
    function getOptimalRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) 
        public 
        view 
        override 
        returns (Route[] memory routes, uint256 expectedAmountOut) 
    {
        RouteOptimizer.PoolInfo[] memory availablePools = _getAvailablePools(tokenIn, tokenOut);
        return RouteOptimizer.optimizeRoute(tokenIn, tokenOut, amountIn, availablePools);
    }
    
    function _executeMultiPathSwap(
        SwapParams calldata params,
        Route[] memory routes
    ) private returns (uint256 totalAmountOut) {
        require(routes.length > 0, "RouterDefense: no routes available");
        
        uint256 remainingAmountIn = params.amountIn;
        
        for (uint256 i = 0; i < routes.length; i++) {
            if (remainingAmountIn == 0) break;
            
            uint256 routeAmountIn = (params.amountIn * routes[i].percentage) / 10000;
            if (routeAmountIn > remainingAmountIn) {
                routeAmountIn = remainingAmountIn;
            }
            
            if (routeAmountIn > 0) {
                uint256 routeAmountOut = _executeSingleRoute(
                    routes[i],
                    routeAmountIn,
                    params.recipient,
                    params.deadline
                );
                
                totalAmountOut += routeAmountOut;
                remainingAmountIn -= routeAmountIn;
            }
        }
    }
    
    function _executeSingleRoute(
        Route memory route,
        uint256 amountIn,
        address recipient,
        uint256 deadline
    ) private returns (uint256 amountOut) {
        if (route.tokenIn != address(0)) {
            IERC20(route.tokenIn).safeApprove(address(swapRouter), amountIn);
        }
        
        ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter.ExactInputSingleParams({
            tokenIn: route.tokenIn == address(0) ? _getWETH() : route.tokenIn,
            tokenOut: route.tokenOut == address(0) ? _getWETH() : route.tokenOut,
            fee: 3000,
            recipient: recipient,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        
        if (route.tokenIn == address(0)) {
            amountOut = swapRouter.exactInputSingle{value: amountIn}(swapParams);
        } else {
            amountOut = swapRouter.exactInputSingle(swapParams);
        }
    }
    
    function _getAvailablePools(
        address tokenIn,
        address tokenOut
    ) private view returns (RouteOptimizer.PoolInfo[] memory) {
        address[] memory pools = tokenPairPools[tokenIn][tokenOut];
        RouteOptimizer.PoolInfo[] memory poolInfos = new RouteOptimizer.PoolInfo[](pools.length);
        
        for (uint256 i = 0; i < pools.length; i++) {
            poolInfos[i] = RouteOptimizer.PoolInfo({
                pool: pools[i],
                token0: tokenIn < tokenOut ? tokenIn : tokenOut,
                token1: tokenIn < tokenOut ? tokenOut : tokenIn,
                liquidity: 1000000 * 1e18,
                fee: 3000
            });
        }
        
        return poolInfos;
    }
    
    function _initializePools() private {
        address WETH = _getWETH();
        address USDC = 0xA0B86A33E6417C82bdDB8E35c5B14bBc6c3E6d7C;
        address DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        
        address poolWETH_USDC = 0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8;
        address poolWETH_DAI = 0xC2e9F25Be6257c210d7Adf0D4Cd6E3E881ba25f8;
        address poolUSDC_DAI = 0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168;
        
        tokenPairPools[WETH][USDC].push(poolWETH_USDC);
        tokenPairPools[USDC][WETH].push(poolWETH_USDC);
        
        tokenPairPools[WETH][DAI].push(poolWETH_DAI);
        tokenPairPools[DAI][WETH].push(poolWETH_DAI);
        
        tokenPairPools[USDC][DAI].push(poolUSDC_DAI);
        tokenPairPools[DAI][USDC].push(poolUSDC_DAI);
    }
    
    function _clearRevealedOrders() private {
        delete revealedOrders;
    }
    
    function _getWETH() private pure returns (address) {
        return 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    }
    
    function addPool(
        address tokenA,
        address tokenB,
        address pool
    ) external onlyOwner {
        tokenPairPools[tokenA][tokenB].push(pool);
        tokenPairPools[tokenB][tokenA].push(pool);
    }
    
    function getCommitmentStatus(address user) external view returns (CommitRevealOrder memory) {
        return commitments[user];
    }
    
    function getRevealedOrdersCount() external view returns (uint256) {
        return revealedOrders.length;
    }
    
    receive() external payable {}
}