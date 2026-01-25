
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

        // Nouveau comportement : DÉLIER au lieu de SUPPRIMER
        // On ne vérifie pas les opérations car on veut juste retirer le client de la liste de l'entreprise courante.
        // Le client (Company) reste en base de données pour l'historique.

        const currentCompany = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { linkedClientIds: true }
        });

        if (currentCompany) {
            const updatedLinkedIds = currentCompany.linkedClientIds.filter(clientId => clientId !== id);

            await prisma.company.update({
                where: { id: user.companyId },
                data: {
                    linkedClientIds: updatedLinkedIds
                }
            });
        }

        // Optionnel : Nettoyer aussi les liens partenaires s'ils existent
        // (ex: si le transporteur avait ajouté ce client comme partenaire via SADIC)
        const partnerLink = await prisma.subcontractor.findFirst({
            where: {
                transportCompanyId: user.companyId,
                linkedCompanyId: id
            }
        });

        if (partnerLink) {
            await prisma.subcontractor.delete({
                where: { id: partnerLink.id }
            });
        }

        return NextResponse.json({ message: 'Client retiré de votre liste avec succès' });

    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
