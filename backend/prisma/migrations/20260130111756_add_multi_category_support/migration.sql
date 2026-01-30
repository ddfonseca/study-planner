-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_categories" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_workspace_id_idx" ON "categories"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_workspace_id_name_key" ON "categories"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "subject_categories_subject_id_idx" ON "subject_categories"("subject_id");

-- CreateIndex
CREATE INDEX "subject_categories_category_id_idx" ON "subject_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_categories_subject_id_category_id_key" ON "subject_categories"("subject_id", "category_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_categories" ADD CONSTRAINT "subject_categories_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_categories" ADD CONSTRAINT "subject_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration: Migrate existing category strings to new Category table
-- Step 1: Create categories from unique category strings per workspace
INSERT INTO "categories" ("id", "workspace_id", "name", "position", "created_at", "updated_at")
SELECT
  CONCAT('cat_', MD5(CONCAT("workspace_id", '_', "category")), '_', EXTRACT(EPOCH FROM NOW())::TEXT),
  "workspace_id",
  "category",
  ROW_NUMBER() OVER (PARTITION BY "workspace_id" ORDER BY "category") - 1,
  NOW(),
  NOW()
FROM "subjects"
WHERE "category" IS NOT NULL
GROUP BY "workspace_id", "category";

-- Step 2: Create subject-category relationships
INSERT INTO "subject_categories" ("id", "subject_id", "category_id", "created_at")
SELECT
  CONCAT('sc_', MD5(CONCAT(s.id, '_', c.id)), '_', EXTRACT(EPOCH FROM NOW())::TEXT),
  s.id,
  c.id,
  NOW()
FROM "subjects" s
INNER JOIN "categories" c ON s."workspace_id" = c."workspace_id" AND s."category" = c."name"
WHERE s."category" IS NOT NULL;
