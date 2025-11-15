# Edge Server Integration

**Last Updated:** November 15, 2025  
**Edge Server:** Port 3020 (REST), 3021 (WebSocket)  
**Protocol Version:** 1.0

---

## Overview

The Edge server is the frontend's gateway to real-time futures market data. It provides:

1. **REST API** - Initial data loading, configuration, historical queries
2. **WebSocket** - Real-time bar streaming, subscriptions
3. **Bar Cache** - Recent bars (up to 10,000 per symbol)
4. **Contract Metadata** - Symbol grouping, front month detection

**Data Flow:**
```
Hub Server (Polygon WS)
   ↓
Redis Pub/Sub
   ↓
Edge Server
   ├─ REST API (HTTP)
   └─ WebSocket (WS)
       ↓
Frontend Application
```

---

## REST API

**Base URL:** `http://localhost:3020`  
**Content-Type:** `application/json`

### Health & Monitoring

#### GET /health

**Purpose:** Check Edge server status, cache statistics

**Request:**
```bash
curl http://localhost:3020/health | jq
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 123456,
  "cache": {
    "symbols": 10,
    "totalBars": 5420
  },
  "redis": {
    "connected": true
  },
  "hubConnected": true
}
```

**Response Fields:**
- `status` - "ok" or "error"
- `uptime` - Server uptime in seconds
- `cache.symbols` - Number of symbols in cache
- `cache.totalBars` - Total bars across all symbols
- `redis.connected` - Redis connection status
- `hubConnected` - Whether Hub is publishing data

**Usage:**
```typescript
// Check on app load
const health = await edgeClient.getHealth();
if (health.status !== 'ok') {
  showError('Edge server unavailable');
}

// Periodic health check (every 30s)
setInterval(async () => {
  const health = await edgeClient.getHealth();
  connectionStore.setStatus(health.status);
}, 30000);
```

---

### Bar Queries

#### GET /bars/latest

**Purpose:** Get latest bar for all symbols

**Request:**
```bash
curl http://localhost:3020/bars/latest | jq
```

**Response:**
```json
{
  "ESZ25": {
    "symbol": "ESZ25",
    "timestamp": 1700000000000,
    "open": 4500.25,
    "high": 4502.50,
    "low": 4499.75,
    "close": 4501.00,
    "volume": 1250
  },
  "NQZ25": {
    "symbol": "NQZ25",
    "timestamp": 1700000000000,
    "open": 15500.50,
    "high": 15510.00,
    "low": 15495.25,
    "close": 15505.75,
    "volume": 890
  }
}
```

**Usage:**
```typescript
// Load initial snapshot on app mount
const bars = await edgeClient.getLatestBars();
dashboardStore.setBars(bars);
```

---

#### GET /bars/latest/:symbol

**Purpose:** Get latest bar for specific symbol

**Request:**
```bash
curl http://localhost:3020/bars/latest/ESZ25 | jq
```

**Response:**
```json
{
  "symbol": "ESZ25",
  "timestamp": 1700000000000,
  "open": 4500.25,
  "high": 4502.50,
  "low": 4499.75,
  "close": 4501.00,
  "volume": 1250
}
```

**Error (symbol not found):**
```json
null
```

**Usage:**
```typescript
// Fetch specific symbol on demand
const bar = await edgeClient.getLatestBar('ESZ25');
if (bar) {
  dashboardStore.updateBar('ESZ25', bar);
}
```

---

#### GET /bars/history/:symbol

**Purpose:** Get historical bars for symbol (from cache)

**Query Parameters:**
- `limit` - Number of bars (default: 100, max: 10000)

**Request:**
```bash
curl "http://localhost:3020/bars/history/ESZ25?limit=100" | jq
```

