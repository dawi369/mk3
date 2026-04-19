# MK3

Monorepo for the Swordfish frontend and futures-data backend.

## Services

- `frontend/` — Next.js app
- `backend/` — Bun hub API + WebSocket service
- `docker-compose.yml` — local Redis for development

## Deploying

Railway is currently the intended hosting target for both services.

- Repo-wide Railway setup guide: [docs/railway.md](/Users/dawi/dev/mk3/docs/railway.md)
- Repo structure and ownership map: [docs/repo-map.md](/Users/dawi/dev/mk3/docs/repo-map.md)
- Redis-only beta deployment assessment: [docs/redis-beta-readiness.md](/Users/dawi/dev/mk3/docs/redis-beta-readiness.md)
- Frontend env template: [frontend/.env.example](/Users/dawi/dev/mk3/frontend/.env.example)
- Backend env template: [backend/.env.example](/Users/dawi/dev/mk3/backend/.env.example)

Service-local Railway config already exists in:

- [frontend/railway.toml](/Users/dawi/dev/mk3/frontend/railway.toml)
- [backend/railway.toml](/Users/dawi/dev/mk3/backend/railway.toml)
