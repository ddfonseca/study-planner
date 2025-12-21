.PHONY: up down logs test test-db test-reset migrate

# Docker
up:
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
	@(cd backend && npm run test:e2e -- --testPathIgnorePatterns="weekly-goal-controller"); \
	EXIT_CODE=$$?; \
	docker-compose -f docker-compose.test.yml down --remove-orphans; \
	exit $$EXIT_CODE

# Prisma
migrate:
	cd backend && npx prisma migrate dev
