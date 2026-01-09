
import { prisma } from '@/lib/prisma';

async function generateCodes() {
    console.log('--- Backfilling System IDs ---');

    const companies = await prisma.company.findMany({
        where: { sadicCode: null }
    });

    console.log(`Found ${companies.length} companies without codes.`);

    for (const company of companies) {
        let prefix = 'CMP';
        if (company.type === 'TRANSPORT_COMPANY') prefix = 'TRP';
        if (company.type === 'CLIENT_COMPANY') prefix = 'CLI';

        const newCode = `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

        await prisma.company.update({
            where: { id: company.id },
            data: { sadicCode: newCode }
        });
        console.log(`✅ Generated ${newCode} for ${company.name}`);
    }

    console.log('--- Done ---');
}

generateCodes()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
