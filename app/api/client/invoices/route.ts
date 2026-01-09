import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch invoices for this client
        const invoices = await prisma.invoice.findMany({
            where: {
                clientId: user.companyId
            },
            include: {
                transportCompany: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        address: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error('Error fetching client invoices:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
