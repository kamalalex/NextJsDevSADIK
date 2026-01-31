
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function PUT(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload || !['COMPANY_ADMIN', 'COMPANY_OPERATOR'].includes(userPayload.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { expenseId, status, rejectionReason } = await request.json();

        if (!expenseId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const expense = await prisma.driverExpense.update({
            where: { id: expenseId },
            data: {
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null
            }
        });

        return NextResponse.json({ success: true, expense });

    } catch (error: any) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
