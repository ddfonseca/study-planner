-- CreateTable
CREATE TABLE "study_cycle_advances" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "from_subject" VARCHAR(100) NOT NULL,
    "to_subject" VARCHAR(100) NOT NULL,
    "from_position" INTEGER NOT NULL,
    "to_position" INTEGER NOT NULL,
    "minutes_spent" INTEGER NOT NULL,
    "advanced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_cycle_advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_cycle_completions" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "cycle_name" VARCHAR(50),
    "total_target_minutes" INTEGER NOT NULL,
    "total_spent_minutes" INTEGER NOT NULL,
    "items_count" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_cycle_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_cycle_advances_cycle_id_idx" ON "study_cycle_advances"("cycle_id");

-- CreateIndex
CREATE INDEX "study_cycle_advances_advanced_at_idx" ON "study_cycle_advances"("advanced_at");

-- CreateIndex
CREATE INDEX "study_cycle_completions_cycle_id_idx" ON "study_cycle_completions"("cycle_id");

-- CreateIndex
CREATE INDEX "study_cycle_completions_completed_at_idx" ON "study_cycle_completions"("completed_at");

-- AddForeignKey
ALTER TABLE "study_cycle_advances" ADD CONSTRAINT "study_cycle_advances_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "study_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_cycle_completions" ADD CONSTRAINT "study_cycle_completions_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "study_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
