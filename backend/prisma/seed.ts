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
    description: 'Para estudantes dedicados que querem mais recursos',
    priceMonthly: 19.9,
    priceYearly: 0, // Plano mensal apenas
    limits: [
      { feature: 'max_cycles', limitValue: 10 },
      { feature: 'max_workspaces', limitValue: 10 },
      { feature: 'max_sessions_per_day', limitValue: -1 },
      { feature: 'export_data', limitValue: 1 },
      { feature: 'shared_plans', limitValue: 5 },
      { feature: 'history_days', limitValue: 365 },
    ],
  },
  {
    name: 'pro_annual',
    displayName: 'Pro Anual',
    description: 'Economize 30% pagando anualmente',
    priceMonthly: 0, // Plano anual apenas
    priceYearly: 167.16, // R$ 19.90 * 12 * 0.70 = 30% desconto
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

  // Remove deprecated business plan
  const businessPlan = await prisma.subscriptionPlan.findUnique({
    where: { name: 'business' },
  });
  if (businessPlan) {
    await prisma.planLimit.deleteMany({ where: { planId: businessPlan.id } });
    await prisma.subscriptionPlan.delete({ where: { name: 'business' } });
    console.log('🗑️  Removed deprecated business plan\n');
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

async function main() {
  try {
    await seedPlans();
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
