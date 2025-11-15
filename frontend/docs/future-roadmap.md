# Future Roadmap

**Last Updated:** November 15, 2025  
**Status:** Planning Phase  
**Timeline:** 6-12 months post-MVP

---

## Overview

This document outlines future enhancements beyond the core dashboard. These features will transform MK3 from a real-time futures dashboard into a comprehensive trading intelligence platform.

**Three Pillars:**
1. **Historical Intelligence** - TimescaleDB integration for deep historical analysis
2. **AI-Powered Insights** - Machine learning for pattern recognition and predictions
3. **Strategy Validation** - Backtesting engine for strategy development

---

## Phase 1: TimescaleDB Integration

**Goal:** Enable historical data analysis beyond Edge server's cache

**Timeline:** 2-3 months  
**Effort:** ~40-60 hours (backend + frontend)

---

### Backend Changes (Hub Server)

**New Component:** Daily Download Job

```
Daily Job (runs at 3 AM ET)
   ↓
1. Download Polygon flat files (1-min bars for previous day)
   ↓
2. Parse and normalize data
   ↓
3. Bulk insert to TimescaleDB
   ↓
4. Update metadata (last downloaded date)
```

**TimescaleDB Schema:**

```sql
-- Hypertable for bar data
CREATE TABLE bars (
  symbol TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open NUMERIC(12, 4) NOT NULL,
  high NUMERIC(12, 4) NOT NULL,
  low NUMERIC(12, 4) NOT NULL,
  close NUMERIC(12, 4) NOT NULL,
  volume BIGINT NOT NULL,
  PRIMARY KEY (symbol, timestamp)
);

-- Convert to hypertable (time-series optimization)
SELECT create_hypertable('bars', 'timestamp');

-- Indexes for fast queries
CREATE INDEX idx_bars_symbol_timestamp ON bars (symbol, timestamp DESC);
CREATE INDEX idx_bars_timestamp ON bars (timestamp DESC);

-- Compression policy (compress data older than 7 days)
ALTER TABLE bars SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'symbol'
);

SELECT add_compression_policy('bars', INTERVAL '7 days');

-- Retention policy (keep 2 years)
SELECT add_retention_policy('bars', INTERVAL '2 years');
```

---

### Edge Server Changes

**New REST Endpoint:**

```
GET /bars/historical/:symbol
Query params:
  - start: ISO date (YYYY-MM-DD)
  - end: ISO date (YYYY-MM-DD)
  - interval: 1m | 5m | 15m | 1h | 4h | 1d
  - limit: number (default: 10000, max: 100000)

Response: Bar[]
```

**Implementation:**

```typescript
// Edge server queries TimescaleDB
async getHistoricalBars(params: HistoricalQueryParams): Promise<Bar[]> {
  const { symbol, start, end, interval } = params;
  
  // Aggregate query based on interval
  const query = `
    SELECT
      symbol,
      time_bucket($1, timestamp) as timestamp,
      first(open, timestamp) as open,
      max(high) as high,
      min(low) as low,
      last(close, timestamp) as close,
      sum(volume) as volume
    FROM bars
    WHERE symbol = $2
      AND timestamp >= $3
      AND timestamp <= $4
    GROUP BY symbol, time_bucket($1, timestamp)
    ORDER BY timestamp ASC
  `;
  
  return db.query(query, [interval, symbol, start, end]);
}
```

---

### Frontend Changes

**1. Extended Chart Controls**

```tsx
// components/charts/ChartControls.tsx

<ChartControls>
  {/* Existing timeframe selector */}
  <TimeframeSelector onChange={setTimeframe} />
  
  {/* NEW: Date range picker */}
  <DateRangePicker
    onSelect={(start, end) => {
      loadHistoricalData(symbol, start, end, timeframe);
    }}
  />
  
  {/* NEW: Interval selector for historical data */}
  <IntervalSelector
    options={['1m', '5m', '15m', '1h', '4h', '1d']}
    onChange={setInterval}
  />
</ChartControls>
```

**2. Historical Data Service**

```typescript
// lib/api/historical-client.ts

export class HistoricalClient {
  async loadHistoricalBars(
    symbol: string,
    start: Date,
    end: Date,
    interval: Interval
  ): Promise<Bar[]> {
    const response = await fetch(
      `${EDGE_URL}/bars/historical/${symbol}?` +
      `start=${formatDate(start)}&` +
      `end=${formatDate(end)}&` +
      `interval=${interval}`
    );
    
    return response.json();
  }
}
```

