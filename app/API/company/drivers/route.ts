import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const drivers = await prisma.driver.findMany({
            where: {
                OR: [
                    { companyId: user.companyId },
                    { subcontractor: { transportCompanyId: user.companyId } }
                ]
            },
            include: {
                subcontractor: {
                    select: {
                        companyName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(drivers);
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
        const {
            name,
            email,
            phone,
            license,
            cin,
            licenseDate,
            documents,
            subcontractorId
        } = body;

        // Check if driver with this email already exists
        if (email) {
            const existingDriver = await prisma.driver.findFirst({
                where: { email }
            });

            if (existingDriver) {
                return NextResponse.json(
                    { error: 'Un chauffeur avec cet email existe déjà' },
                    { status: 400 }
                );
            }
        }

        const data: any = {
            name,
            email,
            phone,
            license,
            status: 'ACTIVE',
            isIndependent: false,
            cin,
            licenseDate: licenseDate ? new Date(licenseDate) : null,
            documents: documents || []
        };

        if (subcontractorId) {
            data.subcontractorId = subcontractorId;
        } else {
            data.companyId = user.companyId;
        }

        const driver = await prisma.driver.create({
            data
        });

        return NextResponse.json(driver);
    } catch (error) {
        console.error('Error creating driver:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
