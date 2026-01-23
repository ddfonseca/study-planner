-- CreateTable
CREATE TABLE "scratchpad_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scratchpad_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scratchpad_notes_user_id_idx" ON "scratchpad_notes"("user_id");

-- AddForeignKey
ALTER TABLE "scratchpad_notes" ADD CONSTRAINT "scratchpad_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
