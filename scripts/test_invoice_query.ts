import { prisma } from '../lib/prisma';

async function main() {
    const transportCompanyId = '6910e0b4ca9cdee76bfd404a';
    const clientId = '6910e0b4ca9cdee76bfd404b';

    console.log('Testing invoice generator query...\n');

    // This is what the invoice generator is doing
    console.log('1. Fetching operations with clientId and notInvoiced filter:');
    const ops1 = await prisma.operation.findMany({
        where: {
            transportCompanyId: transportCompanyId,
            clientId: clientId,
            invoiceId: null
        },
        select: {
            id: true,
            reference: true,
            status: true,
            salePrice: true,
            invoiceId: true,
        }
    });

    console.log(`   Found ${ops1.length} operations`);
    ops1.forEach(op => {
        console.log(`   - ${op.reference}: status=${op.status}, salePrice=${op.salePrice}, invoiceId=${op.invoiceId}`);
    });

    console.log('\n2. Filtering for CONFIRMED or DELIVERED:');
    const filtered = ops1.filter(op => op.status === 'CONFIRMED' || op.status === 'DELIVERED');
    console.log(`   After filter: ${filtered.length} operations`);
    filtered.forEach(op => {
        console.log(`   - ${op.reference}: status=${op.status}`);
    });

    console.log('\n3. Testing financial stats query:');
    const uninvoicedOps = await prisma.operation.findMany({
        where: {
            transportCompanyId: transportCompanyId,
            invoiceId: null,
            salePrice: { not: null }
        },
        select: { salePrice: true, reference: true }
    });
    console.log(`   Found ${uninvoicedOps.length} uninvoiced operations`);
    const total = uninvoicedOps.reduce((sum, op) => sum + (op.salePrice || 0), 0);
    console.log(`   Total uninvoiced: ${total}`);
}

main()
    .catch(e => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
