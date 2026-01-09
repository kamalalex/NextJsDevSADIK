
import { prisma } from '@/lib/prisma';

async function main() {
    const drivers = await prisma.driver.findMany({
        include: { user: true }
    });

    if (drivers.length === 0) {
        console.log('No drivers found.');
    } else {
        console.log('Found drivers:', drivers.map(d => ({
            driverId: d.id,
            userId: d.userId,
            name: d.name,
            email: d.email
        })));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
