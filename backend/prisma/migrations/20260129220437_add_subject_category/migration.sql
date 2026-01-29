-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "category" VARCHAR(50);

-- CreateIndex
CREATE INDEX "subjects_category_idx" ON "subjects"("category");
