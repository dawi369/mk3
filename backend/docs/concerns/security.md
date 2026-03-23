# Security Concerns

## Current State

- Public market-data endpoints are open.
- Admin endpoints are protected only by `HUB_API_KEY`.
- Redis is treated as trusted internal infrastructure.

## Risks

- API-key-only admin protection is sufficient for local/internal use but weak for broader deployment.
- Public endpoints may expose more backend state than intended once the product matures.
- There is no user-scoped access control for subscription-specific or plan-specific data.

## Deferred Work

- introduce JWT or equivalent user authentication
- separate internal operator endpoints from public data endpoints
- tighten CORS policy for production deployment
- define rate-limiting and abuse controls
- define secrets rotation and environment-management expectations

## Recommendation

Before broader production exposure, treat auth hardening as required work, not cleanup.
