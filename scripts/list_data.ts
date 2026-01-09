
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({ take: 2 });
    console.log(users);

    console.log('--- OPERATIONS ---');
    const operations = await prisma.operation.findMany({ take: 1 });
    console.log(operations);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
