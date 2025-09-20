import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Route imports
import tradingRoutes from './routes/trading';
import crossChainRoutes from './routes/crossChain';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import quantGuardRoutes from './routes/quantGuard';
import healthRoutes from './routes/health';

// Service imports
import { BlockchainService } from './services/BlockchainService';
import { RedisService } from './services/RedisService';
import { WebSocketService } from './services/WebSocketService';
import { AIService } from './services/AIService';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// API versioning
const API_PREFIX = '/api/v1';

// Public routes (no auth required)
app.use(`${API_PREFIX}/health`, healthRoutes);

// Protected routes (require API key)
app.use(`${API_PREFIX}/trading`, authMiddleware, tradingRoutes);
app.use(`${API_PREFIX}/cross-chain`, authMiddleware, crossChainRoutes);
app.use(`${API_PREFIX}/ai`, authMiddleware, aiRoutes);
app.use(`${API_PREFIX}/analytics`, authMiddleware, analyticsRoutes);
app.use(`${API_PREFIX}/quant-guard`, authMiddleware, quantGuardRoutes);

// WebSocket connection handling
io.use((socket, next) => {
  // WebSocket authentication
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  // Validate token here
  next();
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('subscribe', (data) => {
    const { channels } = data;
    channels?.forEach((channel: string) => {
      socket.join(channel);
      logger.info(`Client ${socket.id} subscribed to ${channel}`);
    });
  });
  
  socket.on('unsubscribe', (data) => {
    const { channels } = data;
    channels?.forEach((channel: string) => {
      socket.leave(channel);
      logger.info(`Client ${socket.id} unsubscribed from ${channel}`);
    });
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Initialize services
async function initializeServices() {
  try {
    // Initialize Redis
    await RedisService.getInstance().connect();
    logger.info('Redis connected successfully');
    
    // Initialize Blockchain connections
    await BlockchainService.getInstance().initialize();
    logger.info('Blockchain services initialized');
    
    // Initialize AI Service
    await AIService.getInstance().initialize();
    logger.info('AI service initialized');
    
    // Initialize WebSocket service
    WebSocketService.getInstance().initialize(io);
    logger.info('WebSocket service initialized');
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      logger.info(`🚀 RouteX API Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/v1/health`);
      logger.info(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();