-- AlterEnum
ALTER TYPE "BillingCycle" ADD VALUE 'LIFETIME';

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "price_lifetime" DOUBLE PRECISION DEFAULT 0;
