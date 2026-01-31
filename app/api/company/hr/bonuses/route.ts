
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload || !['COMPANY_ADMIN', 'COMPANY_OPERATOR'].includes(userPayload.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { driverId, amount, reason, date } = await request.json();

        if (!driverId || !amount || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const bonus = await prisma.driverBonus.create({
            data: {
                driverId,
                amount: parseFloat(amount),
                reason,
                date: date ? new Date(date) : new Date()
            }
        });

        return NextResponse.json({ success: true, bonus });

    } catch (error: any) {
        console.error('Error creating bonus:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
