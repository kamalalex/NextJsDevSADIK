
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload || !['COMPANY_ADMIN', 'COMPANY_OPERATOR'].includes(userPayload.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params; // Await params in newer Next.js

        // Get current month date range
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const driver = await prisma.driver.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                baseSalary: true,
                user: true,
                bonuses: {
                    orderBy: { date: 'desc' }
                },
                expenses: {
                    orderBy: { date: 'desc' }
                },
                assignments: {
                    where: {
                        createdAt: {
                            gte: start,
                            lte: end
                        },
                        status: 'TERMINE'
                    }
                }
            }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        return NextResponse.json(driver);

    } catch (error: any) {
        console.error('Error fetching driver details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
