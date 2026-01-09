import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const pendingValidations = await prisma.user.count({
            where: { isActive: false },
        });

        const activeCompanies = await prisma.company.count({
            where: { isActive: true },
        });

        const activeDrivers = await prisma.driver.count({
            where: { isIndependent: true, status: 'ACTIVE' },
        });

        // Count companies with trials expiring in the next 7 days
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const expiringTrials = await prisma.company.count({
            where: {
                subscriptionStatus: 'TRIAL',
                trialEndsAt: {
                    lte: nextWeek,
                    gte: new Date()
                }
            },
        });

        return NextResponse.json({
            pendingValidations,
            activeCompanies,
            activeDrivers,
            expiringTrials,
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
