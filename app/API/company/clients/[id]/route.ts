
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH: Mettre à jour un client
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
        const { name, address, phone, email, ice, contactPerson, contactPhone, contactEmail } = body;

        // Vérifier que le client existe
        const existingClient = await prisma.company.findUnique({
            where: { id: id }
        });

        if (!existingClient || existingClient.type !== 'CLIENT_COMPANY') {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const updatedClient = await prisma.company.update({
            where: { id: id },
            data: {
                name,
                address,
                phone,
                email,
                ice,
                contactPerson,
                contactPhone,
                contactEmail
            }
        });

        return NextResponse.json(updatedClient);

    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Supprimer un client
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

        // Vérifier que le client existe
        const existingClient = await prisma.company.findUnique({
            where: { id: id }
        });

        if (!existingClient || existingClient.type !== 'CLIENT_COMPANY') {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Vérifier s'il a des opérations liées
        const operationsCount = await prisma.operation.count({
            where: { clientId: id }
        });

        if (operationsCount > 0) {
            return NextResponse.json(
                { error: 'Impossible de supprimer ce client car il est lié à des opérations.' },
                { status: 400 }
            );
        }

        await prisma.company.delete({
            where: { id: id }
        });

        return NextResponse.json({ message: 'Client deleted successfully' });

    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
