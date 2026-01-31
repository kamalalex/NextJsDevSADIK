
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload || !['COMPANY_ADMIN', 'COMPANY_OPERATOR'].includes(userPayload.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { driverId, baseSalary } = await request.json();

        if (!driverId || baseSalary === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const driver = await prisma.driver.update({
            where: { id: driverId },
            data: {
                baseSalary: parseFloat(baseSalary)
            }
        });

        return NextResponse.json({ success: true, driver });

    } catch (error: any) {
        console.error('Error updating salary:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
