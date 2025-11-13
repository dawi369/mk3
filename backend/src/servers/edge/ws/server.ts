// Purpose: WebSocket server for real-time bar streaming to clients

import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { EDGE_WS_PORT } from '@/config/env.js';
import { LIMITS } from '@/config/limits.js';
import { validateConnection } from './auth.js';
import { delayTime } from './types.js';
import type { ClientConnection, ClientMessage, ServerMessage } from './types.js';

export class EdgeWSServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private clientsByDelay: Map<number, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Start the WebSocket server
   */
  async start(): Promise<void> {
    this.wss = new WebSocketServer({ port: EDGE_WS_PORT });

    console.log(`Edge WebSocket server listening on port ${EDGE_WS_PORT}`);

    this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
    this.wss.on('error', (error) => {
      console.error('[WS] Server error:', error);
    });

    // Start heartbeat monitoring
    this.startHeartbeat();
  }

  /**
   * Handle new client connection
   */
  private async handleConnection(ws: WebSocket, req: any): Promise<void> {
    // Check max clients limit
    if (this.clients.size >= LIMITS.maxWsClients) {
      console.warn('[WS] Max clients reached, rejecting connection');
      ws.close(1008, 'Server at capacity');
      return;
    }

    // Extract metadata
    const ipAddress = req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    // Validate connection (placeholder auth)
    const authResult = await validateConnection(undefined, { ipAddress, userAgent });
    if (!authResult.authenticated) {
      console.warn(`[WS] Connection rejected: ${authResult.error}`);
      ws.close(1008, authResult.error || 'Authentication failed');
      return;
    }

    // Create client connection
    const clientId = randomUUID();
    const client: ClientConnection = {
      id: clientId,
      ws,
      subscriptions: new Set(['*']), // Default: subscribe to all symbols
      delaySeconds: delayTime.zero,                // Default: real-time
      lastSentTimestamp: Date.now(),
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      isAlive: true,
      metadata: {
        ipAddress,
        userAgent,
        ...(authResult.userId && { userId: authResult.userId }),
        ...(authResult.permissions && { permissions: authResult.permissions }),
      },
    };

    this.clients.set(clientId, client);
    
    // Add to delay group (default is 0 = real-time)
    this.addClientToDelayGroup(clientId, 0);
    
    console.log(`[WS] Client connected: ${clientId} (${ipAddress}) | Total: ${this.clients.size}`);

    // Send welcome message
    this.sendToClient(client, {
      type: 'welcome',
      clientId,
      serverTime: Date.now(),
    });

    // Set up event handlers
    ws.on('message', (data) => this.handleMessage(client, data));
    ws.on('pong', () => this.handlePong(client));
    ws.on('close', () => this.handleDisconnect(client));
    ws.on('error', (error) => {
      console.error(`[WS] Client ${clientId} error:`, error.message);
    });
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(client: ClientConnection, data: any): void {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.action) {
        case 'subscribe':
          this.handleSubscribe(client, message.symbols);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(client, message.symbols);
          break;
        case 'setDelay':
          this.handleSetDelay(client, message.delaySeconds);
          break;
        case 'pong':
          this.handlePong(client);
          break;
        default:
          this.sendError(client, `Unknown action: ${(message as any).action}`);
      }
    } catch (error) {
      console.error(`[WS] Failed to parse message from ${client.id}:`, error);
      this.sendError(client, 'Invalid message format');
    }
  }

  /**
   * Handle subscribe request
   */
  private handleSubscribe(client: ClientConnection, symbols: string[]): void {
    for (const symbol of symbols) {
      client.subscriptions.add(symbol);
    }
    console.log(`[WS] Client ${client.id} subscribed to: ${symbols.join(', ')}`);
    this.sendToClient(client, { type: 'subscribed', symbols });
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(client: ClientConnection, symbols: string[]): void {
    for (const symbol of symbols) {
      client.subscriptions.delete(symbol);
    }
    console.log(`[WS] Client ${client.id} unsubscribed from: ${symbols.join(', ')}`);
    this.sendToClient(client, { type: 'unsubscribed', symbols });
  }

  /**
   * Handle set delay request
   */
  private handleSetDelay(client: ClientConnection, delaySeconds: number): void {
    // Validate delay
    if (delaySeconds < 0 || delaySeconds > LIMITS.maxDelaySeconds) {
      this.sendError(client, `Delay must be between 0 and ${LIMITS.maxDelaySeconds} seconds`);
      return;
    }

    // Check real-time client limit if switching to real-time
    if (delaySeconds === 0 && client.delaySeconds !== 0) {
      const realTimeGroup = this.clientsByDelay.get(0);
      const currentRealTimeCount = realTimeGroup ? realTimeGroup.size : 0;
      
      if (currentRealTimeCount >= LIMITS.maxRealTimeClients) {
        this.sendError(client, `Real-time client limit reached (${LIMITS.maxRealTimeClients}). Please use delayed mode.`);
        return;
      }
    }

    // Remove from old delay group
    this.removeClientFromDelayGroup(client.id, client.delaySeconds);

    // Update client delay
    client.delaySeconds = delaySeconds;
    client.lastSentTimestamp = Date.now() - (delaySeconds * 1000);

    // Add to new delay group
    this.addClientToDelayGroup(client.id, delaySeconds);

    console.log(`[WS] Client ${client.id} set delay to ${delaySeconds}s`);
    this.sendToClient(client, { type: 'delaySet', delaySeconds });
  }

  /**
   * Handle pong response
   */
  private handlePong(client: ClientConnection): void {
    client.isAlive = true;
    client.lastHeartbeat = Date.now();
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(client: ClientConnection): void {
    this.clients.delete(client.id);
    this.removeClientFromDelayGroup(client.id, client.delaySeconds);
    console.log(`[WS] Client disconnected: ${client.id} | Total: ${this.clients.size}`);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: ClientConnection, message: ServerMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message to client
   */
  private sendError(client: ClientConnection, message: string): void {
    this.sendToClient(client, { type: 'error', message });
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const client of this.clients.values()) {
        // Check if client responded to last ping
        if (!client.isAlive) {
          console.warn(`[WS] Client ${client.id} failed heartbeat, closing`);
          client.ws.terminate();
          this.clients.delete(client.id);
          continue;
        }

        // Mark as not alive and send ping
        client.isAlive = false;
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, LIMITS.wsHeartbeatIntervalMs);
  }

  /**
   * Add client to delay group
   */
  private addClientToDelayGroup(clientId: string, delaySeconds: number): void {
    if (!this.clientsByDelay.has(delaySeconds)) {
      this.clientsByDelay.set(delaySeconds, new Set());
    }
    this.clientsByDelay.get(delaySeconds)!.add(clientId);
  }

  /**
   * Remove client from delay group
   */
  private removeClientFromDelayGroup(clientId: string, delaySeconds: number): void {
    const group = this.clientsByDelay.get(delaySeconds);
    if (group) {
      group.delete(clientId);
      if (group.size === 0) {
        this.clientsByDelay.delete(delaySeconds);
      }
    }
  }

  /**
   * Broadcast bar to subscribed clients (real-time only)
   * Delayed clients will receive bars via polling
   */
  broadcastBar(bar: any): void {
    const realTimeGroup = this.clientsByDelay.get(0);
    if (!realTimeGroup || realTimeGroup.size === 0) {
      return; // No real-time clients
    }

    // Broadcast to real-time clients only
    for (const clientId of realTimeGroup) {
      const client = this.clients.get(clientId);
      if (!client) continue;

      // Check if client is subscribed to this symbol or all symbols
      const isSubscribed = client.subscriptions.has('*') || client.subscriptions.has(bar.symbol);
      
      if (isSubscribed) {
        this.sendToClient(client, {
          type: 'bar',
          data: bar,
        });
      }
    }
  }

  /**
   * Get all connected clients
   */
  getClients(): Map<string, ClientConnection> {
    return this.clients;
  }

  /**
   * Get server stats
   */
  getStats(): { totalClients: number; realTimeClients: number; delayedClients: number } {
    let realTimeClients = 0;
    let delayedClients = 0;

    for (const client of this.clients.values()) {
      if (client.delaySeconds === 0) {
        realTimeClients++;
      } else {
        delayedClients++;
      }
    }

    return {
      totalClients: this.clients.size,
      realTimeClients,
      delayedClients,
    };
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.wss) {
      this.wss.close();
    }

    console.log('[WS] Server stopped');
  }
}

export const edgeWSServer = new EdgeWSServer();

