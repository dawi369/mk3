# Railway Setup

This repo is set up as a Railway monorepo with two app services:

- `frontend` from `/frontend`
- `backend` from `/backend`

You should also add one Railway Redis service in the same environment.

## Recommended Project Layout

Create one Railway project with these services:

1. `mk3-frontend`
2. `mk3-backend`
3. `mk3-redis`

Set the root directories:

- frontend service root directory: `/frontend`
- backend service root directory: `/backend`

Both app services already include service-local config:

- [frontend/railway.toml](/Users/dawi/dev/mk3/frontend/railway.toml)
- [backend/railway.toml](/Users/dawi/dev/mk3/backend/railway.toml)

Railway does not support creating the whole project graph declaratively via a repo-wide `railway.toml`. Use the bootstrap helper instead:

- [scripts/bootstrap-railway.sh](/Users/dawi/dev/mk3/scripts/bootstrap-railway.sh)

## Networking

Expose these publicly:

- `mk3-frontend`
- `mk3-backend`

Keep Redis private only.

Inside Railway private networking, services can talk to each other using Railway internal DNS. Use the backend's public domain for browser traffic, and use the Redis private URL or host for backend-to-Redis traffic.

## Frontend Variables

Set these on the frontend service:

- `NEXT_PUBLIC_SITE_URL=https://your-frontend-domain`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `NEXT_PUBLIC_HUB_URL=https://your-backend-domain`

Optional but recommended:

- `NEXT_PUBLIC_SENTRY_DSN=...`
- `SENTRY_DSN=...`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1`
- `SENTRY_TRACES_SAMPLE_RATE=0.1`
- `NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE=0`
- `NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE=1`
- `NEXT_PUBLIC_POSTHOG_KEY=...`
- `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`
- `RESEND_API_KEY=...`
- `FEATURE_REQUEST_EMAIL=...`
- `MASSIVE_API_KEY=...`
- `WAITLIST_ONLY=false`
- `WAITLIST_ALLOWED_HOSTS=your-frontend-domain`
- `WAITLIST_HOSTS=`
- `WAITLIST_RATE_LIMIT_WINDOW_MS=60000`
- `WAITLIST_RATE_LIMIT_MAX=5`
- `FEATURE_REQUEST_RATE_LIMIT_WINDOW_MS=60000`
- `FEATURE_REQUEST_RATE_LIMIT_MAX=5`

Reference template: [frontend/.env.example](/Users/dawi/dev/mk3/frontend/.env.example)

## Backend Variables

Set these on the backend service:

- `MASSIVE_API_KEY=...`
- `MASSIVE_API_URL=https://api.massive.com`
- `HUB_HOST=::`
- `HUB_PORT=3001`
- `HUB_API_KEY=...`

Redis:

- Prefer Railway's injected `REDIS_URL` if available
- Or set `REDIS_HOST` and `REDIS_PORT` from the Redis service private networking info

Optional:

- `DATABASE_URL=...`
- `ENABLE_TIMESCALE=true`
- `HUB_ALLOWED_ORIGINS=https://your-frontend-domain`
- `HUB_ADMIN_ALLOWED_ORIGINS=https://your-ops-domain`
- `HUB_PUBLIC_RATE_LIMIT_WINDOW_MS=60000`
- `HUB_PUBLIC_RATE_LIMIT_MAX=240`
- `HUB_ADMIN_RATE_LIMIT_WINDOW_MS=60000`
- `HUB_ADMIN_RATE_LIMIT_MAX=60`
- `HUB_ENABLE_SCHEDULED_JOBS=true`
- `HUB_BOOTSTRAP_FRONT_MONTHS_ON_STARTUP=true`
- `HUB_BOOTSTRAP_SNAPSHOTS_ON_STARTUP=true`
- `SENTRY_DSN=...`
- `SENTRY_TRACES_SAMPLE_RATE=0.1`

Reference template: [backend/.env.example](/Users/dawi/dev/mk3/backend/.env.example)

## Suggested First Deploy Order

1. Create Redis service.
2. Create backend service with root directory `/backend`.
3. Add backend environment variables.
4. Deploy backend and verify `/health`.
5. Create frontend service with root directory `/frontend`.
6. Add frontend environment variables.
7. Deploy frontend and verify `/waitlist`.

## Validation Checklist

- Frontend loads at your Railway or custom domain.
- Backend health returns `ok` or expected `degraded` fields at `/health`.
- Frontend can reach `NEXT_PUBLIC_HUB_URL`.
- Waitlist submission works.
- Login flow redirects back to the deployed frontend domain.
- Sentry and PostHog are disabled cleanly when DSNs or keys are omitted.

## Notes

- The backend now binds to `HUB_HOST`, defaulting to `::`, which is safer for container hosting.
- The frontend production build needs network access during build because `next/font` fetches Google Fonts.
- The current waitlist and feature-request throttles are in-memory per instance. They are acceptable for beta, but not durable bot protection.
- The bootstrap script creates services, but root directories and variables still need to be set in Railway.