**Response:**
```json
[
  {
    "symbol": "ESZ25",
    "timestamp": 1700000000000,
    "open": 4500.25,
    "high": 4502.50,
    "low": 4499.75,
    "close": 4501.00,
    "volume": 1250
  },
  {
    "symbol": "ESZ25",
    "timestamp": 1700000001000,
    "open": 4501.00,
    "high": 4503.25,
    "low": 4500.50,
    "close": 4502.75,
    "volume": 980
  }
]
```

**Usage:**
```typescript
// Load chart history
const history = await edgeClient.getBarHistory('ESZ25', 500);
chartStore.setHistory('ESZ25', history);
```

---

### Symbol Queries

#### GET /symbols

**Purpose:** Get list of all available symbols

**Request:**
```bash
curl http://localhost:3020/symbols | jq
```

**Response:**
```json
[
  "ESZ25",
  "NQZ25",
  "YMZ25",
  "RTYZ25",
  "GCZ25",
  "SIZ25",
  "HGZ25"
]
```

**Usage:**
```typescript
// Load available symbols
const symbols = await edgeClient.getSymbols();
dashboardStore.setSymbols(symbols);
```

---

#### GET /symbols/grouped

**Purpose:** Get symbols grouped by asset class

**Request:**
```bash
curl http://localhost:3002/symbols/grouped | jq
```

**Response:**
```json
{
  "us_indices": ["ESZ25", "NQZ25", "YMZ25", "RTYZ25"],
  "metals": ["GCZ25", "SIZ25", "HGZ25", "PLZ25", "PAZ25", "MGCZ25"]
}
```

**Usage:**
```typescript
// Organize dashboard by asset class
const grouped = await edgeClient.getSymbolsGrouped();
dashboardStore.setSymbolsByAssetClass(grouped);

// Render sections
Object.entries(grouped).map(([assetClass, symbols]) => (
  <AssetClassSection title={assetClass} symbols={symbols} />
));
```

---

### Contract Queries

#### GET /contracts/:root

**Purpose:** Get all contracts for a root symbol (e.g., ES → ESZ25, ESH26, etc.)

**Request:**
```bash
curl http://localhost:3020/contracts/ES | jq
```

**Response:**
```json
{
  "root": "ES",
  "assetClass": "us_indices",
  "contracts": [
    {
      "symbol": "ESZ25",
      "month": "Z",
      "year": 2025,
      "isFrontMonth": true
    },
    {
      "symbol": "ESH26",
      "month": "H",
      "year": 2026,
      "isFrontMonth": false
    },
    {
      "symbol": "ESM26",
      "month": "M",
      "year": 2026,
      "isFrontMonth": false
    },
    {
      "symbol": "ESU26",
      "month": "U",
      "year": 2026,
      "isFrontMonth": false
    }
  ]
}
```

**Month Codes:**
- H = March
- M = June
- U = September
- Z = December

**Usage:**
```typescript
// Contract selector dropdown
const contracts = await edgeClient.getContracts('ES');

<ContractSelector>
  {contracts.contracts.map(c => (
    <option value={c.symbol} key={c.symbol}>
      {c.symbol} {c.isFrontMonth ? '(Front Month)' : ''}
    </option>
  ))}
</ContractSelector>
```

---

## WebSocket Protocol

**URL:** `ws://localhost:3021`  
**Protocol:** JSON messages

### Connection Flow

```
1. Client connects to ws://localhost:3021
   ↓
2. Server validates connection (auth placeholder)
   ↓
3. Server sends welcome message
   ↓
4. Client subscribes to symbols
   ↓
5. Server starts sending bars
   ↓
6. Heartbeat ping/pong every 30s
   ↓
7. Client disconnects or server closes
```

---

### Client → Server Messages

#### Subscribe to Symbols

**Purpose:** Start receiving bars for specific symbols

**Message:**
```json
{
  "action": "subscribe",
  "symbols": ["ESZ25", "NQZ25", "YMZ25"]
}
```

**Subscribe to All:**
```json
{
  "action": "subscribe",
  "symbols": ["*"]
}
```

