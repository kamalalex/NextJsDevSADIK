import { prisma } from '../lib/prisma';

async function main() {
    console.log('Fetching all operations...');
    const operations = await prisma.operation.findMany({
        select: {
            id: true,
            reference: true,
            status: true,
            clientId: true,
            transportCompanyId: true,
            salePrice: true,
            purchasePrice: true,
            invoiceId: true,
            subcontractorPaid: true,
            paymentStatus: true,
        }
    });

    console.log(`Found ${operations.length} operations.\n`);

    operations.forEach(op => {
        console.log(`Operation ${op.reference}:`);
        console.log(`  ID: ${op.id}`);
        console.log(`  Status: ${op.status}`);
        console.log(`  Client ID: ${op.clientId}`);
        console.log(`  Transport Company ID: ${op.transportCompanyId}`);
        console.log(`  Sale Price: ${op.salePrice}`);
        console.log(`  Invoice ID: ${op.invoiceId}`);
        console.log(`  Subcontractor Paid: ${op.subcontractorPaid}`);
        console.log(`  Payment Status: ${op.paymentStatus}`);
        console.log('---');
    });

    // Also fetch companies to see IDs
    console.log('\nFetching companies...');
    const companies = await prisma.company.findMany({
        select: {
            id: true,
            name: true,
            type: true,
        }
    });

    companies.forEach(company => {
        console.log(`${company.type}: ${company.name} (${company.id})`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
