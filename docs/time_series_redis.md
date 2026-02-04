# Data Architecture & Symbol Strategy Report

## 1. Symbol Corrections (Immediate Action)
Your current configuration includes expired or delivery-status contracts. Update the following to ensure liquidity:

| Ticker | Old (Expired/Delivery) | New (Active Front Month) | Notes |
| :--- | :--- | :--- | :--- |
| **Crude Oil** | `CLG6` (Feb '26) | **`CLH6` (Mar '26)** | Old contract expired Jan 20. |
| **Brent** | `BZG6` (Feb '26) | **`BZJ6` (Apr '26)** | Expired Dec '25. |
| **Gold** | `GCG6` (Feb '26) | **`GCJ6` (Apr '26)** | Currently in delivery (dangerous). |
| **Hogs** | `HEG6` (Feb '26) | **`HEJ6` (Apr '26)** | Expires ~Feb 13; low liquidity. |

---

## 2. The "7-Day History" Feasibility Study

### The Problem: Raw JSON at 1-Second Resolution
Attempting to store and serve 7 days of 1-second data as raw JSON objects is **not viable**.

* **Data Count:** ~605,000 points per ticker per week.
* **Payload Size:** ~115 MB per ticker (Network/Browser crash risk).
* **Redis RAM:** ~10-12 GB required for 80 tickers (High risk of eviction/OOM).

### The Solution: RedisTimeSeries (Hybrid Architecture)
You are using `redis:8.2-alpine`, which supports the necessary features.

**Architecture Strategy:**
1.  **Real-Time Layer (Hot):** Keep using **Redis Streams** (`market_data`) for the live firehose. Trim this stream aggressively (e.g., keep only last 1 hour).
2.  **History Layer (Cold):** Offload data from the Stream into **RedisTimeSeries** keys.

**Benefits:**
* **Compression:** Uses "Double Delta" encoding. Reduces 200-byte JSON to ~15 bytes.
* **RAM Usage:** Drops from ~12GB to **~1.5GB** for 7 days of history.
* **Performance:** Enables server-side aggregations (Downsampling).

---

## 3. Implementation Plan

### A. Data Structure
Since TimeSeries stores single values, split your OHLCV data into 5 keys per symbol:
* `ts:{symbol}:open`
* `ts:{symbol}:high`
* `ts:{symbol}:low`
* `ts:{symbol}:close`
* `ts:{symbol}:vol`

### B. Downsampling Rules (Crucial)
To prevent browser freezing when users zoom out to 7 days, create automatic compaction rules in Redis.

```bash
# 1. Create Raw Key (7 Day Retention)
TS.CREATE ts:ESH6:close RETENTION 604800000

# 2. Create Downsampled Key (1 Minute Resolution, 30 Day Retention)
TS.CREATE ts:ESH6:close:1m RETENTION 2592000000

# 3. Create Rule (Auto-aggregate)
# When data hits raw key, auto-update the 1m key using the 'last' value
TS.CREATERULE ts:ESH6:close ts:ESH6:close:1m AGGREGATION last 60000