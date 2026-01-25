import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany({
        select: { id: true, name: true, sadicCode: true }
    });
    console.log('Companies:', companies.map(c => ({ name: c.name, code: c.sadicCode })));

    const drivers = await prisma.driver.findMany({
        select: { id: true, name: true, sadicCode: true }
    });
    console.log('Drivers:', drivers.map(d => ({ name: d.name, code: d.sadicCode })));

    const subcontractors = await prisma.subcontractor.findMany({
        select: { id: true, companyName: true, sadicCode: true }
    });
    console.log('Subcontractors:', subcontractors.map(s => ({ name: s.companyName, code: s.sadicCode })));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