**3. Chart Component Updates**

```typescript
// components/charts/FuturesChart.tsx

const FuturesChart = ({ symbol }) => {
  const [historicalMode, setHistoricalMode] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  
  const loadHistorical = async () => {
    if (!dateRange) return;
    
    const bars = await historicalClient.loadHistoricalBars(
      symbol,
      dateRange[0],
      dateRange[1],
      '1m'
    );
    
    // Merge with real-time data
    chartRef.current?.setData([...bars, ...realtimeBars]);
  };
  
  return (
    <div>
      <ChartControls
        onHistoricalToggle={setHistoricalMode}
        onDateRangeSelect={setDateRange}
      />
      <LightweightChart data={bars} />
    </div>
  );
};
```

**4. Browser-Side Caching (IndexedDB)**

```typescript
// lib/cache/historical-cache.ts

// Cache historical data in browser to avoid re-downloading
export class HistoricalCache {
  private db: IDBDatabase;
  
  async store(symbol: string, bars: Bar[]): Promise<void> {
    const tx = this.db.transaction('bars', 'readwrite');
    const store = tx.objectStore('bars');
    
    for (const bar of bars) {
      await store.put({ symbol, ...bar });
    }
  }
  
  async get(
    symbol: string,
    start: Date,
    end: Date
  ): Promise<Bar[] | null> {
    const tx = this.db.transaction('bars', 'readonly');
    const store = tx.objectStore('bars');
    const index = store.index('symbol_timestamp');
    
    const range = IDBKeyRange.bound(
      [symbol, start.getTime()],
      [symbol, end.getTime()]
    );
    
    const results = await index.getAll(range);
    return results.length > 0 ? results : null;
  }
}
```

---

### Use Cases

1. **Long-Term Charts**
   - View 1-year chart with daily bars
   - Compare multiple contracts over time
   - Identify seasonality patterns

2. **Detailed Analysis**
   - Zoom into specific trading sessions
   - Analyze high-volume periods
   - Study roll periods

3. **Performance Tracking**
   - Track contract performance over months
   - Compare contracts (ES vs NQ)
   - Volume profile analysis

---

## Phase 2: AI-Powered Insights

**Goal:** Leverage machine learning for trading intelligence

**Timeline:** 3-4 months  
**Effort:** ~60-80 hours (ML service + frontend)

---

### Architecture

```
┌──────────────────────────────────────┐
│         Frontend UI                  │
│  (Pattern viz, predictions, alerts)  │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│        Edge Server                   │
│  POST /ai/predict                    │
│  POST /ai/detect-patterns            │
│  POST /ai/anomalies                  │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│     ML Service (Python FastAPI)      │
│  - Trained models (TensorFlow/PyTorch)│
│  - Pattern recognition               │
│  - Price prediction                  │
│  - Anomaly detection                 │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       TimescaleDB                    │
│  (Historical data for training)      │
└──────────────────────────────────────┘
```

---

### AI Features

#### 1. Pattern Recognition

**Patterns to Detect:**
- Head and Shoulders
- Triangles (ascending, descending, symmetrical)
- Double Top/Bottom
- Flags and Pennants
- Wedges

**API:**
```typescript
POST /ai/detect-patterns
Body: {
  symbol: "ESZ25",
  lookback: 100,  // bars
  patterns: ["head_shoulders", "triangle", "double_top"]
}

Response: {
  patterns: [
    {
      type: "head_shoulders",
      confidence: 0.85,
      range: { start: timestamp, end: timestamp },
      neckline: 4500.00,
      target: 4480.00,
      status: "forming" | "complete"
    }
  ]
}
```

**Frontend Component:**

```tsx
// features/ai/PatternRecognition.tsx

const PatternRecognition = ({ symbol }) => {
  const patterns = usePatterns(symbol);
  
  return (
    <Card>
      <CardHeader>
        <h3>Pattern Detection</h3>
      </CardHeader>
      
      <CardContent>
        {patterns.map(p => (
          <PatternCard
            pattern={p}
            onChartClick={() => highlightPattern(p)}
          />
        ))}
      </CardContent>
    </Card>
  );
};
```

---

#### 2. Price Prediction

**Model:** LSTM (Long Short-Term Memory) neural network

**Predictions:**
- Next 15 minutes
- Next 1 hour
- Next 4 hours
- Next day