**Response:**
```json
{
  "type": "status",
  "connected": true,
  "subscriptions": ["ESZ25", "NQZ25", "YMZ25"]
}
```

**Usage:**
```typescript
// Subscribe on connection
wsClient.onOpen(() => {
  wsClient.subscribe(['*']); // All symbols
});

// Or selective
wsClient.subscribe(['ESZ25', 'NQZ25']);
```

---

#### Unsubscribe from Symbols

**Purpose:** Stop receiving bars for symbols

**Message:**
```json
{
  "action": "unsubscribe",
  "symbols": ["YMZ25"]
}
```

**Response:**
```json
{
  "type": "status",
  "connected": true,
  "subscriptions": ["ESZ25", "NQZ25"]
}
```

**Usage:**
```typescript
// User closes a chart
wsClient.unsubscribe(['YMZ25']);
```

---

#### Set Delay

**Purpose:** Configure time delay for data (demo/testing)

**Message:**
```json
{
  "action": "setDelay",
  "delaySeconds": 900
}
```

**Values:**
- `0` - Real-time (default)
- `900` - 15-minute delay
- `3600` - 1-hour delay

**Response:**
```json
{
  "type": "status",
  "connected": true,
  "delaySeconds": 900
}
```

**Usage:**
```typescript
// For demo mode
wsClient.setDelay(900); // 15-min delayed data
```

---

#### Heartbeat Response

**Purpose:** Respond to server ping

**Message:**
```json
{
  "action": "pong"
}
```

**Usage:**
```typescript
// Automatic in client implementation
wsClient.onPing(() => {
  wsClient.send({ action: 'pong' });
});
```

---

### Server → Client Messages

#### Welcome Message

**Purpose:** Confirm connection established

**Message:**
```json
{
  "type": "welcome",
  "clientId": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Connected to Edge WebSocket server",
  "serverTime": 1700000000000
}
```

**Usage:**
```typescript
wsClient.onWelcome((data) => {
  console.log(`Connected: ${data.clientId}`);
  connectionStore.setConnected(true);
});
```

---

#### Bar Update

**Purpose:** Real-time bar data

**Message:**
```json
{
  "type": "bar",
  "data": {
    "symbol": "ESZ25",
    "timestamp": 1700000000000,
    "open": 4500.25,
    "high": 4502.50,
    "low": 4499.75,
    "close": 4501.00,
    "volume": 1250
  }
}
```

**Frequency:** ~1 per second per symbol during market hours

**Usage:**
```typescript
wsClient.onBar((bar) => {
  // Update store
  dashboardStore.updateBar(bar.symbol, bar);
  
  // Update chart
  chartManager.updateBar(bar.symbol, bar);
  
  // Recalculate indicators
  indicatorsStore.recalculate(bar.symbol, bar);
});
```

---

#### Status Update

**Purpose:** Connection status, subscription changes

**Message:**
```json
{
  "type": "status",
  "connected": true,
  "subscriptions": ["ESZ25", "NQZ25"],
  "delaySeconds": 0
}
```

**Usage:**
```typescript
wsClient.onStatus((status) => {
  connectionStore.setStatus(status);
});
```

---

#### Error Message

**Purpose:** Error notifications

**Message:**
```json
{
  "type": "error",
  "message": "Symbol not found: INVALID",
  "code": "SYMBOL_NOT_FOUND"
}
```

**Error Codes:**
- `SYMBOL_NOT_FOUND` - Requested symbol doesn't exist
- `MAX_SUBSCRIPTIONS_EXCEEDED` - Too many symbols subscribed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AUTHENTICATION_FAILED` - Auth error (future)

**Usage:**
```typescript
wsClient.onError((error) => {
  console.error(`WebSocket error: ${error.message}`);
  toast.error(error.message);
});
```

---

#### Heartbeat Ping

**Purpose:** Keep connection alive, detect stale connections

**Message:**
```json
{
  "type": "ping"
}
```

**Expected Response:** Client sends `{ "action": "pong" }`

**Interval:** Every 30 seconds

**Usage:**
```typescript
// Handled automatically by client
wsClient.onPing(() => {
  wsClient.send({ action: 'pong' });
  connectionStore.setLastHeartbeat(Date.now());
});
```

---

## Client Implementation

### REST Client

```typescript
// lib/api/edge-client.ts

