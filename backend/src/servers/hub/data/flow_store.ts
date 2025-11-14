// src/data/flow_store.ts
import type { Bar } from "@/utils/general_types.js";

class FlowStore {
  private latest: Map<string, Bar> = new Map();
  private history: Map<string, Bar[]> = new Map();
  private readonly MAX_HISTORY = 100;

  setBar(symbol: string, bar: Bar): void {
    // Update latest
    this.latest.set(symbol, bar);

    // Update history (rolling window)
    if (!this.history.has(symbol)) {
      this.history.set(symbol, []);
    }

    const hist = this.history.get(symbol)!;
    hist.push(bar);

    // Keep only last 100
    if (hist.length > this.MAX_HISTORY) {
      hist.shift();
    }
  }

  getLatest(symbol: string): Bar | undefined {
    return this.latest.get(symbol);
  }

  getAllLatest(): Bar[] {
    return Array.from(this.latest.values());
  }

  getHistory(symbol: string, limit: number = this.MAX_HISTORY): Bar[] {
    const hist = this.history.get(symbol) || [];
    return hist.slice(-limit);
  }

  getSymbols(): string[] {
    return Array.from(this.latest.keys());
  }
}

export const flowStore = new FlowStore();
