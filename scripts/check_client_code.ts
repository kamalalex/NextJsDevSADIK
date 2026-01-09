
import { prisma } from '@/lib/prisma';

async function checkAndFixClientCode() {
    console.log('--- Checking Client Sadic Code ---');

    // Find the client used in the logs
    const clientEmail = 'client@entreprise.com'; // Based on logs
    const user = await prisma.user.findFirst({
        where: { email: clientEmail },
        include: { company: true }
    });

    if (!user) {
        console.error('❌ User not found:', clientEmail);
        return;
    }

    if (!user.company) {
        console.error('❌ User has no company attached.');
        return;
    }

    console.log(`Found Company: ${user.company.name} (${user.company.id})`);
    console.log(`Current Code: ${user.company.sadicCode}`);

    if (!user.company.sadicCode) {
        console.log('⚠️ Code is missing. Generating one...');
        const newCode = `CLI-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

        await prisma.company.update({
            where: { id: user.company.id },
            data: { sadicCode: newCode }
        });
        console.log(`✅ Default code generated: ${newCode}`);
    } else {
        console.log('✅ Code exists.');
    }
}

checkAndFixClientCode()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
