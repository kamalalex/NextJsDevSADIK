
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// PATCH: Mettre à jour un sous-traitant
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
            name,
            companyName,
            phone,
            email,
            address,
            companyId: subcontractorCompanyId, // RC/IF
            paymentWithInvoice
        } = body;

        // Vérifier que le sous-traitant appartient à l'entreprise
        const existingSub = await prisma.subcontractor.findFirst({
            where: {
                id: id,
                transportCompanyId: user.companyId
            }
        });

        if (!existingSub) {
            return NextResponse.json({ error: 'Sous-traitant non trouvé' }, { status: 404 });
        }

        const updatedSubcontractor = await prisma.subcontractor.update({
            where: { id: id },
            data: {
                name,
                companyName,
                phone,
                email,
                address,
                companyId: subcontractorCompanyId,
                paymentWithInvoice
            }
        });

        return NextResponse.json(updatedSubcontractor);
    } catch (error) {
        console.error('Error updating subcontractor:', error);
        return NextResponse.json(
            { error: 'Error updating subcontractor' },
            { status: 500 }
        );
    }
}

// DELETE: Supprimer un sous-traitant
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

        // Vérifier que le sous-traitant appartient à l'entreprise
        const existingSub = await prisma.subcontractor.findFirst({
            where: {
                id: id,
                transportCompanyId: user.companyId
            }
        });

        if (!existingSub) {
            return NextResponse.json({ error: 'Sous-traitant non trouvé' }, { status: 404 });
        }

        // Vérifier s'il est utilisé dans des opérations
        const operationsCount = await prisma.operation.count({
            where: { subcontractorId: id }
        });

        if (operationsCount > 0) {
            return NextResponse.json(
                { error: 'Impossible de supprimer ce sous-traitant car il est lié à des opérations existantes.' },
                { status: 400 }
            );
        }

        await prisma.subcontractor.delete({
            where: { id: id }
        });

        return NextResponse.json({ message: 'Sous-traitant supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting subcontractor:', error);
        return NextResponse.json(
            { error: 'Error deleting subcontractor' },
            { status: 500 }
        );
    }
}
