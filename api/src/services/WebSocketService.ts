import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(io: SocketIOServer): void {
    this.io = io;
    logger.info('WebSocket service initialized');
  }

  public broadcast(channel: string, data: any): void {
    if (this.io) {
      this.io.to(channel).emit('data', data);
    }
  }

  public broadcastToAll(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}