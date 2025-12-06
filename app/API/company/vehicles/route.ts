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

        const vehicles = await prisma.vehicle.findMany({
            where: {
                OR: [
                    { companyId: user.companyId },
                    { subcontractor: { transportCompanyId: user.companyId } }
                ]
            },
            include: {
                subcontractor: {
                    select: {
                        id: true,
                        companyName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(vehicles);
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
            subcontractorId
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
            ptac: ptac as PtacType,
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
