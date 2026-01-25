
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

        // Vérifier si un lien ou une demande existe déjà
        const existingLink = await prisma.subcontractor.findFirst({
            where: {
                transportCompanyId: user.companyId,
                linkedCompanyId: client.id
            }
        });

        if (existingLink) {
            return NextResponse.json({
                error: existingLink.status === 'PENDING'
                    ? 'Une demande est déjà en attente pour ce client'
                    : 'Ce client est déjà dans vos partenaires'
            }, { status: 400 });
        }

        // Vérifier si déjà dans la liste des clients (cas legacy)
        const currentCompany = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { linkedClientIds: true }
        });

        if (currentCompany?.linkedClientIds.includes(client.id)) {
            return NextResponse.json({ error: 'Ce client est déjà lié à votre compte' }, { status: 400 });
        }

        // Créer une demande de partenariat (Subcontractor PENDING)
        // Cela permettra au client de recevoir une notif et d'accepter
        const newRequest = await prisma.subcontractor.create({
            data: {
                name: client.contactPerson || client.name,
                companyName: client.name,
                phone: client.phone || '',
                email: client.email || '',
                address: client.address || '',
                companyId: client.ice || '',
                paymentWithInvoice: true,
                transportCompanyId: user.companyId,
                linkedCompanyId: client.id,
                status: 'PENDING'
            }
        });

        return NextResponse.json({
            message: 'Demande envoyée au client. Il doit accepter pour apparaître dans votre liste.',
            client: newRequest
        });

    } catch (error) {
        console.error('Error linking client:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
