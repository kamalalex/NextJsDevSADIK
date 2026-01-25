import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            companyName,
            phone,
            email,
            address,
            companyId: subcontractorCompanyId, // RC/IF
            paymentWithInvoice
        } = body;

        const sadicCode = `SUB-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

        const subcontractor = await prisma.subcontractor.create({
            data: {
                name,
                companyName,
                phone,
                email,
                address,
                companyId: subcontractorCompanyId,
                paymentWithInvoice,
                transportCompanyId: user.companyId,
                sadicCode
            }
        });

        return NextResponse.json(subcontractor);
    } catch (error) {
        console.error('Error creating subcontractor:', error);
        return NextResponse.json(
            { error: 'Error creating subcontractor' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const subcontractors = await prisma.subcontractor.findMany({
            where: {
                transportCompanyId: user.companyId,
                status: 'ACTIVE'
            },
            include: {
                vehicles: true,
                drivers: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(subcontractors);
    } catch (error) {
        console.error('Error fetching subcontractors:', error);
        return NextResponse.json(
            { error: 'Error fetching subcontractors' },
            { status: 500 }
        );
    }
}
