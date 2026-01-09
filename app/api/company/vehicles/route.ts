import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VehicleType, PtacType } from '@prisma/client';

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

        const vehicles = await prisma.vehicle.findMany({
            where: {
                OR: [
                    // A. My own vehicles
                    { companyId: user.companyId },
                    // B. Vehicles of manual subcontractors
                    { subcontractor: { transportCompanyId: user.companyId } },
                    // C. Vehicles of linked companies
                    { companyId: { in: linkedCompanyIds } }
                ]
            },
            include: {
                subcontractor: {
                    select: { id: true, companyName: true }
                },
                company: {
                    select: { name: true, type: true }
                },
                driver: {
                    select: { isIndependent: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Compute source for frontend
        const enrichedVehicles = vehicles.map(v => {
            let source = 'INTERNAL';
            let displayCompanyName = v.company?.name;

            if (v.subcontractor) {
                source = 'SUBCONTRACTOR';
                displayCompanyName = v.subcontractor.companyName;
            } else if (v.driver?.isIndependent) {
                source = 'INDEPENDENT';
                displayCompanyName = 'Indépendant';
            } else if (v.companyId && v.companyId !== user.companyId) {
                source = 'LINKED_COMPANY';
                displayCompanyName = v.company?.name;
            }

            return {
                ...v,
                source,
                displayCompanyName
            };
        });

        return NextResponse.json(enrichedVehicles);
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
            plateNumber,
            model,
            capacity,
            vehicleType,
            brand,
            firstCirculationDate,
            technicalInspectionDate,
            insuranceDate,
            documents,
            ptac,
            subcontractorId,
            length,
            width,
            height,
            registrationFront,
            registrationBack,
            vehiclePhoto
        } = body;

        const data: any = {
            plateNumber,
            model,
            capacity,
            vehicleType: vehicleType as VehicleType,
            status: 'ACTIVE',
            brand,
            firstCirculationDate: firstCirculationDate ? new Date(firstCirculationDate) : null,
            technicalInspectionDate: technicalInspectionDate ? new Date(technicalInspectionDate) : null,
            insuranceDate: insuranceDate ? new Date(insuranceDate) : null,
            documents: documents || [],
            registrationFront,
            registrationBack,
            vehiclePhoto,
            ptac: ptac as PtacType,
            length,
            width,
            height,
        };

        if (subcontractorId) {
            data.subcontractorId = subcontractorId;
        } else {
            data.companyId = user.companyId;
        }

        const vehicle = await prisma.vehicle.create({
            data
        });

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error('Error creating vehicle:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
