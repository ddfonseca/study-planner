/**
 * Database Helper for Tests
 * Utilities for cleaning and seeding test database
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
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch {
      // Tables might not exist yet
    }
  }
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
      email: data?.email || `test-${Date.now()}@test.com`,
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
  data?: { minHours?: number; desHours?: number },
): Promise<{ id: string; userId: string; minHours: number; desHours: number }> {
  const config = await prisma.userConfig.create({
    data: {
      userId,
      minHours: data?.minHours ?? 2,
      desHours: data?.desHours ?? 4,
    },
  });
  return config;
}

export { prisma };
