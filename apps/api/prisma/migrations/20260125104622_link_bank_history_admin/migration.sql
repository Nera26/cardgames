-- AddForeignKey
ALTER TABLE "BankConfigHistory" ADD CONSTRAINT "BankConfigHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