**API:**
```typescript
POST /ai/predict
Body: {
  symbol: "ESZ25",
  horizon: "15m" | "1h" | "4h" | "1d"
}

Response: {
  symbol: "ESZ25",
  currentPrice: 4501.00,
  predictions: [
    { timestamp: 1700000900000, price: 4502.50, confidence: 0.75 },
    { timestamp: 1700001800000, price: 4503.25, confidence: 0.68 },
    { timestamp: 1700002700000, price: 4501.80, confidence: 0.62 }
  ],
  trend: "bullish" | "bearish" | "neutral",
  confidenceInterval: { lower: 4499.00, upper: 4506.00 }
}
```

**Frontend Component:**

```tsx
// features/ai/PricePrediction.tsx

const PricePrediction = ({ symbol }) => {
  const prediction = usePrediction(symbol, '15m');
  
  return (
    <Card>
      <CardHeader>
        <h3>Price Prediction (15min)</h3>
      </CardHeader>
      
      <CardContent>
        <PredictionGauge
          current={prediction.currentPrice}
          predicted={prediction.predictions[0].price}
          confidence={prediction.predictions[0].confidence}
        />
        
        <TrendIndicator trend={prediction.trend} />
        
        {/* Overlay predictions on chart */}
        <PredictionChart
          predictions={prediction.predictions}
          confidenceInterval={prediction.confidenceInterval}
        />
      </CardContent>
    </Card>
  );
};
```

---

#### 3. Anomaly Detection

**Anomalies to Detect:**
- Unusual volume spikes (>3 std dev)
- Rapid price movements (flash crashes/spikes)
- Order flow imbalances
- Volatility explosions

**API:**
```typescript
POST /ai/anomalies
Body: {
  symbols: ["ESZ25", "NQZ25"],
  lookback: 60  // minutes
}

Response: {
  anomalies: [
    {
      symbol: "ESZ25",
      type: "volume_spike",
      timestamp: 1700000000000,
      severity: "high" | "medium" | "low",
      value: 125000,
      expected: 35000,
      stdDev: 3.5,
      message: "Volume 3.5x above normal"
    }
  ]
}
```

**Frontend Component:**

```tsx
// features/ai/AnomalyAlert.tsx

const AnomalyAlert = () => {
  const anomalies = useAnomalies();
  
  return (
    <div className="fixed top-4 right-4 z-50">
      {anomalies.map(a => (
        <Toast key={a.timestamp} variant={a.severity}>
          <div className="flex items-center gap-3">
            <AlertTriangle />
            <div>
              <strong>{a.symbol}</strong>
              <p>{a.message}</p>
            </div>
          </div>
        </Toast>
      ))}
    </div>
  );
};
```

---

#### 4. Smart Alerts

**Intelligent alert triggers based on ML:**

- **Pattern completion**: "Head & shoulders complete on ES"
- **Prediction threshold**: "ES predicted to hit 4550 in 1 hour (85% confidence)"
- **Anomaly detection**: "Unusual volume spike on NQ"
- **Correlation break**: "ES/NQ correlation breakdown detected"

**API:**
```typescript
POST /ai/alerts/create
Body: {
  type: "pattern_complete" | "prediction" | "anomaly",
  symbol: "ESZ25",
  conditions: {
    pattern: "head_shoulders",
    minConfidence: 0.8
  }
}

Response: {
  alertId: "uuid",
  active: true
}

// Receive via WebSocket
{
  "type": "ai_alert",
  "data": {
    "alertId": "uuid",
    "symbol": "ESZ25",
    "message": "Head & shoulders pattern complete",
    "action": "Consider short position",
    "confidence": 0.85
  }
}
```

---

### ML Service Implementation

**Tech Stack:**
- **Framework:** Python FastAPI
- **ML Libraries:** TensorFlow / PyTorch
- **Models:** LSTM for predictions, CNN for pattern recognition
- **Training:** Scheduled retraining with latest data

**Example Service:**

```python
# ml_service/main.py

from fastapi import FastAPI
from models import PatternDetector, PricePredictor, AnomalyDetector

app = FastAPI()

pattern_detector = PatternDetector.load_model('models/patterns.h5')
price_predictor = PricePredictor.load_model('models/predictor.h5')

@app.post('/detect-patterns')
async def detect_patterns(request: PatternRequest):
    # Load historical bars
    bars = await get_bars(request.symbol, request.lookback)
    
    # Run pattern detection
    patterns = pattern_detector.detect(bars, request.patterns)
    
    return {'patterns': patterns}

@app.post('/predict')
async def predict(request: PredictRequest):
    bars = await get_bars(request.symbol, 500)
    prediction = price_predictor.predict(bars, request.horizon)
    
    return prediction
```

