-- Clear existing data that would conflict with the migration
-- This is a destructive migration - all study data will be lost

-- Delete subject profiles (depends on exam profiles)
DELETE FROM "subject_profiles";

-- Delete study sessions
DELETE FROM "study_sessions";

-- Delete study cycle items (depends on study cycles)
DELETE FROM "study_cycle_items";

-- Delete study cycle advances
DELETE FROM "study_cycle_advances";

-- Delete study cycle completions
DELETE FROM "study_cycle_completions";

-- Delete study cycles
DELETE FROM "study_cycles";

-- Delete exam profiles
DELETE FROM "exam_profiles";

-- Now apply schema changes

-- DropIndex
DROP INDEX IF EXISTS "study_sessions_subject_id_idx";

-- DropIndex (old unique constraint)
ALTER TABLE "subject_profiles" DROP CONSTRAINT IF EXISTS "subject_profiles_exam_profile_id_subject_key";

-- AlterTable - StudySession
ALTER TABLE "study_sessions" DROP COLUMN IF EXISTS "subject";
ALTER TABLE "study_sessions" ALTER COLUMN "subject_id" SET NOT NULL;

-- AlterTable - StudyCycleItem
ALTER TABLE "study_cycle_items" DROP COLUMN IF EXISTS "subject";
ALTER TABLE "study_cycle_items" ALTER COLUMN "subject_id" SET NOT NULL;

-- AlterTable - SubjectProfile
ALTER TABLE "subject_profiles" DROP COLUMN IF EXISTS "subject";
ALTER TABLE "subject_profiles" ALTER COLUMN "subject_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "study_sessions_subject_id_idx" ON "study_sessions"("subject_id");

-- CreateIndex (new unique constraint)
CREATE UNIQUE INDEX "subject_profiles_exam_profile_id_subject_id_key" ON "subject_profiles"("exam_profile_id", "subject_id");

-- AddForeignKey (update to cascade)
ALTER TABLE "study_sessions" DROP CONSTRAINT IF EXISTS "study_sessions_subject_id_fkey";
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_cycle_items" DROP CONSTRAINT IF EXISTS "study_cycle_items_subject_id_fkey";
ALTER TABLE "study_cycle_items" ADD CONSTRAINT "study_cycle_items_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subject_profiles" DROP CONSTRAINT IF EXISTS "subject_profiles_subject_id_fkey";
ALTER TABLE "subject_profiles" ADD CONSTRAINT "subject_profiles_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
