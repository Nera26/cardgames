import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial tables...');

    const tables = [
        {
            name: 'The Big Game',
            smallBlind: 10,
            bigBlind: 20,
            minBuyIn: 1000,
            maxBuyIn: 10000,
            maxSeats: 9,
            isActive: true,
        },
        {
            name: 'Micro Grinders',
            smallBlind: 0.1,
            bigBlind: 0.2,
            minBuyIn: 10,
            maxBuyIn: 100,
            maxSeats: 6,
            isActive: true,
        },
        {
            name: 'High Roller Room',
            smallBlind: 100,
            bigBlind: 200,
            minBuyIn: 10000,
            maxBuyIn: 100000,
            maxSeats: 9,
            isActive: false, // Start as inactive/paused
        },
    ];

    for (const table of tables) {
        const created = await prisma.gameTable.upsert({
            where: { id: table.name === 'The Big Game' ? 'big-game-id' : table.name.toLowerCase().replace(/ /g, '-') },
            update: {},
            create: {
                id: table.name === 'The Big Game' ? 'big-game-id' : table.name.toLowerCase().replace(/ /g, '-'),
                ...table,
            },
        });
        console.log(`Created/Updated table: ${created.name}`);
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
