# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this repository.

## Development Commands

### Frontend (Next.js)
```bash
# Development server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Start production server
cd frontend && npm run start

# Lint code
cd frontend && npm run lint

# WebSocket proxy for development
cd frontend && npm run dev:ws
```

### Backend (Bun)
```bash
# Development server with hot reload
cd backend && bun run dev

# Start production server
cd backend && bun run start

# Run server (alias for start)
cd backend && bun run run:server
```

### Testing
```bash
# Run single test file (backend)
cd backend && bun run src/tests/test_timescale.ts

# Run single test file (alternative)
cd backend && bun src/tests/test_timescale.ts

# Note: Frontend has no test framework configured yet
```

### Infrastructure
```bash
# Start all services (Redis, TimescaleDB, Backend)
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

## Code Style Guidelines

### Import Organization
- **Frontend**: Use `@/*` path aliases (configured in tsconfig.json)
- **Backend**: Use `@/*` path aliases from `./src` base
- Group imports: external libraries first, then internal modules, then relative imports
- Example:
```typescript
// External
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Internal (with aliases)
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Relative (avoid when possible)
import { LocalComponent } from "./local-component"
```

### TypeScript Configuration
- **Strict mode enabled** in both frontend and backend
- Use explicit return types for functions
- Prefer interfaces over types for object shapes
- Use generic types where appropriate
- No implicit any - always annotate ambiguous types

### Naming Conventions
- **Components**: PascalCase (e.g., `Button`, `MarketStatus`)
- **Functions/Variables**: camelCase (e.g., `getHistory`, `timescaleStore`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `POLYGON_ASSET_CLASS_LIST`)
- **Files**: kebab-case for utilities, PascalCase for components
- **Types**: PascalCase with descriptive suffixes (e.g., `Bar`, `FuturesInstrument`)

### Error Handling
- **Backend**: Use try-catch blocks with proper error logging and process exit where appropriate
- **Frontend**: Use error boundaries and proper error states
- Always handle async rejections with `.catch()` or try-catch
- Log errors with context (symbol, timestamp, operation)

### Component Guidelines (Frontend)
- Use shadcn/ui components as base - extend with cva for variants
- Follow the compound component pattern for complex UI
- Use `cn()` utility for conditional class merging
- Implement proper loading states and skeletons
- Use Radix UI primitives for accessibility

### Data Layer Patterns (Backend)
- Use store pattern for data access (e.g., `timescaleStore`, `redisStore`)
- Implement connection pooling and proper cleanup
- Use Zod schemas for validation
- Cache frequently accessed data in Redis
- Use TimescaleDB for time-series data with proper hypertables

### State Management
- **Frontend**: Zustand for global state, React Context for providers
- **Backend**: Store classes with singleton pattern
- Use proper TypeScript types for all state
- Implement optimistic updates where appropriate

### File Structure
```
frontend/src/
├── components/
│   ├── ui/          # shadcn/ui components
│   └── terminal/    # domain-specific components
├── hooks/           # custom React hooks
├── lib/            # utilities and helpers
├── providers/      # React context providers
├── store/          # Zustand stores
├── types/          # TypeScript type definitions
└── utils/          # utility functions

backend/src/
├── server/         # main server logic
├── api/           # external API clients
├── data/          # data store implementations
├── jobs/          # scheduled tasks
├── tests/         # test files
├── types/         # TypeScript type definitions
└── utils/         # utility functions
```

### Environment Configuration
- Frontend: Use `@/config/env.ts` for client-side env vars
- Backend: Use `@/config/env.ts` for server-side env vars
- Never commit secrets to repository
- Use proper environment variable validation

### Performance Guidelines
- Implement proper caching strategies (Redis for backend, React Query for frontend)
- Use lazy loading for heavy components
- Optimize database queries with proper indexing
- Use connection pooling for database access
- Monitor memory usage in long-running processes

### Security Best Practices
- Validate all inputs with Zod schemas
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Sanitize data before rendering
- Use HTTPS in production

### Git Workflow
- Create feature branches from main
- Use descriptive commit messages
- Run linting before committing
- Test changes thoroughly before merging
- Use conventional commits when possible

## Development Notes

- Frontend runs on port 3010, backend on port 3000
- Redis on port 6379, TimescaleDB on port 5432
- WebSocket proxy available for development testing
- Use Bun for backend runtime, npm for frontend package management
- Both projects use TypeScript with strict mode enabled