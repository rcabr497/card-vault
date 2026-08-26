-- CreateTable
CREATE TABLE "BinderCard" (
    "binderId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderCard_pkey" PRIMARY KEY ("binderId","cardId")
);

-- CreateIndex
CREATE INDEX "BinderCard_cardId_idx" ON "BinderCard"("cardId");

-- AddForeignKey
ALTER TABLE "BinderCard" ADD CONSTRAINT "BinderCard_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderCard" ADD CONSTRAINT "BinderCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing card's current binder becomes its first membership
INSERT INTO "BinderCard" ("binderId", "cardId", "addedAt")
SELECT "binderId", "id", "createdAt" FROM "Card";

-- DropForeignKey
ALTER TABLE "Card" DROP CONSTRAINT "Card_binderId_fkey";

-- DropIndex
DROP INDEX "Card_binderId_idx";

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "binderId";
