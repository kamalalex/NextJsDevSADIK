import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting backfill for sadicCode...');

    // 1. Backfill Companies
    const allCompanies = await prisma.company.findMany();
    const companiesToUpdate = allCompanies.filter(c => !c.sadicCode);
    console.log(`Found ${companiesToUpdate.length} companies without sadicCode.`);

    for (const company of companiesToUpdate) {
        const prefix = company.type === 'TRANSPORT_COMPANY' ? 'TRP' : 'CLI';
        const code = `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
        await prisma.company.update({
            where: { id: company.id },
            data: { sadicCode: code }
        });
        console.log(`Updated company ${company.name} with code ${code}`);
    }

    // 2. Backfill Drivers
    const allDrivers = await prisma.driver.findMany();
    const driversToUpdate = allDrivers.filter(d => !d.sadicCode);
    console.log(`Found ${driversToUpdate.length} drivers without sadicCode.`);

    for (const driver of driversToUpdate) {
        const code = `DRV-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
        await prisma.driver.update({
            where: { id: driver.id },
            data: { sadicCode: code }
        });
        console.log(`Updated driver ${driver.name} with code ${code}`);
    }

    // 3. Backfill Subcontractors
    const allSubcontractors = await (prisma as any).subcontractor.findMany();
    const subcontractorsToUpdate = allSubcontractors.filter((s: any) => !s.sadicCode);
    console.log(`Found ${subcontractorsToUpdate.length} subcontractors without sadicCode.`);

    for (const sub of subcontractorsToUpdate) {
        const code = `SUB-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
        await (prisma as any).subcontractor.update({
            where: { id: sub.id },
            data: { sadicCode: code }
        });
        console.log(`Updated subcontractor ${sub.companyName} with code ${code}`);
    }

    console.log('Backfill completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
