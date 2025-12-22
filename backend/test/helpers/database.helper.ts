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

/**
 * Create a test workspace
 */
export async function createTestWorkspace(
  userId: string,
  data?: { name?: string; color?: string; isDefault?: boolean },
): Promise<{ id: string; userId: string; name: string; color: string | null; isDefault: boolean }> {
  const prisma = jestPrisma.client;
  const workspace = await prisma.workspace.create({
    data: {
      userId,
      name: data?.name || `Workspace-${Date.now()}`,
      color: data?.color || '#6366f1',
      isDefault: data?.isDefault ?? false,
    },
  });
  return workspace;
}

/**
 * Create a test user with default workspace
 */
export async function createTestUserWithWorkspace(data?: {
  email?: string;
  name?: string;
}): Promise<{
  user: { id: string; email: string; name: string };
  workspace: { id: string; userId: string; name: string; color: string | null; isDefault: boolean };
}> {
  const user = await createTestUser(data);
  const workspace = await createTestWorkspace(user.id, {
    name: 'Geral',
    isDefault: true,
  });
  return { user, workspace };
}
