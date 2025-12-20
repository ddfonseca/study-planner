/**
 * Database Helper for Tests
 * Uses TRUNCATE for test isolation (Prisma connection pooling doesn't support manual transactions)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://test:test@localhost:5433/study_planner_test?schema=public',
    },
  },
});

/**
 * Clean all tables in the test database
 */
export async function cleanDatabase(): Promise<void> {
  // Delete in order to respect foreign keys (faster than TRUNCATE for small datasets)
  await prisma.weeklyGoal.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.userConfig.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Create a test user
 */
export async function createTestUser(data?: {
  email?: string;
  name?: string;
}): Promise<{ id: string; email: string; name: string }> {
  const user = await prisma.user.create({
    data: {
      email: data?.email || `test-${Date.now()}-${Math.random()}@test.com`,
      name: data?.name || 'Test User',
      emailVerified: true,
    },
  });
  return user;
}

/**
 * Create user config
 */
export async function createUserConfig(
  userId: string,
  data?: { targetHours?: number },
): Promise<{ id: string; userId: string; targetHours: number }> {
  const config = await prisma.userConfig.create({
    data: {
      userId,
      targetHours: data?.targetHours ?? 30,
    },
  });
  return config;
}

export { prisma };
