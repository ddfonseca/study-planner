.PHONY: up down logs build test lint migrate prisma-generate \
	deploy-front deploy-back deploy-all postgres postgres-down help

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
	cd frontend && npm run build
	netlify deploy --prod --dir=$(CURDIR)/frontend/dist --site=a8071ed7-b442-48ab-b171-aef912123d94 --no-build --filter shiphours-frontend

deploy-back:
	cd backend && fly deploy

deploy-all: deploy-back deploy-front

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Docker:"
	@echo "  up               Start all Docker containers"
	@echo "  down             Stop all Docker containers"
	@echo "  build            Build and start containers"
	@echo "  logs             Follow container logs"
	@echo ""
	@echo "Database:"
	@echo "  postgres         Start only Postgres (for local dev)"
	@echo "  postgres-down    Stop Postgres"
	@echo "  migrate          Run Prisma migrations (local)"
	@echo "  prisma-generate  Generate Prisma client"
	@echo ""
	@echo "Quality:"
	@echo "  test             Run tests in isolated Docker environment"
	@echo "  lint             Run linter on frontend and backend"
	@echo ""
	@echo "Deploy:"
	@echo "  deploy-front     Deploy frontend to Netlify"
	@echo "  deploy-back      Deploy backend to Fly.io"
	@echo "  deploy-all       Deploy both frontend and backend"
