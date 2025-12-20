/**
 * Jest E2E Test Setup
 * Configures test environment with test database
 */
import { PrismaClient } from '@prisma/client';

// Use test database
process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5433/study_planner_test?schema=public';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure database is connected
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Export prisma for use in tests
export { prisma };