---

## Phase 3: Backtesting Engine

**Goal:** Test trading strategies against historical data

**Timeline:** 2-3 months  
**Effort:** ~50-70 hours

---

### Architecture

```
┌──────────────────────────────────────┐
│    Frontend Strategy Builder         │
│  (Visual rule builder, code editor)  │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│      Edge Server                     │
│  POST /backtest/run                  │
│  GET  /backtest/results/:id          │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│   Backtest Engine (Python)           │
│  - Strategy execution                │
│  - Position management               │
│  - PnL calculation                   │
│  - Risk metrics                      │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       TimescaleDB                    │
│  (Historical bars for simulation)    │
└──────────────────────────────────────┘
```

---

### Features

#### 1. Strategy Builder

**Visual Rule Builder:**

```tsx
// features/backtest/StrategyBuilder.tsx

const StrategyBuilder = () => {
  return (
    <div className="strategy-builder">
      <h2>Build Trading Strategy</h2>
      
      {/* Entry Rules */}
      <RuleGroup label="Entry Conditions">
        <Rule>
          <Select value="indicator">
            <option>RSI</option>
            <option>MACD</option>
            <option>Price</option>
          </Select>
          
          <Select value="operator">
            <option>crosses above</option>
            <option>crosses below</option>
            <option>greater than</option>
            <option>less than</option>
          </Select>
          
          <Input type="number" value={30} />
        </Rule>
        
        <Button onClick={addRule}>+ Add Rule</Button>
      </RuleGroup>
      
      {/* Exit Rules */}
      <RuleGroup label="Exit Conditions">
        <Rule>
          Price moves 10 points in profit
        </Rule>
        <Rule>
          Stop loss: 5 points
        </Rule>
      </RuleGroup>
      
      {/* Position Sizing */}
      <PositionSizing>
        <Input label="Contracts" value={1} />
        <Input label="Max Risk %" value={2} />
      </PositionSizing>
      
      <Button onClick={runBacktest}>Run Backtest</Button>
    </div>
  );
};
```

**Code Editor (Advanced):**

```tsx
// Alternative: Code-based strategy
<CodeEditor
  language="python"
  defaultValue={`
def strategy(bar, position):
    # Calculate RSI
    rsi = calculate_rsi(bars, 14)
    
    # Entry logic
    if rsi < 30 and position is None:
        return 'buy', 1  # Buy 1 contract
    
    # Exit logic
    if position and (profit > 10 or loss > 5):
        return 'sell', position.contracts
    
    return 'hold', 0
  `}
/>
```

---

#### 2. Backtest Execution

**API:**

```typescript
POST /backtest/run
Body: {
  symbol: "ESZ25",
  strategy: {
    entry: [
      { indicator: "rsi", operator: "<", value: 30 },
      { indicator: "macd", operator: "cross_above", value: 0 }
    ],
    exit: [
      { type: "profit_target", value: 10 },
      { type: "stop_loss", value: 5 }
    ],
    position: { contracts: 1, maxRisk: 2 }
  },
  period: {
    start: "2024-01-01",
    end: "2024-12-31"
  },
  interval: "1m"
}

Response: {
  backtestId: "uuid",
  status: "running"
}

// Poll for results
GET /backtest/results/:id

Response: {
  status: "complete",
  results: {
    totalTrades: 250,
    winningTrades: 152,
    losingTrades: 98,
    winRate: 60.8,
    totalPnL: 12500.00,
    maxDrawdown: 2150.00,
    sharpeRatio: 1.85,
    profitFactor: 2.1,
    avgWin: 125.00,
    avgLoss: 87.50,
    largestWin: 450.00,
    largestLoss: 280.00,
    trades: [ /* Trade list */ ],
    equityCurve: [ /* Equity over time */ ]
  }
}
```

---

#### 3. Results Visualization

**Equity Curve:**

```tsx
// features/backtest/EquityCurve.tsx

const EquityCurve = ({ equity }) => {
  return (
    <Card>
      <CardHeader>
        <h3>Equity Curve</h3>
      </CardHeader>
      
      <CardContent>
        <LineChart
          data={equity}
          xAxis="timestamp"
          yAxis="equity"
          color="green"
          height={400}
        />
      </CardContent>
    </Card>
  );
};
```

