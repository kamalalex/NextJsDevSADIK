
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Dropping index drivers_userId_key...');
        try {
            await prisma.$runCommandRaw({
                dropIndexes: "drivers",
                index: "drivers_userId_key"
            });
            console.log('Index dropped.');
        } catch (e) {
            console.log('Index might not exist or error dropping:', e.message);
        }

        console.log('Recreating index as sparse...');
        await prisma.$runCommandRaw({
            createIndexes: "drivers",
            indexes: [
                {
                    key: { userId: 1 },
                    name: "drivers_userId_key",
                    unique: true,
                    sparse: true
                }
            ]
        });
        console.log('Index recreated as sparse.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
