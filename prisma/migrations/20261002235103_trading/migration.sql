-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('proposed', 'accepted', 'declined', 'cancelled', 'completed');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "handle" TEXT;

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'proposed',
    "awaitingUserId" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "proposerConfirmedAt" TIMESTAMP(3),
    "recipientConfirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeItem" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "cardId" TEXT,
    "quantity" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CardCategory" NOT NULL,
    "setName" TEXT,
    "cardNumber" TEXT,
    "year" INTEGER,
    "condition" "CardCondition" NOT NULL,
    "gradingCompany" TEXT,
    "grade" TEXT,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "currentValue" DECIMAL(10,2),

    CONSTRAINT "TradeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trade_proposerId_idx" ON "Trade"("proposerId");

-- CreateIndex
CREATE INDEX "Trade_recipientId_idx" ON "Trade"("recipientId");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- CreateIndex
CREATE INDEX "TradeItem_tradeId_idx" ON "TradeItem"("tradeId");

-- CreateIndex
CREATE INDEX "TradeItem_cardId_idx" ON "TradeItem"("cardId");

-- CreateIndex
CREATE INDEX "TradeItem_ownerId_idx" ON "TradeItem"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeItem" ADD CONSTRAINT "TradeItem_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeItem" ADD CONSTRAINT "TradeItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

