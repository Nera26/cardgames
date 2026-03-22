-- ============================================================
-- Migration: Add Tournaments, Leaderboards, and missing schema changes
-- ============================================================

-- CreateEnum
CREATE TYPE "LeaderboardTimeframe" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('CASH', 'TOURNAMENT');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('ANNOUNCED', 'REGISTERING', 'LATE_REG', 'RUNNING', 'ON_BREAK', 'PAUSED', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TournamentGameType" AS ENUM ('TEXAS_HOLDEM', 'POT_LIMIT_OMAHA', 'OMAHA_HI_LO', 'SHORT_DECK');

-- CreateEnum
CREATE TYPE "TournamentEntryFormat" AS ENUM ('REGULAR', 'FREEROLL', 'FREEZEOUT', 'RE_ENTRY', 'PROGRESSIVE_KO', 'BOUNTY');

-- CreateEnum
CREATE TYPE "BlindStructureSpeed" AS ENUM ('REGULAR', 'TURBO', 'HYPER_TURBO', 'DEEP_STACK');

-- CreateEnum
CREATE TYPE "LateRegistrationWindow" AS ENUM ('DISABLED', 'THIRTY_MINUTES', 'SIXTY_MINUTES', 'NINETY_MINUTES', 'UNTIL_FIRST_BREAK');

-- CreateEnum
CREATE TYPE "PayoutStructure" AS ENUM ('WINNER_TAKES_ALL', 'TOP_3', 'TOP_10_PERCENT', 'TOP_15_PERCENT', 'TOP_20_PERCENT', 'CUSTOM');

-- AlterEnum (add new TransactionType values)
ALTER TYPE "TransactionType" ADD VALUE 'ADMIN_CREDIT';
ALTER TYPE "TransactionType" ADD VALUE 'ADMIN_DEBIT';
ALTER TYPE "TransactionType" ADD VALUE 'TOURNAMENT_BUY_IN';
ALTER TYPE "TransactionType" ADD VALUE 'TOURNAMENT_REBUY';
ALTER TYPE "TransactionType" ADD VALUE 'TOURNAMENT_ADDON';
ALTER TYPE "TransactionType" ADD VALUE 'TOURNAMENT_PRIZE';
ALTER TYPE "TransactionType" ADD VALUE 'TOURNAMENT_REFUND';

-- AlterTable: User — add pre-aggregated stats columns
ALTER TABLE "User" ADD COLUMN "handsPlayed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "handsWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tournamentsPlayed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tournamentsTop3" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: HandHistory — make communityCards nullable
ALTER TABLE "HandHistory" ALTER COLUMN "communityCards" DROP NOT NULL;

-- CreateTable: LeaderboardStat
CREATE TABLE "LeaderboardStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeframe" "LeaderboardTimeframe" NOT NULL,
    "gameMode" "GameMode" NOT NULL,
    "totalWinnings" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "winRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Tournament
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "password" TEXT,
    "gameType" "TournamentGameType" NOT NULL DEFAULT 'TEXAS_HOLDEM',
    "entryFormat" "TournamentEntryFormat" NOT NULL DEFAULT 'REGULAR',
    "buyIn" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "fee" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "guaranteedPrizePool" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "bountyAmount" DECIMAL(20,2),
    "startingChips" INTEGER NOT NULL DEFAULT 10000,
    "blindStructure" "BlindStructureSpeed" NOT NULL DEFAULT 'REGULAR',
    "seatCap" INTEGER,
    "minPlayersToStart" INTEGER NOT NULL DEFAULT 2,
    "payoutStructure" "PayoutStructure" NOT NULL DEFAULT 'TOP_15_PERCENT',
    "startTime" TIMESTAMP(3) NOT NULL,
    "lateRegistration" "LateRegistrationWindow" NOT NULL DEFAULT 'SIXTY_MINUTES',
    "autoStart" BOOLEAN NOT NULL DEFAULT true,
    "rebuyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rebuyCost" DECIMAL(20,2),
    "rebuyChips" INTEGER,
    "addonEnabled" BOOLEAN NOT NULL DEFAULT false,
    "addonCost" DECIMAL(20,2),
    "addonChips" INTEGER,
    "maxReEntries" INTEGER,
    "reEntryWindow" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'ANNOUNCED',
    "currentBlindLevel" INTEGER NOT NULL DEFAULT 0,
    "tablesActive" INTEGER NOT NULL DEFAULT 0,
    "totalEntries" INTEGER NOT NULL DEFAULT 0,
    "playersRemaining" INTEGER NOT NULL DEFAULT 0,
    "actualPrizePool" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TournamentEntry
CREATE TABLE "TournamentEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rebuysUsed" INTEGER NOT NULL DEFAULT 0,
    "addonsUsed" INTEGER NOT NULL DEFAULT 0,
    "reEntriesUsed" INTEGER NOT NULL DEFAULT 0,
    "finishPosition" INTEGER,
    "prizeWon" DECIMAL(20,2),
    "eliminatedAt" TIMESTAMP(3),

    CONSTRAINT "TournamentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: LeaderboardStat
CREATE UNIQUE INDEX "LeaderboardStat_userId_timeframe_gameMode_key" ON "LeaderboardStat"("userId", "timeframe", "gameMode");
CREATE INDEX "LeaderboardStat_timeframe_gameMode_totalWinnings_idx" ON "LeaderboardStat"("timeframe", "gameMode", "totalWinnings" DESC);
CREATE INDEX "LeaderboardStat_userId_idx" ON "LeaderboardStat"("userId");

-- CreateIndex: Tournament
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");
CREATE INDEX "Tournament_startTime_idx" ON "Tournament"("startTime");
CREATE INDEX "Tournament_createdById_idx" ON "Tournament"("createdById");

-- CreateIndex: TournamentEntry
CREATE UNIQUE INDEX "TournamentEntry_tournamentId_userId_key" ON "TournamentEntry"("tournamentId", "userId");
CREATE INDEX "TournamentEntry_tournamentId_idx" ON "TournamentEntry"("tournamentId");
CREATE INDEX "TournamentEntry_userId_idx" ON "TournamentEntry"("userId");
CREATE INDEX "TournamentEntry_tournamentId_finishPosition_idx" ON "TournamentEntry"("tournamentId", "finishPosition");

-- CreateIndex: Transaction unique constraint on referenceId + type
CREATE UNIQUE INDEX "Transaction_referenceId_type_key" ON "Transaction"("referenceId", "type");

-- DropIndex: HandPlayerResult old single-column index
DROP INDEX IF EXISTS "HandPlayerResult_userId_idx";

-- CreateIndex: HandPlayerResult compound index
CREATE INDEX "HandPlayerResult_userId_handId_idx" ON "HandPlayerResult"("userId", "handId");

-- AddForeignKey: LeaderboardStat -> User
ALTER TABLE "LeaderboardStat" ADD CONSTRAINT "LeaderboardStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Tournament -> User (creator)
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: TournamentEntry -> Tournament
ALTER TABLE "TournamentEntry" ADD CONSTRAINT "TournamentEntry_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: TournamentEntry -> User
ALTER TABLE "TournamentEntry" ADD CONSTRAINT "TournamentEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
