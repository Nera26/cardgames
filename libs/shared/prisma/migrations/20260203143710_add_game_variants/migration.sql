-- CreateEnum
CREATE TYPE "GameVariant" AS ENUM ('TEXAS_HOLDEM', 'OMAHA', 'ALL_IN_OR_FOLD');

-- AlterTable
ALTER TABLE "GameTable" ADD COLUMN     "variant" "GameVariant" NOT NULL DEFAULT 'TEXAS_HOLDEM';
