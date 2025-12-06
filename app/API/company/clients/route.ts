import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Pour l'instant, on retourne toutes les compagnies de type CLIENT
        // Idéalement, on filtrerait celles avec qui on a des opérations
        const clients = await prisma.company.findMany({
            where: { type: 'CLIENT_COMPANY' },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(clients);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, address, phone, email } = body;

        const client = await prisma.company.create({
            data: {
                name,
                address,
                phone,
                email,
                type: 'CLIENT_COMPANY',
                isActive: true
            }
        });

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
