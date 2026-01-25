import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get IDs of linked companies (via Subcontractor relation)
        const mySubcontractors = await prisma.subcontractor.findMany({
            where: {
                transportCompanyId: user.companyId,
                linkedCompanyId: { not: null }
            },
            select: { linkedCompanyId: true }
        });

        const linkedCompanyIds = mySubcontractors
            .map(s => s.linkedCompanyId)
            .filter((id): id is string => id !== null);

        const drivers = await prisma.driver.findMany({
            where: {
                OR: [
                    // A. My own drivers
                    { companyId: user.companyId },
                    // B. Drivers of manual subcontractors (assigned via subcontractorId)
                    { subcontractor: { transportCompanyId: user.companyId } },
                    // C. Drivers of linked companies
                    { companyId: { in: linkedCompanyIds } }
                ]
            },
            include: {
                subcontractor: {
                    select: { companyName: true }
                },
                company: {
                    select: { name: true, type: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Compute source for frontend
        const enrichedDrivers = drivers.map(d => {
            let source = 'INTERNAL'; // Default
            let displayCompanyName = d.company?.name;

            if (d.isIndependent) {
                source = 'INDEPENDENT';
                displayCompanyName = 'Indépendant';
            } else if (d.subcontractor) {
                source = 'SUBCONTRACTOR'; // Manual ST
                displayCompanyName = d.subcontractor.companyName;
            } else if (d.companyId && d.companyId !== user.companyId) { // Check assuming string comparison
                // Wait, user.companyId is available here!
                source = 'LINKED_COMPANY';
                displayCompanyName = d.company?.name;
            }

            return {
                ...d,
                source,
                displayCompanyName
            };
        });

        return NextResponse.json(enrichedDrivers);
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
            subcontractorId,
            idCardFront,
            idCardBack,
            licenseFront,
            licenseBack,
            licenseCategory
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
            documents: documents || [],
            idCardFront,
            idCardBack,
            licenseFront,
            licenseBack,
            licenseCategory
        };

        if (subcontractorId) {
            data.subcontractorId = subcontractorId;
        } else {
            data.companyId = user.companyId;
        }

        const sadicCode = `DRV-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

        const driver = await prisma.driver.create({
            data: {
                ...data,
                sadicCode
            }
        });

        return NextResponse.json(driver);
    } catch (error) {
        console.error('Error creating driver:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
