.PHONY: up down logs build test lint migrate prisma-generate \
	deploy-front deploy-back deploy-all postgres postgres-down

# Docker
up:
	docker compose up -d

# Postgres only (for local dev)
postgres:
	@docker network create study-planner-network 2>/dev/null || true
	docker compose -f docker-compose.postgres.yml up -d

postgres-down:
	docker compose -f docker-compose.postgres.yml down

build:
	docker compose build
	docker compose up -d
down:
	docker compose down

logs:
	docker compose logs -f

# Testes (ambiente isolado via Docker)
test:
	@echo "Running tests in isolated Docker environment..."
	@docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from backend-test; \
	EXIT_CODE=$$?; \
	docker compose -f docker-compose.test.yml down -v 2>/dev/null; \
	exit $$EXIT_CODE

# Lint via Docker
lint:
	docker compose exec -T frontend npm run lint
	docker compose exec -T backend npm run lint

# Prisma
migrate:
	cd backend && npx prisma migrate dev

prisma-generate:
	docker compose exec -T backend npx prisma generate

# Deploy - Production (build is done by Netlify via netlify.toml)
deploy-front:
	netlify deploy --prod --dir=frontend/dist --filter=frontend-new

deploy-back:
	cd backend && fly deploy

deploy-all: deploy-back deploy-front
