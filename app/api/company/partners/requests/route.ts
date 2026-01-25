
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET: Lister les demandes reçues (où l'entreprise connectée est linkedCompanyId)
export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requests = await prisma.subcontractor.findMany({
            where: {
                linkedCompanyId: user.companyId,
                status: 'PENDING'
            },
            include: {
                transportCompany: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        sadicCode: true,
                        type: true
                    }
                }
            }
        });

        return NextResponse.json(requests);

    } catch (error) {
        console.error('Error fetching partner requests:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST: Action sur une demande (confirm / reject)
export async function POST(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, action } = await request.json();

        if (!id || !['CONFIRM', 'REJECT'].includes(action)) {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }

        const linkRequest = await prisma.subcontractor.findUnique({
            where: { id }
        });

        if (!linkRequest || linkRequest.linkedCompanyId !== user.companyId) {
            return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
        }

        if (action === 'CONFIRM') {
            await prisma.subcontractor.update({
                where: { id },
                data: { status: 'ACTIVE' }
            });

            // Version réciproque (optionnel, mais utile si on veut que les deux voient le lien)
            // Pour l'instant on reste simple : le demandeur voit l'actif.

            return NextResponse.json({ message: 'Demande confirmée avec succès' });
        } else {
            await prisma.subcontractor.delete({
                where: { id }
            });
            return NextResponse.json({ message: 'Demande refusée' });
        }

    } catch (error) {
        console.error('Error handling partner action:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
