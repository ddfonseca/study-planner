-- CreateTable
CREATE TABLE "exam_profiles" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "exam_date" DATE,
    "weekly_hours" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_profiles" (
    "id" TEXT NOT NULL,
    "exam_profile_id" TEXT NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "current_level" INTEGER NOT NULL DEFAULT 5,
    "goal_level" INTEGER NOT NULL DEFAULT 8,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_template_items" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "median_level" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "exam_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_profiles_workspace_id_idx" ON "exam_profiles"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_profiles_workspace_id_name_key" ON "exam_profiles"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "subject_profiles_exam_profile_id_idx" ON "subject_profiles"("exam_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_profiles_exam_profile_id_subject_key" ON "subject_profiles"("exam_profile_id", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "exam_templates_name_category_key" ON "exam_templates"("name", "category");

-- CreateIndex
CREATE INDEX "exam_template_items_template_id_idx" ON "exam_template_items"("template_id");

-- AddForeignKey
ALTER TABLE "exam_profiles" ADD CONSTRAINT "exam_profiles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_profiles" ADD CONSTRAINT "subject_profiles_exam_profile_id_fkey" FOREIGN KEY ("exam_profile_id") REFERENCES "exam_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_template_items" ADD CONSTRAINT "exam_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "exam_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
