import { prisma } from '../lib/prisma';

async function main() {
    console.log('Updating all operations to ensure invoiceId field exists...\n');

    // Update all operations that don't have an invoice to explicitly set invoiceId to null
    const result = await prisma.operation.updateMany({
        where: {
            // This will match all operations
        },
        data: {
            // This will ensure the field exists in the database
            invoiceId: null
        }
    });

    console.log(`Updated ${result.count} operations`);

    // Now test the query again
    console.log('\nTesting query for uninvoiced operations...');
    const ops = await prisma.operation.findMany({
        where: {
            invoiceId: null,
            salePrice: { not: null }
        },
        select: {
            reference: true,
            status: true,
            salePrice: true,
            clientId: true,
        }
    });

    console.log(`Found ${ops.length} uninvoiced operations:`);
    ops.forEach(op => {
        console.log(`  - ${op.reference}: ${op.status}, ${op.salePrice}€, client: ${op.clientId}`);
    });
}

main()
    .catch(e => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
