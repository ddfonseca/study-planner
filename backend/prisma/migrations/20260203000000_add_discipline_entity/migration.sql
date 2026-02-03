-- CreateTable
CREATE TABLE "disciplines" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7),
    "icon" VARCHAR(50),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add discipline_id to subjects
ALTER TABLE "subjects" ADD COLUMN "discipline_id" TEXT;

-- AlterTable: Make subject_id nullable in study_cycle_items
ALTER TABLE "study_cycle_items" ALTER COLUMN "subject_id" DROP NOT NULL;

-- AlterTable: Add discipline_id to study_cycle_items
ALTER TABLE "study_cycle_items" ADD COLUMN "discipline_id" TEXT;

-- CreateIndex
CREATE INDEX "disciplines_workspace_id_idx" ON "disciplines"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_workspace_id_name_key" ON "disciplines"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "subjects_discipline_id_idx" ON "subjects"("discipline_id");

-- CreateIndex
CREATE INDEX "study_cycle_items_discipline_id_idx" ON "study_cycle_items"("discipline_id");

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_cycle_items" ADD CONSTRAINT "study_cycle_items_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
