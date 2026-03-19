
import { PrismaClient } from '@prisma/client';
import { WalletService } from '../src/wallet/wallet.service';
import { ConfigService } from '@nestjs/config';
import { DepositDto, WithdrawDto, TransactionType, TransactionStatus } from '@poker/shared';

// Mock Config Service
const mockConfigService = {
    get: (key: string) => null,
} as any as ConfigService;

// Mock DTOs
const depositDto: DepositDto = { amount: 100, method: 'Test' };
// Withdraw exact amount of deposit
const withdrawDto: WithdrawDto = { amount: 100, comment: 'Race Test' };

const mockAuditService = { record: async () => { } } as any;
const mockRedisService = { getClient: () => ({ publish: async () => { } }) } as any;

async function runRaceTest() {
    const prisma = new PrismaClient();
    const walletService = new WalletService(prisma as any, mockConfigService, mockAuditService, mockRedisService);

    console.log('--- Starting Race Condition Test ---');

    // 1. Setup User and Wallet
    const user = await prisma.user.create({
        data: {
            email: `racetest_${Date.now()}@example.com`,
            username: `racer_${Date.now()}`,
            password: 'hash',
        }
    });
    console.log(`Created User: ${user.id}`);

    // Wallet auto-created or manual? Service does it on getBalance but verify here.
    const wallet = await walletService.createWallet(user.id);
    console.log(`Created Wallet: ${wallet.id} (Balance: ${wallet.realBalance})`);

    // 2. Deposit 100 (Single transaction to set state)
    await walletService.createDepositRequest(user.id, depositDto);
    // Manually approve it for test
    const tx = await prisma.transaction.findFirst({ where: { walletId: wallet.id, type: TransactionType.DEPOSIT } });
    if (tx) {
        await walletService.adminProcessTransaction(tx.id, TransactionStatus.APPROVED);
    }

    const initialBalance = await walletService.getBalance(user.id);
    console.log(`Initial Balance: ${initialBalance.realBalance}`); // Should be 100

    if (initialBalance.realBalance < 100) {
        console.error('Setup failed, balance not updated');
        return;
    }

    // 3. Race Condition: Try to withdraw 100 twice concurrently
    console.log('Attempting 2 concurrent withdrawals of 100...');

    const results = await Promise.allSettled([
        walletService.createWithdrawalRequest(user.id, withdrawDto),
        walletService.createWithdrawalRequest(user.id, withdrawDto)
    ]);

    // 4. Analyze Results
    let successCount = 0;
    let failCount = 0;

    results.forEach((res, index) => {
        if (res.status === 'fulfilled') {
            console.log(`Request ${index + 1}: SUCCESS`);
            successCount++;
        } else {
            console.log(`Request ${index + 1}: FAILED (${res.reason.message})`);
            failCount++;
        }
    });

    const finalBalance = await walletService.getBalance(user.id);
    console.log(`Final Balance: ${finalBalance.realBalance}`);

    if (successCount === 1 && failCount === 1 && finalBalance.realBalance === 0) {
        console.log('✅ TEST PASSED: Only one withdrawal succeeded.');
    } else {
        console.error('❌ TEST FAILED: Race condition likely occurred or logic failed.');
        console.error(`Expected 1 success, 1 fail. Got ${successCount} success, ${failCount} fail.`);
    }

    // Cleanup
    await prisma.transaction.deleteMany({ where: { walletId: wallet.id } });
    await prisma.wallet.delete({ where: { id: wallet.id } });
    await prisma.user.delete({ where: { id: user.id } });

    await prisma.$disconnect();
}

runRaceTest().catch(console.error);
