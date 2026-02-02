### 2. The Backend Spec (`REDIS_ARCH.md`)

```markdown
# Redis Architecture: Live Ticker Snapshots

## 1. Objective
To provide "O(1)" access to the current session state of a ticker without recalculating histories on every page load.

## 2. Key Space Design
We introduce a new **Hash** layer alongside the existing Stream/List.

### Key Naming Convention
`ticker:snapshot:{SYMBOL}`
* Example: `ticker:snapshot:ESH6`

### Hash Fields
| Field | Type | Description | Source |
| :--- | :--- | :--- | :--- |
| `last_price` | Float | Most recent trade price. | `bar.close` |
| `session_open` | Float | Price of the *first* bar of the session. | First `bar.open` |
| `session_high` | Float | Highest price reached today. | `max(stored_high, bar.high)` |
| `session_low` | Float | Lowest price reached today. | `min(stored_low, bar.low)` |
| `cum_volume` | Int | Total volume traded today. | `stored_vol + bar.volume` |
| `prev_close` | Float | Yesterday's settlement price. | *External (Static)* |
| `last_updated` | Timestamp | Time of last update. | `bar.endTime` |

---

## 3. Worker Logic (The Aggregator)
The Redis Worker processes the incoming 1-second bar stream (`bar`).

**On every incoming `bar`:**

1.  **Retrieve Current Snapshot:**
    * `HMGET ticker:snapshot:ESH6 session_high session_low cum_volume`

2.  **Calculate New State:**
    * `new_high = max(current_snapshot.session_high, bar.high)`
    * `new_low = min(current_snapshot.session_low, bar.low)`
    * `new_vol = current_snapshot.cum_volume + bar.volume`

3.  **Atomic Update (HSET):**
    ```redis
    HSET ticker:snapshot:ESH6
      last_price {bar.close}
      session_high {new_high}
      session_low {new_low}
      cum_volume {new_vol}
      last_updated {bar.endTime}
    ```

4.  **Session Start Logic (Edge Case):**
    * If `ticker:snapshot:ESH6` does not exist (TTL expired or fresh day):
        * `session_open` = `bar.open`
        * `session_high` = `bar.high`
        * `session_low` = `bar.low`
        * `cum_volume` = `bar.volume`
        * `prev_close` = *Fetch from Historical DB*

---

## 4. Persistence & Cleanup
* **TTL Strategy:** Set a TTL of **48 Hours** (172800 seconds) on the Snapshot Key every time it updates.
    * *Why:* Ensures the snapshot survives the weekend but auto-cleans old contracts if data stops flowing.
    * `EXPIRE ticker:snapshot:ESH6 172800`