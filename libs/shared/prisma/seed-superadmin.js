/**
 * ════════════════════════════════════════════════════════════════
 * 🔵 Blue Cable — Superadmin + House Treasury Seeder
 *
 * Runs on EVERY container start (idempotent via upsert).
 * - Creates SUPERADMIN account if it doesn't exist
 * - Creates HOUSE_TREASURY system user if it doesn't exist
 * - Prints credentials to Docker logs ONLY on first creation
 *
 * Plain JS so it runs directly with `node` in production containers.
 * ════════════════════════════════════════════════════════════════
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@pokerhub.com';
const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME || 'superadmin';
// Generate a secure random password if not provided via env
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');

async function seedSuperadmin() {
    // Check if any superadmin already exists
    const existing = await prisma.user.findFirst({
        where: {
            OR: [
                { email: SUPERADMIN_EMAIL },
                { username: SUPERADMIN_USERNAME },
                { role: 'SUPERADMIN' },
            ],
        },
    });

    if (existing) {
        console.log('');
        console.log('🛡️  Superadmin already exists — skipping creation.');
        console.log('   Username: ' + existing.username);
        console.log('   Email:    ' + existing.email);
        console.log('   ID:       ' + existing.id);
        console.log('');
        return;
    }

    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

    const superadmin = await prisma.user.create({
        data: {
            email: SUPERADMIN_EMAIL,
            username: SUPERADMIN_USERNAME,
            password: hashedPassword,
            role: 'SUPERADMIN',
            type: 'PLAYER',
            isVerified: true,
            isBanned: false,
            bio: 'Platform Super Administrator',
            tier: 'DIAMOND',
            wallet: {
                create: {
                    realBalance: 0,
                    bonusBalance: 0,
                },
            },
        },
    });

    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('🛡️  SUPERADMIN ACCOUNT CREATED');
    console.log('════════════════════════════════════════════════════════════');
    console.log('   ID:       ' + superadmin.id);
    console.log('   Email:    ' + SUPERADMIN_EMAIL);
    console.log('   Username: ' + SUPERADMIN_USERNAME);
    console.log('   Password: ' + SUPERADMIN_PASSWORD);
    console.log('════════════════════════════════════════════════════════════');
    console.log('⚠️  SAVE THESE CREDENTIALS — they will NOT be shown again!');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');
}

async function seedHouseTreasury() {
    const existing = await prisma.user.findUnique({
        where: { username: 'HOUSE_TREASURY' },
    });

    if (existing) {
        console.log('🏦 House Treasury already exists — skipping.');
        return;
    }

    const passwordHash = await bcrypt.hash('SYSTEM_ACCOUNT_NO_LOGIN_' + Date.now(), 10);

    const houseUser = await prisma.user.create({
        data: {
            username: 'HOUSE_TREASURY',
            email: 'treasury@pokerhub.internal',
            password: passwordHash,
            type: 'HOUSE',
            role: 'USER',
            isVerified: true,
            isBanned: false,
            bio: 'Platform Revenue Account',
            tier: 'DIAMOND',
            wallet: {
                create: {
                    realBalance: 0,
                    bonusBalance: 0,
                },
            },
        },
    });

    console.log('🏦 House Treasury created (ID: ' + houseUser.id + ')');
}

async function main() {
    console.log('🔵 Blue Cable — Running system seed...');
    await seedSuperadmin();
    await seedHouseTreasury();
    console.log('✅ System seed complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
