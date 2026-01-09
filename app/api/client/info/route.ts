
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: {
                name: true,
                sadicCode: true,
                email: true,
                phone: true,
                address: true,
                ice: true
            }
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('Error fetching client info:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
