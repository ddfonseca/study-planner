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

/**
 * Create a subscription plan
 */
export async function createTestSubscriptionPlan(data?: {
  name?: string;
  displayName?: string;
  priceMonthly?: number;
  priceYearly?: number;
  priceLifetime?: number;
  mercadoPagoPlanId?: string;
}): Promise<{
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  priceLifetime: number | null;
}> {
  const prisma = jestPrisma.client;
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: data?.name || `plan-${Date.now()}`,
      displayName: data?.displayName || 'Test Plan',
      priceMonthly: data?.priceMonthly ?? 0,
      priceYearly: data?.priceYearly ?? 0,
      priceLifetime: data?.priceLifetime ?? 19.90,
      mercadoPagoPlanId: data?.mercadoPagoPlanId,
    },
  });
  return plan;
}

/**
 * Create plan limits
 */
export async function createTestPlanLimits(
  planId: string,
  limits: Array<{ feature: string; limitValue: number }>,
): Promise<void> {
  const prisma = jestPrisma.client;
  await prisma.planLimit.createMany({
    data: limits.map((l) => ({
      planId,
      feature: l.feature,
      limitValue: l.limitValue,
    })),
  });
}

/**
 * Create a subscription for a user
 */
export async function createTestSubscription(
  userId: string,
  planId: string,
  data?: {
    status?: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'PAUSED';
    billingCycle?: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    externalId?: string;
  },
): Promise<{
  id: string;
  userId: string;
  planId: string;
  status: string;
}> {
  const prisma = jestPrisma.client;
  const isLifetime = data?.billingCycle === 'LIFETIME';
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: data?.status || 'ACTIVE',
      billingCycle: data?.billingCycle || 'LIFETIME',
      externalId: data?.externalId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: isLifetime ? new Date('9999-12-31') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return subscription;
}
