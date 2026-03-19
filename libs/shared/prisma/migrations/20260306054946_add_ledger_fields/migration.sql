-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "balanceAfter" DECIMAL(20,2),
ADD COLUMN     "balanceBefore" DECIMAL(20,2),
ADD COLUMN     "referenceId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_referenceId_idx" ON "Transaction"("referenceId");
