# Frontend Operations

## Required Environment

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_HUB_URL`

## Local Commands

- `bun run dev`
- `bun run build`
- `bun run start`
- `bun run test`
- `bun run test:coverage`
- `bunx tsc --noEmit`

## Quality Checks

Current meaningful checks for the frontend data layer:

- typecheck
- Vitest suite
- targeted coverage for hub/bootstrap/store logic

Note:
- the full frontend lint baseline is still noisy due to older unrelated files
- data-layer work should keep its own files type-safe and test-covered even while broader lint cleanup is pending

## Runtime Expectations

- backend hub must be reachable from `NEXT_PUBLIC_HUB_URL`
- market data is read-only from the frontend perspective
- browser clients should not be the primary integration point for provider credentials
