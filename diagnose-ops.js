const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking all operations...');
        const operations = await prisma.operation.findMany({
            select: { status: true }
        });
        console.log('Total operations found:', operations.length);

        const statuses = [...new Set(operations.map(op => op.status))];
        console.log('Unique operation statuses found:', statuses);

    } catch (e) {
        console.error('DIAGNOSTIC_ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
