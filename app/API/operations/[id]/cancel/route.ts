import { NextResponse } from 'next/server';
// Force rebuild
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = verifyAuth(request as any); // Cast needed because verifyAuth expects NextRequest but we might get Request
        if (!authUser) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { reason } = body;

        if (!reason) {
            return NextResponse.json(
                { error: 'Le motif d\'annulation est requis' },
                { status: 400 }
            );
        }

        // Récupérer l'opération pour vérifier les droits et le statut
        const operation = await prisma.operation.findUnique({
            where: { id },
            include: {
                createdBy: true
            }
        });

        if (!operation) {
            return NextResponse.json(
                { error: 'Opération non trouvée' },
                { status: 404 }
            );
        }

        // Vérifier que l'utilisateur est bien le créateur (ou admin)
        // OU s'il appartient à la compagnie cliente ou transporteur associée
        let hasPermission = false;

        if (authUser.role === 'SUPER_ADMIN') {
            hasPermission = true;
        } else if (operation.createdById === authUser.userId) {
            hasPermission = true;
        } else {
            const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
            
            if (user?.companyId) {
                // Vérifier si l'utilisateur appartient à la même compagnie que le créateur
                const creator = await prisma.user.findUnique({ where: { id: operation.createdById } });
                if (creator?.companyId && user.companyId === creator.companyId) {
                    hasPermission = true;
                }
                
                // Vérifier si l'utilisateur appartient à la compagnie cliente de l'opération
                if (operation.clientId && user.companyId === operation.clientId) {
                    hasPermission = true;
                }

                // Vérifier si l'utilisateur appartient à la compagnie de transport de l'opération
                if (operation.transportCompanyId && user.companyId === operation.transportCompanyId) {
                    hasPermission = true;
                }
            }
        }

        if (!hasPermission) {
            return NextResponse.json(
                { error: 'Vous n\'avez pas les droits pour annuler cette opération' },
                { status: 403 }
            );
        }

        // Vérifier le statut
        const allowedStatuses = ['PENDING', 'EN_ATTENTE', 'CONFIRMED', 'CONFIRME'];
        if (!allowedStatuses.includes(operation.status)) {
            return NextResponse.json(
                { error: 'Cette opération ne peut plus être annulée' },
                { status: 400 }
            );
        }

        // Effectuer l'annulation
        const updatedOperation = await prisma.operation.update({
            where: { id },
            data: {
                status: 'CANCELLED', // ou 'ANNULE' selon votre enum
                cancellationReason: reason,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(updatedOperation);

    } catch (error) {
        console.error('Erreur annulation opération:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de l\'annulation' },
            { status: 500 }
        );
    }
}
