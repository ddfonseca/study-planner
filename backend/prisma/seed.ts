/**
 * Seed Subscription Plans - Populates database with default plans
 * Run: npx ts-node prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    name: 'free',
    displayName: 'Gratuito',
    description: 'Perfeito para começar a organizar seus estudos',
    priceMonthly: 0,
    priceYearly: 0,
    priceLifetime: 0,
    limits: [
      { feature: 'max_cycles', limitValue: 1 },
      { feature: 'max_workspaces', limitValue: 2 },
      { feature: 'max_sessions_per_day', limitValue: 20 },
      { feature: 'export_data', limitValue: 0 },
      { feature: 'shared_plans', limitValue: 0 },
      { feature: 'history_days', limitValue: 30 },
    ],
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'Acesso vitalício a todos os recursos premium',
    priceMonthly: 0,
    priceYearly: 0,
    priceLifetime: 19.9,
    limits: [
      { feature: 'max_cycles', limitValue: 10 },
      { feature: 'max_workspaces', limitValue: 10 },
      { feature: 'max_sessions_per_day', limitValue: -1 },
      { feature: 'export_data', limitValue: 1 },
      { feature: 'shared_plans', limitValue: 5 },
      { feature: 'history_days', limitValue: 365 },
    ],
  },
];

async function seedPlans() {
  console.log('🌱 Seeding subscription plans...\n');

  // Mark deprecated plans as inactive (business, pro_annual)
  const deprecatedPlans = ['business', 'pro_annual'];
  for (const planName of deprecatedPlans) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { name: planName },
    });
    if (plan && plan.isActive) {
      await prisma.subscriptionPlan.update({
        where: { name: planName },
        data: { isActive: false },
      });
      console.log(`📦 Marked ${planName} plan as inactive\n`);
    }
  }

  for (const plan of plans) {
    const { limits, ...planData } = plan;

    // Upsert plan
    const createdPlan = await prisma.subscriptionPlan.upsert({
      where: { name: planData.name },
      update: {
        displayName: planData.displayName,
        description: planData.description,
        priceMonthly: planData.priceMonthly,
        priceYearly: planData.priceYearly,
        priceLifetime: planData.priceLifetime,
      },
      create: planData,
    });

    console.log(`✅ Plan: ${createdPlan.displayName} (${createdPlan.name})`);

    // Upsert limits for this plan
    for (const limit of limits) {
      await prisma.planLimit.upsert({
        where: {
          planId_feature: {
            planId: createdPlan.id,
            feature: limit.feature,
          },
        },
        update: {
          limitValue: limit.limitValue,
        },
        create: {
          planId: createdPlan.id,
          feature: limit.feature,
          limitValue: limit.limitValue,
        },
      });
    }

    console.log(`   - ${limits.length} limits configured`);
  }

  console.log('\n✅ All plans seeded successfully!');
}

async function migrateExistingSubscribers() {
  console.log('\n🔄 Migrating existing subscribers to lifetime...\n');

  // Get the pro plan
  const proPlan = await prisma.subscriptionPlan.findUnique({
    where: { name: 'pro' },
  });

  if (!proPlan) {
    console.log('   Pro plan not found, skipping migration.');
    return;
  }

  // Find all active subscriptions that are not yet LIFETIME
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      billingCycle: { not: 'LIFETIME' },
    },
    include: { user: true, plan: true },
  });

  if (activeSubscriptions.length === 0) {
    console.log('   No subscriptions to migrate.');
    return;
  }

  for (const sub of activeSubscriptions) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        planId: proPlan.id, // Move all to the main pro plan
        billingCycle: 'LIFETIME',
        currentPeriodEnd: new Date('9999-12-31'),
        cancelAtPeriodEnd: false,
      },
    });
    console.log(`   ✅ Migrated ${sub.user.email} from ${sub.plan.name} to Pro lifetime`);
  }

  console.log(`\n✅ Migrated ${activeSubscriptions.length} subscription(s) to lifetime!`);
}

async function main() {
  try {
    await seedPlans();
    await migrateExistingSubscribers();
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
