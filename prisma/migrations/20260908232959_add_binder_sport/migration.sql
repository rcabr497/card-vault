-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('baseball', 'basketball', 'football', 'hockey', 'soccer', 'mma');

-- AlterTable
ALTER TABLE "Binder" ADD COLUMN     "sport" "Sport";
