-- AlterTable
ALTER TABLE "study_cycle_items" ADD COLUMN     "subject_id" TEXT;

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "subject_id" TEXT;

-- AlterTable
ALTER TABLE "subject_profiles" ADD COLUMN     "subject_id" TEXT;

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7),
    "icon" VARCHAR(50),
    "position" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subjects_workspace_id_idx" ON "subjects"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_workspace_id_name_key" ON "subjects"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "study_cycle_items_subject_id_idx" ON "study_cycle_items"("subject_id");

-- CreateIndex
CREATE INDEX "study_sessions_subject_id_idx" ON "study_sessions"("subject_id");

-- CreateIndex
CREATE INDEX "subject_profiles_subject_id_idx" ON "subject_profiles"("subject_id");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_cycle_items" ADD CONSTRAINT "study_cycle_items_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_profiles" ADD CONSTRAINT "subject_profiles_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
