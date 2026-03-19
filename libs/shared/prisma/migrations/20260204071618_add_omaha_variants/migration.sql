-- CreateEnum
CREATE TYPE "BettingLimit" AS ENUM ('NO_LIMIT', 'POT_LIMIT', 'FIXED_LIMIT');

-- AlterTable
ALTER TABLE "GameTable" ADD COLUMN     "bettingLimit" "BettingLimit" NOT NULL DEFAULT 'NO_LIMIT',
ADD COLUMN     "holeCardsCount" INTEGER NOT NULL DEFAULT 2;
