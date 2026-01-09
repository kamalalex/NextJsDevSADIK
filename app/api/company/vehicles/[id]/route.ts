import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { VehicleType, PtacType } from '@prisma/client';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const {
            plateNumber,
            model,
            brand,
            vehicleType,
            ptac,
            firstCirculationDate,
            technicalInspectionDate,
            insuranceDate,
            status,
            subcontractorId,
            length,
            width,
            height,
            registrationFront,
            registrationBack,
            vehiclePhoto
        } = body;

        const existingVehicle = await prisma.vehicle.findFirst({
            where: {
                id,
                OR: [
                    { companyId: user.companyId },
                    { subcontractor: { transportCompanyId: user.companyId } }
                ]
            }
        });

        if (!existingVehicle) {
            return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 });
        }

        const data: any = {
            plateNumber,
            model,
            brand,
            vehicleType: vehicleType as VehicleType,
            ptac: ptac as PtacType,
            status,
            firstCirculationDate: firstCirculationDate ? new Date(firstCirculationDate) : null,
            technicalInspectionDate: technicalInspectionDate ? new Date(technicalInspectionDate) : null,
            insuranceDate: insuranceDate ? new Date(insuranceDate) : null,
            length,
            width,
            height,
            registrationFront,
            registrationBack,
            vehiclePhoto
        };

        if (subcontractorId) {
            data.subcontractorId = subcontractorId;
            data.companyId = null;
        } else {
            data.companyId = user.companyId;
            data.subcontractorId = null;
        }

        const updatedVehicle = await prisma.vehicle.update({
            where: { id },
            data
        });

        return NextResponse.json(updatedVehicle);
    } catch (error) {
        console.error('Error updating vehicle:', error);
        return NextResponse.json({ error: 'Error updating vehicle' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const existingVehicle = await prisma.vehicle.findFirst({
            where: {
                id,
                OR: [
                    { companyId: user.companyId },
                    { subcontractor: { transportCompanyId: user.companyId } }
                ]
            }
        });

        if (!existingVehicle) {
            return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 });
        }

        const operationsCount = await prisma.operation.count({
            where: { assignedVehicleId: id }
        });

        if (operationsCount > 0) {
            return NextResponse.json(
                { error: 'Impossible de supprimer ce véhicule car il est lié à des opérations existantes.' },
                { status: 400 }
            );
        }

        await prisma.vehicle.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Véhicule supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        return NextResponse.json({ error: 'Error deleting vehicle' }, { status: 500 });
    }
}
