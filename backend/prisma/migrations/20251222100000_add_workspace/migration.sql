-- Migration: Add Workspace feature
-- Allows users to organize study sessions and goals into separate workspaces

-- Step 1: Create workspaces table
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7) DEFAULT '#6366f1',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add indexes and unique constraint for workspaces
CREATE UNIQUE INDEX "workspaces_user_id_name_key" ON "workspaces"("user_id", "name");
CREATE INDEX "workspaces_user_id_idx" ON "workspaces"("user_id");

-- Step 3: Add foreign key constraint for workspaces
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Add workspace_id column to study_sessions (nullable initially)
ALTER TABLE "study_sessions" ADD COLUMN "workspace_id" TEXT;

-- Step 5: Add workspace_id column to weekly_goals (nullable initially)
ALTER TABLE "weekly_goals" ADD COLUMN "workspace_id" TEXT;

-- Step 6: Create default "Geral" workspace for each existing user
INSERT INTO "workspaces" ("id", "user_id", "name", "is_default", "created_at", "updated_at")
SELECT
    'ws_' || "id",
    "id",
    'Geral',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "user";

-- Step 7: Update existing study_sessions to point to the default workspace
UPDATE "study_sessions" ss
SET "workspace_id" = w."id"
FROM "workspaces" w
WHERE ss."user_id" = w."user_id" AND w."is_default" = true;

-- Step 8: Update existing weekly_goals to point to the default workspace
UPDATE "weekly_goals" wg
SET "workspace_id" = w."id"
FROM "workspaces" w
WHERE wg."user_id" = w."user_id" AND w."is_default" = true;

-- Step 9: Make workspace_id NOT NULL in study_sessions
ALTER TABLE "study_sessions" ALTER COLUMN "workspace_id" SET NOT NULL;

-- Step 10: Make workspace_id NOT NULL in weekly_goals
ALTER TABLE "weekly_goals" ALTER COLUMN "workspace_id" SET NOT NULL;

-- Step 11: Add foreign key constraint for study_sessions.workspace_id
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 12: Add foreign key constraint for weekly_goals.workspace_id
ALTER TABLE "weekly_goals" ADD CONSTRAINT "weekly_goals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 13: Add index for workspace_id in study_sessions
CREATE INDEX "study_sessions_workspace_id_idx" ON "study_sessions"("workspace_id");

-- Step 14: Add index for workspace_id in weekly_goals
CREATE INDEX "weekly_goals_workspace_id_idx" ON "weekly_goals"("workspace_id");

-- Step 15: Drop old unique constraint on weekly_goals (user_id, week_start)
ALTER TABLE "weekly_goals" DROP CONSTRAINT IF EXISTS "weekly_goals_user_id_week_start_key";

-- Step 16: Add new unique constraint on weekly_goals (user_id, workspace_id, week_start)
CREATE UNIQUE INDEX "weekly_goals_user_id_workspace_id_week_start_key" ON "weekly_goals"("user_id", "workspace_id", "week_start");
