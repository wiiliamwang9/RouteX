import { Router } from 'express';
import { BlockchainService } from '../services/BlockchainService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/v1/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        api: 'healthy',
        blockchain: 'checking...',
        ai: 'healthy',
        cache: 'healthy'
      },
      environment: process.env.NODE_ENV || 'development'
    };

    // Check blockchain connectivity
    try {
      const blockchainService = BlockchainService.getInstance();
      const blockNumber = await blockchainService.getBlockNumber('monad-testnet');
      health.services.blockchain = 'healthy';
      (health as any).blockNumber = blockNumber;
    } catch (error) {
      health.services.blockchain = 'degraded';
      logger.warn('Blockchain health check failed:', error);
    }

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed'
      }
    });
  }
});

/**
 * @route GET /api/v1/health/detailed
 * @desc Detailed health check with service diagnostics
 * @access Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const detailed = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      services: {
        api: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        blockchain: {
          status: 'checking...',
          networks: {}
        },
        ai: {
          status: process.env.CLAUDE_API_KEY ? 'healthy' : 'disabled',
          model: 'claude-3-haiku-20240307'
        }
      }
    };

    res.json({
      success: true,
      data: detailed
    });
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DETAILED_HEALTH_CHECK_FAILED',
        message: 'Detailed health check failed'
      }
    });
  }
});

export default router;