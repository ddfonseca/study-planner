# Project Rules for Claude

## Frontend Routing (CRITICAL)

This project uses **Astro + React** with two routing files that MUST be kept in sync:

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Used for standalone React builds |
| `frontend/src/components/SpaApp.tsx` | **Used by Astro** (this is what runs in production!) |

### When adding a new route:

1. Add the page import to BOTH files
2. Add the `<Route>` to BOTH files
3. Add navigation item to `frontend/src/components/layout/AppLayout.tsx`

**Example - Adding a new page `/app/example`:**

```tsx
// 1. In BOTH App.tsx AND SpaApp.tsx:
import { ExamplePage } from '@/views/ExamplePage';

// 2. Inside the /app route in BOTH files:
<Route path="example" element={<ExamplePage />} />

// 3. In AppLayout.tsx navItems array:
{ to: '/app/example', icon: SomeIcon, label: 'Example', badgeKey: null, tourId: null },
```

## Feature Badges

When adding a new feature with a "Novo" badge:

1. Add the key to `FeatureKey` type in `frontend/src/store/featureBadgesStore.ts`
2. Add the key to `initialSeenFeatures` object in the same file

## Backend Modules

When creating a new NestJS module:

1. Create the module in `backend/src/{module-name}/`
2. Register it in `backend/src/app.module.ts`
3. Run `npx prisma migrate dev` if schema changed

## Docker Development

- Files are mounted as volumes, changes should hot-reload
- If hot-reload doesn't work: `docker compose restart frontend`
- To apply migrations: `docker compose exec backend npx prisma migrate deploy`

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all Docker containers |
| `make down` | Stop all Docker containers |
| `make build` | Build and start containers |
| `make logs` | Follow container logs |
| `make test` | Run tests in isolated Docker environment |
| `make lint` | Run linter on frontend and backend |
| `make migrate` | Run Prisma migrations (local) |
| `make prisma-generate` | Generate Prisma client |
| `make postgres` | Start only Postgres (for local dev) |
| `make postgres-down` | Stop Postgres |
| `make deploy-front` | Deploy frontend to Netlify |
| `make deploy-back` | Deploy backend to Fly.io |
| `make deploy-all` | Deploy both frontend and backend |

## IMPORTANT: Always Run Tests

**After completing any code change, ALWAYS run `make test` to verify everything works.**

This runs tests in an isolated Docker environment with a fresh database.
