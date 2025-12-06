import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { driverId, vehicleId, subcontractorId, salePrice, purchasePrice } = await request.json();

        // Vérifier que l'opération appartient bien à la compagnie
        const operation = await prisma.operation.findUnique({
            where: { id },
            select: { transportCompanyId: true }
        });

        if (!operation || operation.transportCompanyId !== user.companyId) {
            return NextResponse.json({ error: 'Operation not found or unauthorized' }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {
            assignedDriverId: driverId || null,
            assignedVehicleId: vehicleId || null,
        };

        // Pricing
        if (salePrice !== undefined && salePrice !== null) {
            updateData.salePrice = salePrice;
        }
        if (purchasePrice !== undefined && purchasePrice !== null) {
            updateData.purchasePrice = purchasePrice;
        }

        // If using a subcontractor
        if (subcontractorId) {
            updateData.subcontractorId = subcontractorId;
            updateData.subcontractedByCompany = true;
        } else {
            updateData.subcontractorId = null;
            updateData.subcontractedByCompany = false;
            updateData.purchasePrice = null; // Clear purchase price if not using subcontractor
        }

        // Auto-confirm if resources assigned
        if (driverId && vehicleId) {
            updateData.status = 'CONFIRMED';
        }

        // Mise à jour
        const updatedOperation = await prisma.operation.update({
            where: { id },
            data: updateData,
            include: {
                assignedDriver: true,
                assignedVehicle: true,
                subcontractor: true
            }
        });

        return NextResponse.json(updatedOperation);

    } catch (error) {
        console.error('Error assigning resources:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
