const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Prisma connection...');
        const count = await prisma.company.count();
        console.log('Company count:', count);

        console.log('Testing Invoice query...');
        const invoices = await prisma.invoice.findMany({
            take: 1,
            include: {
                client: true,
                items: true,
                installments: true
            }
        });
        console.log('Invoice query success, found:', invoices.length);

        console.log('Testing Operation query...');
        const operations = await prisma.operation.findMany({
            take: 1
        });
        console.log('Operation query success, found:', operations.length);

    } catch (e) {
        console.error('DIAGNOSTIC_ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
