
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const drivers = await prisma.driver.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                userId: true
            }
        });
        console.log('Existing Drivers:');
        console.table(drivers);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
