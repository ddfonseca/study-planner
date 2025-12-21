/**
 * Database Helper for Tests
 * Uses jest-prisma for automatic transaction rollback
 */

/**
 * Create a test user
 */
export async function createTestUser(data?: {
  email?: string;
  name?: string;
}): Promise<{ id: string; email: string; name: string }> {
  const prisma = jestPrisma.client;
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
  const prisma = jestPrisma.client;
  const config = await prisma.userConfig.create({
    data: {
      userId,
      targetHours: data?.targetHours ?? 30,
    },
  });
  return config;
}
