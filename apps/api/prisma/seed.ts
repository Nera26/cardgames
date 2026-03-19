import { PrismaClient, Role, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            username: 'AdminUser',
            password: hashedPassword,
            role: Role.SUPERADMIN,
            tier: 'DIAMOND',
            isVerified: true,
            wallet: {
                create: {
                    realBalance: new Prisma.Decimal(10000),
                    bonusBalance: new Prisma.Decimal(500)
                }
            }
        },
    });

    console.log({ user });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
