import express from 'express';
import { EDGE_REST_PORT } from '@/config/env.js';
import { barCache } from '@/servers/edge/data/bar_cache.js';
import { edgeRedisClient } from '@/servers/edge/data/redis_client.js';
import { Tickers } from '@/utils/tickers.js';

const app = express();
const tickers = new Tickers();

/**
 * Extract root symbol from contract symbol (e.g., ESZ5 → ES, MGCZ5 → MGC)
 */
function extractRoot(symbol: string): string {
  // Remove last 2-3 characters (month code + year digit, e.g., Z5)
  // Common patterns: ESZ5, NQZ5, MGCZ5, MESZ5
  return symbol.replace(/[A-Z]\d$/, '');
}

/**
 * Determine asset class for a root symbol
 */
function getAssetClass(root: string): string | null {
  if (tickers.hasCode('us_indices', root)) return 'us_indices';
  if (tickers.hasCode('metals', root)) return 'metals';
  if (tickers.hasCode('softs', root)) return 'softs';
  if (tickers.hasCode('grains', root)) return 'grains';
  if (tickers.hasCode('volatiles', root)) return 'volatiles';
  if (tickers.hasCode('currencies', root)) return 'currencies';
  return null;
}

// Health endpoint
app.get('/health', (req, res) => {
  const cacheStats = barCache.getStats();
  
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    cache: cacheStats,
    redis: {
      connected: true, // TODO: Add actual Redis connection check
    },
  });
});

// Get all latest bars
app.get('/bars/latest', (req, res) => {
  const symbols = barCache.getAllSymbols();
  const latest: Record<string, any> = {};
  
  for (const symbol of symbols) {
    const bar = barCache.getLatest(symbol);
    if (bar) {
      latest[symbol] = bar;
    }
  }
  
  res.json(latest);
});

// Get latest bar for specific symbol
app.get('/bars/latest/:symbol', (req, res) => {
  const { symbol } = req.params;
  const bar = barCache.getLatest(symbol);
  
  if (!bar) {
    res.status(404).json({ error: 'Symbol not found' });
    return;
  }
  
  res.json(bar);
});

// Get historical bars for a symbol with optional limit
app.get('/bars/history/:symbol', (req, res) => {
  const { symbol } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  
  const bars = barCache.getBars(symbol, limit);
  
  if (bars.length === 0) {
    res.status(404).json({ error: 'Symbol not found or no bars available' });
    return;
  }
  
  res.json(bars);
});

// Get all symbols
app.get('/symbols', (req, res) => {
  const symbols = barCache.getAllSymbols();
  res.json(symbols);
});

// Get symbols grouped by asset class
app.get('/symbols/grouped', (req, res) => {
  const symbols = barCache.getAllSymbols();
  const grouped: Record<string, string[]> = {};
  
  for (const symbol of symbols) {
    const root = extractRoot(symbol);
    const assetClass = getAssetClass(root);
    
    if (assetClass) {
      if (!grouped[assetClass]) {
        grouped[assetClass] = [];
      }
      grouped[assetClass].push(symbol);
    } else {
      // Unknown asset class, put in "other"
      if (!grouped['other']) {
        grouped['other'] = [];
      }
      grouped['other'].push(symbol);
    }
  }
  
  res.json(grouped);
});

// Get all contracts for a specific root symbol
app.get('/contracts/:root', (req, res) => {
  const { root } = req.params;
  const symbols = barCache.getAllSymbols();
  
  // Filter symbols that match this root
  const contracts = symbols.filter(symbol => extractRoot(symbol) === root);
  
  if (contracts.length === 0) {
    res.status(404).json({ error: `No contracts found for root symbol: ${root}` });
    return;
  }
  
  // Sort contracts by expiration (month code + year)
  // This ensures they appear in chronological order
  const sorted = contracts.sort((a, b) => {
    const aContract = a.slice(-2); // Last 2 chars: e.g., "Z5"
    const bContract = b.slice(-2);
    return aContract.localeCompare(bContract);
  });
  
  res.json({
    root,
    assetClass: getAssetClass(root),
    contracts: sorted,
  });
});

/**
 * Start the Edge REST API server
 */
export function startEdgeRESTApi(): Promise<void> {
  return new Promise((resolve) => {
    app.listen(EDGE_REST_PORT, () => {
      console.log(`Edge REST API listening on port ${EDGE_REST_PORT}`);
      resolve();
    });
  });
}

