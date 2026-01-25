
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sadicCode } = await request.json();

        if (!sadicCode) {
            return NextResponse.json({ error: 'Code système (SADIC) requis' }, { status: 400 });
        }

        // 1. Trouver l'entreprise cible
        const targetCompany = await prisma.company.findFirst({
            where: { sadicCode }
        });

        if (!targetCompany) {
            return NextResponse.json({ error: 'Aucune entreprise trouvée avec ce code' }, { status: 404 });
        }

        // 2. Empêcher de se lier à soi-même
        if (targetCompany.id === user.companyId) {
            return NextResponse.json({ error: 'Vous ne pouvez pas vous lier à votre propre entreprise' }, { status: 400 });
        }

        // 3. Vérifier si un lien existe déjà
        const existingLink = await prisma.subcontractor.findFirst({
            where: {
                transportCompanyId: user.companyId,
                linkedCompanyId: targetCompany.id
            }
        });

        if (existingLink) {
            return NextResponse.json({
                error: existingLink.status === 'PENDING'
                    ? 'Une demande est déjà en attente'
                    : 'Cette entreprise est déjà dans vos partenaires'
            }, { status: 400 });
        }

        // 4. Créer l'entrée Subcontractor avec le statut PENDING
        const newPartnerLink = await prisma.subcontractor.create({
            data: {
                name: targetCompany.contactPerson || targetCompany.name,
                companyName: targetCompany.name,
                phone: targetCompany.phone || '',
                email: targetCompany.email || '',
                address: targetCompany.address || '',
                companyId: targetCompany.ice || '',
                paymentWithInvoice: true,
                transportCompanyId: user.companyId,
                linkedCompanyId: targetCompany.id,
                status: 'PENDING'
            }
        });

        return NextResponse.json({
            message: 'Demande de partenariat envoyée avec succès',
            partner: newPartnerLink
        });

    } catch (error) {
        console.error('Error linking partner:', error);
        return NextResponse.json({ error: 'Erreur lors de l\'envoi de la demande' }, { status: 500 });
    }
}
