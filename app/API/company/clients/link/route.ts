
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: Lier un client existant via son code SADIC
export async function POST(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { sadicCode } = body;

        if (!sadicCode) {
            return NextResponse.json({ error: 'Code système requis' }, { status: 400 });
        }

        // Trouver le client
        const client = await prisma.company.findFirst({
            where: { sadicCode: sadicCode }
        });

        if (!client || client.type !== 'CLIENT_COMPANY') {
            return NextResponse.json({ error: 'Client introuvable avec ce code' }, { status: 404 });
        }

        // Vérifier si déjà lié
        const currentCompany = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { linkedClientIds: true }
        });

        if (currentCompany?.linkedClientIds.includes(client.id)) {
            return NextResponse.json({ error: 'Ce client est déjà lié à votre compte' }, { status: 400 });
        }

        // Ajouter le lien
        await prisma.company.update({
            where: { id: user.companyId },
            data: {
                linkedClientIds: {
                    push: client.id
                }
            }
        });

        return NextResponse.json({ message: 'Client lié avec succès', client });

    } catch (error) {
        console.error('Error linking client:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
