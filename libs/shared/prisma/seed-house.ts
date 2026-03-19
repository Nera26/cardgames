/**
 * Seed House Treasury User
 * 
 * Creates the HOUSE_TREASURY system user that collects rake revenue.
 * This user is type: HOUSE and has a wallet for storing platform revenue.
 * 
 * Run: npx ts-node prisma/seed-house.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🏦 Seeding House Treasury User...');

    // Generate a secure password hash (this account should never be used for login)
    const passwordHash = await bcrypt.hash('SYSTEM_ACCOUNT_NO_LOGIN_' + Date.now(), 10);

    const houseUser = await prisma.user.upsert({
        where: { username: 'HOUSE_TREASURY' },
        update: {}, // Don't override if exists
        create: {
            username: 'HOUSE_TREASURY',
            email: 'treasury@pokerhub.internal',
            password: passwordHash,
            type: 'HOUSE',
            role: 'USER',
            isVerified: true,
            isBanned: false,
            bio: 'Platform Revenue Account',
            tier: 'DIAMOND', // Cosmetic only
            wallet: {
                create: {
                    realBalance: 0,
                    bonusBalance: 0,
                }
            }
        },
        include: {
            wallet: true,
        }
    });

    console.log('✅ House Treasury User created/verified:');
    console.log(`   ID: ${houseUser.id}`);
    console.log(`   Username: ${houseUser.username}`);
    console.log(`   Type: ${houseUser.type}`);
    console.log(`   Wallet ID: ${houseUser.wallet?.id}`);
    console.log(`   Balance: $${houseUser.wallet?.realBalance || 0}`);
}

main()
    .then(() => {
        console.log('🎉 Seed complete!');
        process.exit(0);
    })
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
