-- Multiple cycles per workspace support
-- Changes:
-- 1. Remove unique constraint on workspace_id (allow multiple cycles)
-- 2. Add unique constraint on [workspace_id, name]
-- 3. Add display_order column
-- 4. Add last_reset_at column
-- 5. Make name required
-- 6. Change is_active default to false
-- 7. Add index on [workspace_id, is_active]

-- DropIndex (remove unique on workspace_id to allow multiple cycles)
DROP INDEX "study_cycles_workspace_id_key";

-- AlterTable
ALTER TABLE "study_cycles" ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "study_cycles" ADD COLUMN "last_reset_at" TIMESTAMP(3);
ALTER TABLE "study_cycles" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "study_cycles" ALTER COLUMN "is_active" SET DEFAULT false;

-- CreateIndex
CREATE INDEX "study_cycles_workspace_id_is_active_idx" ON "study_cycles"("workspace_id", "is_active");

-- CreateIndex (unique on workspace_id + name)
CREATE UNIQUE INDEX "study_cycles_workspace_id_name_key" ON "study_cycles"("workspace_id", "name");
