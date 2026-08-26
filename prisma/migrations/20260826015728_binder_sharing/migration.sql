-- AlterTable
ALTER TABLE "Binder" ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Binder_shareSlug_key" ON "Binder"("shareSlug");