interface EdgeClientConfig {
  baseUrl: string;
  timeout?: number;
}

export class EdgeClient {
  private baseUrl: string;
  private timeout: number;
  
  constructor(config: EdgeClientConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:3020';
    this.timeout = config.timeout || 5000;
  }
  
  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`, {
      signal: AbortSignal.timeout(this.timeout),
    });
    return response.json();
  }
  
  async getLatestBars(): Promise<BarMap> {
    const response = await fetch(`${this.baseUrl}/bars/latest`);
    return response.json();
  }
  
  async getLatestBar(symbol: string): Promise<Bar | null> {
    const response = await fetch(`${this.baseUrl}/bars/latest/${symbol}`);
    return response.json();
  }
  
  async getBarHistory(
    symbol: string,
    limit: number = 100
  ): Promise<Bar[]> {
    const response = await fetch(
      `${this.baseUrl}/bars/history/${symbol}?limit=${limit}`
    );
    return response.json();
  }
  
  async getSymbols(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/symbols`);
    return response.json();
  }
  
  async getSymbolsGrouped(): Promise<GroupedSymbols> {
    const response = await fetch(`${this.baseUrl}/symbols/grouped`);
    return response.json();
  }
  
  async getContracts(root: string): Promise<ContractGroup> {
    const response = await fetch(`${this.baseUrl}/contracts/${root}`);
    return response.json();
  }
}

// Usage
export const edgeClient = new EdgeClient({
  baseUrl: process.env.NEXT_PUBLIC_EDGE_REST_URL,
  timeout: 5000,
});
```

---

### WebSocket Client

```typescript
// lib/api/websocket-client.ts

type MessageHandler = (data: any) => void;

interface WSClientConfig {
  url: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export class EdgeWSClient {
  private ws: WebSocket | null = null;
  private config: WSClientConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private subscriptions: string[] = [];
  
  constructor(config: WSClientConfig) {
    this.config = {
      reconnect: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.reconnectAttempts = 0;
        this.emit('open', null);
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
      
      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        this.emit('error', error);
      };
      
      this.ws.onclose = () => {
        console.log('[WS] Disconnected');
        this.emit('close', null);
        this.handleReconnect();
      };
    });
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  subscribe(symbols: string[]): void {
    this.subscriptions = symbols;
    this.send({ action: 'subscribe', symbols });
  }
  
  unsubscribe(symbols: string[]): void {
    this.subscriptions = this.subscriptions.filter(
      s => !symbols.includes(s)
    );
    this.send({ action: 'unsubscribe', symbols });
  }
  
  setDelay(seconds: number): void {
    this.send({ action: 'setDelay', delaySeconds: seconds });
  }
  
  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  on(event: string, handler: MessageHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }
  
  private emit(event: string, data: any): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(h => h(data));
  }
  
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'welcome':
        this.emit('welcome', message);
        break;
      case 'bar':
        this.emit('bar', message.data);
        break;
      case 'status':
        this.emit('status', message);
        break;
      case 'error':
        this.emit('error', message);
        break;
      case 'ping':
        this.send({ action: 'pong' });
        this.emit('ping', null);
        break;
    }
  }
  
  private handleReconnect(): void {
    if (!this.config.reconnect) return;
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('[WS] Max reconnect attempts reached');
      return;
    }
    
    const delay = this.config.reconnectDelay! * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().then(() => {
        // Restore subscriptions
        if (this.subscriptions.length > 0) {
          this.subscribe(this.subscriptions);
        }
      });
    }, delay);
  }
}

