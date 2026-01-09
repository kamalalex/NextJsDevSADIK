const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting migration of InvoiceStatus values...');

        // We can't use prisma.invoice.updateMany because it validates the status
        // So we use raw MongoDB command to update the documents
        const db = prisma.$connect().then(() => {
            // Prisma doesn't expose the raw driver easily for such deep changes without the enum being in the schema
            // But we can try to find them first
        });

        // Actually, the easiest way is to temporarily add the old values to schema.prisma
        // OR use raw database access. Since this is MongoDB and Prisma, we can use $runCommand

        console.log('Updating PAYEE to PAID...');
        const res1 = await prisma.$runCommandRaw({
            update: "invoices",
            updates: [
                {
                    q: { status: "PAYEE" },
                    u: { $set: { status: "PAID" } },
                    multi: true
                }
            ]
        });
        console.log('Updated PAYEE:', res1);

        console.log('Updating EN_ATTENTE to SENT...');
        const res2 = await prisma.$runCommandRaw({
            update: "invoices",
            updates: [
                {
                    q: { status: "EN_ATTENTE" },
                    u: { $set: { status: "SENT" } },
                    multi: true
                }
            ]
        });
        console.log('Updated EN_ATTENTE:', res2);

        console.log('Updating ANNULEE to CANCELLED...');
        const res3 = await prisma.$runCommandRaw({
            update: "invoices",
            updates: [
                {
                    q: { status: "ANNULEE" },
                    u: { $set: { status: "CANCELLED" } },
                    multi: true
                }
            ]
        });
        console.log('Updated ANNULEE:', res3);

        console.log('Migration complete!');

    } catch (e) {
        console.error('MIGRATION_ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
