
import { prisma } from '@/lib/prisma';

const DRIVER_ID = '692c6f9cf39a09044a3edd22'; // Driss
const COMPANY_ID = '674c23ef34a810931584c6c1'; // Using existing company ID from env or previous logs (assuming one exists or using user.companyId logic)
// Actually I need a valid company ID too.
// Let's first finding a valid company.

async function main() {
    // Find a transport company
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No transport company found to attach operation to.');
        return;
    }

    const operation = await prisma.operation.create({
        data: {
            reference: 'TEST-TRACKING-001',
            status: 'PENDING',
            transportCompanyId: company.id,
            assignedDriverId: DRIVER_ID,
            operationDate: new Date(),
            vehicleType: 'FOURGON',
            ptac: 'PTAC_3_5T',
            totalWeight: 1000,
            createdById: '6910e0b6ca9cdee76bfd404d', // Use a valid user ID (e.g., admin or the driver's user ID)
            loadingPoints: [{ address: 'Test Loading', date: new Date().toISOString() }],
            unloadingPoints: [{ address: 'Test Unloading', date: new Date().toISOString() }]
        }
    });

    console.log('Created Operation:', operation.id);
    // Also create a DriverAssignment record usually?
    // The API checks both.
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
