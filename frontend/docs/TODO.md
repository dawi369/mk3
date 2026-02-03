# TODOs

> Consolidated from source code comments

---

## Billing Integration

| Provider | Status | File |
|----------|--------|------|
| Stripe checkout | ⏳ | `lib/billing/billing-service.ts` |
| Stripe portal | ⏳ | `lib/billing/billing-service.ts` |
| Stripe cancel | ⏳ | `lib/billing/billing-service.ts` |
| Stripe resume | ⏳ | `lib/billing/billing-service.ts` |
| LemonSqueezy checkout | ⏳ | `lib/billing/billing-service.ts` |
| LemonSqueezy portal | ⏳ | `lib/billing/billing-service.ts` |
| Paddle checkout | ⏳ | `lib/billing/billing-service.ts` |
| Paddle portal | ⏳ | `lib/billing/billing-service.ts` |

**Billing Page** (`app/(homeAmarketing)/billing/page.tsx`):
- [ ] Load transactions from billing provider
- [ ] Implement checkout flow
- [ ] Implement portal flow
- [ ] Add payment method flow

---

## Email Configuration

- [ ] Update waitlist email `from` with verified domain — `app/(waitlist)/actions.tsx`
- [ ] Update feature-request email with verified domain — `app/api/feature-request/route.ts`

---

## Terminal UI

- [ ] Ticker entry layout for large numbers (55,555.05 +9,999.99) — `components/terminal/views/terminal/ticker-entry.tsx`

---

## Spotlight Search

- [ ] Symbol search mode in spotlight — `components/terminal/layout/spotlight/spotlight.tsx`
- [ ] Open spotlight in symbol search mode from chart — `components/terminal/ticker-modal/chart-toolbar.tsx`

---

## Auth

- [ ] Protect routes from non-logged-in users

---

*Last updated: February 2026*
