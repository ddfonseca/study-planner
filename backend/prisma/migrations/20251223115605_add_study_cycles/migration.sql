-- DropIndex
DROP INDEX "weekly_goals_user_id_week_start_key";

-- AlterTable
ALTER TABLE "weekly_goals" ALTER COLUMN "target_hours" DROP DEFAULT;

-- CreateTable
CREATE TABLE "study_cycles" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "current_item_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_cycle_items" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "target_minutes" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "study_cycle_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_cycles_workspace_id_key" ON "study_cycles"("workspace_id");

-- CreateIndex
CREATE INDEX "study_cycles_workspace_id_idx" ON "study_cycles"("workspace_id");

-- CreateIndex
CREATE INDEX "study_cycle_items_cycle_id_idx" ON "study_cycle_items"("cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_cycle_items_cycle_id_position_key" ON "study_cycle_items"("cycle_id", "position");

-- AddForeignKey
ALTER TABLE "study_cycles" ADD CONSTRAINT "study_cycles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_cycle_items" ADD CONSTRAINT "study_cycle_items_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "study_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
