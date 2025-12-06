import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { days } = await request.json();
        const { id } = await params;
        const companyId = id;

        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        let currentEnd = company.trialEndsAt ? new Date(company.trialEndsAt) : new Date();
        // If trial already expired, start from today
        if (currentEnd < new Date()) {
            currentEnd = new Date();
        }

        currentEnd.setDate(currentEnd.getDate() + days);

        const updatedCompany = await prisma.company.update({
            where: { id: companyId },
            data: {
                trialEndsAt: currentEnd,
                subscriptionStatus: 'TRIAL', // Reactivate trial if it was expired
                isActive: true
            },
        });

        return NextResponse.json(updatedCompany);
    } catch (error) {
        console.error('Error extending trial:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
