# Backend TODO

Items requiring longer-term data (>1-2 days) that are out of scope for initial implementation.

---

## Historical Reference Data

These features require TimescaleDB queries and Redis caching strategy:

| Feature | Data Window | Notes |
|---------|-------------|-------|
| 52-Week High/Low | 1 year | Requires historical bar aggregation |
| Average Volume (5-day) | 5 days | Simple rolling average |
| Average Volume (20-day) | 20 days | For volume surge detection |
| Average True Range (ATR) | 14 days typical | Volatility measure |
| Historical VWAP | N days | Anchored VWAP from specific dates |

### Implementation Approach

1. Calculate in TimescaleDB as scheduled job (not real-time)
2. Cache results in Redis with appropriate TTL
3. Expose via REST endpoint

---

## Per-Exchange Session Handling

Currently using single 2 AM ET reset for all products. Future work:

| Priority | Task |
|----------|------|
| High | Define session times per product code |
| High | Implement session-aware daily reset |
| Medium | Handle mid-day session breaks (grains) |
| Low | Holiday calendar integration |

### Reference: Session Times

```
CME Globex (ES, NQ, GC, SI):
  Sunday 5:00 PM CT - Friday 4:00 PM CT
  Daily break: 4:00 PM - 5:00 PM CT

CBOT Grains (ZC, ZW, ZS):
  Sunday 7:00 PM CT - Friday 1:20 PM CT
  Daily break: 7:45 AM - 8:30 AM CT, 1:20 PM - 7:00 PM CT
```

---

## Open Interest

Polygon provides OI in snapshots but availability varies:
- May be delayed (end of day only)
- Check if real-time OI available for futures tier

---

## Spread Data

For advanced traders:
- Calendar spreads (front vs back month)
- Inter-commodity spreads

---

*Created: February 2026*
