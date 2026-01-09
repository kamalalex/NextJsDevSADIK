
import { prisma } from '@/lib/prisma';

const DRIVER_ID = '692c6f9cf39a09044a3edd22'; // Driss

async function main() {
    const operations = await prisma.operation.findMany({
        where: {
            OR: [
                { assignedDriverId: DRIVER_ID },
                {
                    assignedDrivers: {
                        some: { driverId: DRIVER_ID }
                    }
                }
            ]
        }
    });

    if (operations.length === 0) {
        console.log('No operations found for driver Driss.');
        // Create a dummy one?
    } else {
        console.log('Found operations:', operations.map(o => ({ id: o.id, ref: o.reference })));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
