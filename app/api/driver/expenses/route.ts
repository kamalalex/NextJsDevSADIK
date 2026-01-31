
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

// GET: List own expenses
export async function GET(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload || !['EMPLOYED_DRIVER'].includes(userPayload.role)) {
            // Expenses are mainly for employed drivers? Or both?
            // User request mentioned "Internal drivers".
            // Adding protection for now.
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const driver = await prisma.driver.findFirst({
            where: { userId: userPayload.userId } // specific to user
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const expenses = await prisma.driverExpense.findMany({
            where: {
                driverId: driver.id
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(expenses);

    } catch (error: any) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Declare new expense
export async function POST(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload || !['EMPLOYED_DRIVER'].includes(userPayload.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const driver = await prisma.driver.findFirst({
            where: { userId: userPayload.userId }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const { type, amount, date, description } = await request.json();

        if (!type || !amount || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const expense = await prisma.driverExpense.create({
            data: {
                driverId: driver.id,
                type,
                amount: parseFloat(amount),
                date: new Date(date),
                description,
                status: 'PENDING'
            }
        });

        return NextResponse.json({ success: true, expense });

    } catch (error: any) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