**Performance Metrics:**

```tsx
// features/backtest/MetricsGrid.tsx

const MetricsGrid = ({ results }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        label="Total PnL"
        value={formatCurrency(results.totalPnL)}
        trend={results.totalPnL > 0 ? 'up' : 'down'}
      />
      
      <MetricCard
        label="Win Rate"
        value={formatPercent(results.winRate)}
      />
      
      <MetricCard
        label="Sharpe Ratio"
        value={results.sharpeRatio.toFixed(2)}
      />
      
      <MetricCard
        label="Max Drawdown"
        value={formatCurrency(results.maxDrawdown)}
        variant="danger"
      />
      
      {/* More metrics... */}
    </div>
  );
};
```

**Trade List:**

```tsx
// features/backtest/TradeList.tsx

const TradeList = ({ trades }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Entry</TableHead>
          <TableHead>Exit</TableHead>
          <TableHead>PnL</TableHead>
        </TableRow>
      </TableHeader>
      
      <TableBody>
        {trades.map(trade => (
          <TableRow key={trade.id}>
            <TableCell>{formatDate(trade.entryTime)}</TableCell>
            <TableCell>
              <Badge variant={trade.type === 'long' ? 'success' : 'danger'}>
                {trade.type}
              </Badge>
            </TableCell>
            <TableCell>{trade.entryPrice}</TableCell>
            <TableCell>{trade.exitPrice}</TableCell>
            <TableCell className={trade.pnl > 0 ? 'text-green' : 'text-red'}>
              {formatCurrency(trade.pnl)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

---

### Backtest Engine Implementation

```python
# backtest_engine/engine.py

class BacktestEngine:
    def __init__(self, strategy, data, config):
        self.strategy = strategy
        self.data = data  # Historical bars
        self.config = config
        self.position = None
        self.trades = []
        self.equity = []
        
    def run(self):
        equity = self.config.initial_capital
        
        for bar in self.data:
            # Update indicators
            self.update_indicators(bar)
            
            # Execute strategy
            signal = self.strategy.execute(bar, self.position)
            
            # Handle signal
            if signal == 'buy' and self.position is None:
                self.open_position('long', bar)
            elif signal == 'sell' and self.position is not None:
                self.close_position(bar)
            
            # Update equity
            if self.position:
                unrealized_pnl = self.calculate_unrealized_pnl(bar)
                equity = self.config.initial_capital + unrealized_pnl
            
            self.equity.append({'timestamp': bar.timestamp, 'equity': equity})
        
        return self.calculate_results()
    
    def calculate_results(self):
        winning_trades = [t for t in self.trades if t.pnl > 0]
        losing_trades = [t for t in self.trades if t.pnl < 0]
        
        return {
            'totalTrades': len(self.trades),
            'winningTrades': len(winning_trades),
            'losingTrades': len(losing_trades),
            'winRate': len(winning_trades) / len(self.trades) * 100,
            'totalPnL': sum(t.pnl for t in self.trades),
            'maxDrawdown': self.calculate_max_drawdown(),
            'sharpeRatio': self.calculate_sharpe_ratio(),
            # ... more metrics
        }
```

---

## Implementation Priority

### Phase 1: Core MVP (Current)
**Timeline:** Weeks 1-8
- Dashboard with real-time data
- Sentiment indicators
- Technical indicators
- Basic charting with lightweight-charts

### Phase 2: TimescaleDB (Short-term)
**Timeline:** Months 3-5
- Historical data storage
- Extended chart timeframes
- Volume profile analysis

### Phase 3: AI Features (Medium-term)
**Timeline:** Months 6-9
- Pattern recognition
- Price predictions
- Anomaly detection
- Smart alerts

### Phase 4: Backtesting (Long-term)
**Timeline:** Months 10-12
- Strategy builder
- Backtest engine
- Performance analytics

---

## Success Metrics

### TimescaleDB Integration
- ✅ Load 1 year of 1-min bars in < 3 seconds
- ✅ Chart rendering smooth with 10,000+ bars
- ✅ Compression reduces storage by 70%+

### AI Features
- ✅ Pattern detection accuracy > 75%
- ✅ Price prediction mean absolute error < 5 points
- ✅ Anomaly detection false positive rate < 10%

### Backtesting
- ✅ Execute 1-year backtest in < 30 seconds
- ✅ Support 1000+ trades
- ✅ Accurate slippage and commission modeling

---

*The future is intelligent. The future is MK3.*

