import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OperationStatus } from '@prisma/client';

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
        const { status } = await request.json();

        if (!Object.values(OperationStatus).includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Vérifier que l'opération appartient bien à la compagnie
        const operation = await prisma.operation.findUnique({
            where: { id },
            select: { transportCompanyId: true }
        });

        if (!operation || operation.transportCompanyId !== user.companyId) {
            return NextResponse.json({ error: 'Operation not found or unauthorized' }, { status: 404 });
        }

        const updateData: any = { status };

        // Mettre à jour les timestamps selon le statut
        const now = new Date();
        if (status === 'CONFIRMED') updateData.confirmedAt = now;
        if (status === 'IN_PROGRESS') updateData.startedAt = now;
        if (status === 'DELIVERED') updateData.deliveredAt = now;

        const updatedOperation = await prisma.operation.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedOperation);

    } catch (error) {
        console.error('Error updating status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