// Usage
export const wsClient = new EdgeWSClient({
  url: process.env.NEXT_PUBLIC_EDGE_WS_URL || 'ws://localhost:3020',
  reconnect: true,
  reconnectDelay: 1000,
  maxReconnectAttempts: 10,
});
```

---

## Integration Pattern

### App Initialization

```typescript
// app/main/page.tsx

export default function MainPage() {
  useEffect(() => {
    async function initialize() {
      try {
        // 1. Check Edge server health
        const health = await edgeClient.getHealth();
        if (health.status !== 'ok') {
          throw new Error('Edge server unavailable');
        }
        
        // 2. Load initial data
        const [bars, grouped] = await Promise.all([
          edgeClient.getLatestBars(),
          edgeClient.getSymbolsGrouped(),
        ]);
        
        // 3. Update stores
        dashboardStore.setBars(bars);
        dashboardStore.setSymbolsByAssetClass(grouped);
        
        // 4. Connect WebSocket
        await wsClient.connect();
        
        // 5. Subscribe to all symbols
        wsClient.subscribe(['*']);
        
        // 6. Setup handlers
        wsClient.on('bar', (bar) => {
          dashboardStore.updateBar(bar.symbol, bar);
          indicatorsStore.recalculate(bar.symbol, bar);
        });
        
        wsClient.on('error', (error) => {
          toast.error(`Connection error: ${error.message}`);
        });
        
        wsClient.on('close', () => {
          connectionStore.setConnected(false);
        });
        
      } catch (error) {
        console.error('Initialization failed:', error);
        toast.error('Failed to connect to market data');
      }
    }
    
    initialize();
    
    return () => {
      wsClient.disconnect();
    };
  }, []);
  
  return <MainDashboard />;
}
```

---

## Error Handling

### Connection Errors

```typescript
// Handle REST errors
try {
  const bars = await edgeClient.getLatestBars();
} catch (error) {
  if (error.name === 'AbortError') {
    toast.error('Request timed out');
  } else if (error.message.includes('fetch')) {
    toast.error('Cannot reach Edge server');
  } else {
    toast.error('Failed to load data');
  }
}

// Handle WebSocket errors
wsClient.on('error', (error) => {
  connectionStore.setError(error.message);
  
  if (error.code === 'SYMBOL_NOT_FOUND') {
    toast.warning(`Symbol not available: ${error.symbol}`);
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    toast.error('Too many requests. Please slow down.');
  } else {
    toast.error('Connection error occurred');
  }
});
```

---

## Future Enhancements

### TimescaleDB Historical Data

**New Endpoint (Future):**
```
GET /bars/historical/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD&interval=1m

Response: Bar[]
```

**Usage:**
```typescript
// Load historical data for chart
const historical = await edgeClient.getHistoricalBars(
  'ESZ25',
  { start: '2025-01-01', end: '2025-01-15', interval: '1m' }
);
```

### Authentication

**JWT Token (Future):**
```typescript
// Login
const token = await auth.login(email, password);

// Include in requests
const response = await fetch('/bars/latest', {
  headers: { 'Authorization': `Bearer ${token}` },
});

// WebSocket with auth
const ws = new WebSocket('ws://localhost:3003', {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

---

## Testing

### REST API Tests

```bash
# Health check
curl http://localhost:3020/health | jq

# Latest bars
curl http://localhost:3020/bars/latest | jq

# Symbol list
curl http://localhost:3020/symbols | jq

# Contracts
curl http://localhost:3020/contracts/ES | jq
```

### WebSocket Tests

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3021

# Subscribe to all
> {"action":"subscribe","symbols":["*"]}

# Watch bars flow
< {"type":"bar","data":{"symbol":"ESZ25","close":4501.25,...}}
```

---

*Built for performance. Designed for reliability.*

