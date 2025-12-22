-- Migration: Simplify weekly goals from min/des hours to single target_hours

-- Step 1: Add target_hours to user_configs (use des_hours value for existing data)
ALTER TABLE "user_configs" ADD COLUMN "target_hours" DOUBLE PRECISION NOT NULL DEFAULT 30;

-- Copy des_hours values to target_hours for existing records
UPDATE "user_configs" SET "target_hours" = "des_hours" WHERE "des_hours" IS NOT NULL;

-- Step 2: Add target_hours to weekly_goals (use des_hours value for existing data)
ALTER TABLE "weekly_goals" ADD COLUMN "target_hours" DOUBLE PRECISION NOT NULL DEFAULT 30;

-- Copy des_hours values to target_hours for existing records
UPDATE "weekly_goals" SET "target_hours" = "des_hours" WHERE "des_hours" IS NOT NULL;

-- Step 3: Drop old columns from user_configs
ALTER TABLE "user_configs" DROP COLUMN "min_hours";
ALTER TABLE "user_configs" DROP COLUMN "des_hours";

-- Step 4: Drop old columns from weekly_goals
ALTER TABLE "weekly_goals" DROP COLUMN "min_hours";
ALTER TABLE "weekly_goals" DROP COLUMN "des_hours";
