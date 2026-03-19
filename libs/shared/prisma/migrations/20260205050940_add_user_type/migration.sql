-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('PLAYER', 'HOUSE', 'BOT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "type" "UserType" NOT NULL DEFAULT 'PLAYER';
