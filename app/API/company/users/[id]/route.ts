
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH: Mettre à jour un utilisateur (ex: activer/désactiver)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userPayload = verifyAuth(request);
        // Vérification des droits : Doit être ADMIN de l'entreprise
        if (!userPayload || !userPayload.companyId || userPayload.role !== 'COMPANY_ADMIN') {
            return NextResponse.json(
                { error: 'Seuls les administrateurs peuvent modifier des utilisateurs' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Empêcher de modifier son propre statut
        if (id === userPayload.userId && body.isActive === false) {
            return NextResponse.json(
                { error: 'Vous ne pouvez pas désactiver votre propre compte' },
                { status: 400 }
            );
        }

        // Vérifier que l'utilisateur appartient bien à l'entreprise
        const targetUser = await prisma.user.findFirst({
            where: {
                id: id,
                companyId: userPayload.companyId
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: body,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                avatar: true,
                createdAt: true,
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Erreur modification utilisateur:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// DELETE: Supprimer un utilisateur
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userPayload = verifyAuth(request);
        // Vérification des droits : Doit être ADMIN de l'entreprise
        if (!userPayload || !userPayload.companyId || userPayload.role !== 'COMPANY_ADMIN') {
            return NextResponse.json(
                { error: 'Seuls les administrateurs peuvent supprimer des utilisateurs' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Empêcher de se supprimer soi-même
        if (id === userPayload.userId) {
            return NextResponse.json(
                { error: 'Vous ne pouvez pas supprimer votre propre compte' },
                { status: 400 }
            );
        }

        // Vérifier que l'utilisateur appartient bien à l'entreprise
        const targetUser = await prisma.user.findFirst({
            where: {
                id: id,
                companyId: userPayload.companyId
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        await prisma.user.delete({
            where: { id: id }
        });

        return NextResponse.json({ message: 'Utilisateur supprimé avec succès' });

    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
