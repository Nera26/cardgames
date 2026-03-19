-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "processedById" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_processedById_idx" ON "Transaction"("processedById");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
