.PHONY: up down logs test test-docker test-db test-reset migrate deploy-frontend deploy-backend deploy-all lint

# Docker
up:
	docker-compose up -d

build:
	docker-compose build
	docker-compose up -d
down:
	docker-compose down

logs:
	docker-compose logs -f

# Testes
test-db:
	docker-compose -f docker-compose.test.yml up -d --remove-orphans

test-reset:
	docker-compose -f docker-compose.test.yml down -v --remove-orphans
	docker-compose -f docker-compose.test.yml up -d --remove-orphans
	@sleep 2
	DATABASE_URL="postgresql://test:test@localhost:5433/study_planner_test?schema=public" npx prisma db push --schema=backend/prisma/schema.prisma --force-reset

test: test-db
	@sleep 1
	DATABASE_URL="postgresql://test:test@localhost:5433/study_planner_test?schema=public" npx prisma db push --schema=backend/prisma/schema.prisma
	@(cd backend && npm run test:e2e); \
	EXIT_CODE=$$?; \
	docker-compose -f docker-compose.test.yml down --remove-orphans 2>/dev/null; \
	exit $$EXIT_CODE

# Testes via Docker (não precisa de node_modules local)
test-docker:
	@# Ensure main containers are running
	@docker-compose up -d --quiet-pull 2>/dev/null || true
	@# Start test database
	@docker-compose -f docker-compose.test.yml up -d 2>/dev/null
	@sleep 2
	docker-compose exec -T backend sh -c "DATABASE_URL='postgresql://test:test@host.docker.internal:5433/study_planner_test?schema=public' npx prisma db push"
	@docker-compose exec -T backend sh -c "DATABASE_URL='postgresql://test:test@host.docker.internal:5433/study_planner_test?schema=public' npm run test:e2e"; \
	EXIT_CODE=$$?; \
	docker-compose -f docker-compose.test.yml down 2>/dev/null; \
	exit $$EXIT_CODE

# Lint via Docker
lint:
	docker-compose exec -T frontend npm run lint
	docker-compose exec -T backend npm run lint

# Prisma
migrate:
	cd backend && npx prisma migrate dev

# Deploy
deploy-front:
	netlify deploy --prod --filter frontend-new

deploy-back:
	cd backend && fly deploy

deploy-all: deploy-backend deploy-frontend
