import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { TradingService } from '../services/TradingService';
import { logger } from '../utils/logger';
import { APIResponse, SwapParams, TradeOrder } from '../types';

const router = Router();

// Rate limiting for trading endpoints
const tradingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Trading rate limit exceeded',
  keyGenerator: (req) => req.user?.id || req.ip
});

router.use(tradingLimiter);

/**
 * @route POST /api/v1/trading/swap
 * @desc Execute immediate swap
 * @access Private
 */
router.post('/swap',
  [
    body('tokenIn').isEthereumAddress().withMessage('Invalid tokenIn address'),
    body('tokenOut').isEthereumAddress().withMessage('Invalid tokenOut address'),
    body('amountIn').isNumeric().withMessage('Invalid amountIn'),
    body('amountOutMin').isNumeric().withMessage('Invalid amountOutMin'),
    body('recipient').isEthereumAddress().withMessage('Invalid recipient address'),
    body('deadline').isInt({ min: 1 }).withMessage('Invalid deadline'),
    body('slippageTolerance').optional().isFloat({ min: 0, max: 100 }).withMessage('Invalid slippage tolerance')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const swapParams: SwapParams = req.body;
      const userId = req.user.id;
      
      logger.info(`Swap request from user ${userId}:`, swapParams);
      
      const result = await TradingService.executeSwap(userId, swapParams);
      
      const response: APIResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Swap execution failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SWAP_FAILED',
          message: 'Failed to execute swap',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/trading/limit-order
 * @desc Place limit order
 * @access Private
 */
router.post('/limit-order',
  [
    body('tokenIn').isEthereumAddress().withMessage('Invalid tokenIn address'),
    body('tokenOut').isEthereumAddress().withMessage('Invalid tokenOut address'),
    body('amountIn').isNumeric().withMessage('Invalid amountIn'),
    body('targetPrice').isNumeric().withMessage('Invalid target price'),
    body('deadline').isInt({ min: 1 }).withMessage('Invalid deadline')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { tokenIn, tokenOut, amountIn, targetPrice, deadline } = req.body;
      const userId = req.user.id;
      
      const result = await TradingService.placeLimitOrder(userId, {
        tokenIn,
        tokenOut,
        amountIn,
        targetPrice,
        deadline
      });
      
      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Limit order placement failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LIMIT_ORDER_FAILED',
          message: 'Failed to place limit order',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/trading/batch
 * @desc Execute batch trades
 * @access Private
 */
router.post('/batch',
  [
    body('orders').isArray({ min: 1, max: 10 }).withMessage('Invalid orders array'),
    body('orders.*.tokenIn').isEthereumAddress().withMessage('Invalid tokenIn address'),
    body('orders.*.tokenOut').isEthereumAddress().withMessage('Invalid tokenOut address'),
    body('orders.*.amountIn').isNumeric().withMessage('Invalid amountIn')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { orders } = req.body;
      const userId = req.user.id;
      
      const result = await TradingService.executeBatchTrades(userId, orders);
      
      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Batch trade execution failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_TRADE_FAILED',
          message: 'Failed to execute batch trades',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/trading/orders
 * @desc Get user's trading orders
 * @access Private
 */
router.get('/orders',
  [
    query('status').optional().isIn(['pending', 'executing', 'completed', 'cancelled', 'failed']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;
      
      const orders = await TradingService.getUserOrders(userId, {
        status: status as string,
        limit: Number(limit),
        offset: Number(offset)
      });
      
      res.json({
        success: true,
        data: orders,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Failed to fetch orders:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ORDERS_FAILED',
          message: 'Failed to fetch orders'
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/trading/orders/:orderId
 * @desc Get specific order details
 * @access Private
 */
router.get('/orders/:orderId',
  [
    param('orderId').isUUID().withMessage('Invalid order ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      
      const order = await TradingService.getOrderById(userId, orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }
        });
      }
      
      res.json({
        success: true,
        data: order,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Failed to fetch order:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ORDER_FAILED',
          message: 'Failed to fetch order'
        }
      });
    }
  }
);

/**
 * @route DELETE /api/v1/trading/orders/:orderId
 * @desc Cancel order
 * @access Private
 */
router.delete('/orders/:orderId',
  [
    param('orderId').isUUID().withMessage('Invalid order ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      
      const result = await TradingService.cancelOrder(userId, orderId);
      
      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Order cancellation failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CANCEL_ORDER_FAILED',
          message: 'Failed to cancel order',
          details: error.message
        }
      });
    }
  }
);

/**
 * @route POST /api/v1/trading/estimate
 * @desc Get trade estimate
 * @access Private
 */
router.post('/estimate',
  [
    body('tokenIn').isEthereumAddress().withMessage('Invalid tokenIn address'),
    body('tokenOut').isEthereumAddress().withMessage('Invalid tokenOut address'),
    body('amountIn').isNumeric().withMessage('Invalid amountIn'),
    body('slippageTolerance').optional().isFloat({ min: 0, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { tokenIn, tokenOut, amountIn, slippageTolerance = 0.5 } = req.body;
      
      const estimate = await TradingService.getTradeEstimate({
        tokenIn,
        tokenOut,
        amountIn,
        slippageTolerance
      });
      
      res.json({
        success: true,
        data: estimate,
        meta: {
          timestamp: Date.now(),
          requestId: req.id
        }
      });
    } catch (error) {
      logger.error('Trade estimation failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ESTIMATION_FAILED',
          message: 'Failed to estimate trade'
        }
      });
    }
  }
);

/**
 * @route GET /api/v1/trading/gas-price
 * @desc Get current gas price recommendations
 * @access Private
 */
router.get('/gas-price', async (req, res) => {
  try {
    const gasPrices = await TradingService.getGasPrices();
    
    res.json({
      success: true,
      data: gasPrices,
      meta: {
        timestamp: Date.now(),
        requestId: req.id
      }
    });
  } catch (error) {
    logger.error('Failed to fetch gas prices:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GAS_PRICE_FAILED',
        message: 'Failed to fetch gas prices'
      }
    });
  }
});

export default router;