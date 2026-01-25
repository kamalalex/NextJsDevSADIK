
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
            // 1. Mettre à jour le statut de la demande existante (Transporteur -> Client)
            const updatedRequest = await prisma.subcontractor.update({
                where: { id },
                data: { status: 'ACTIVE' },
                include: {
                    transportCompany: true // On a besoin des infos du transporteur pour créer le lien inverse
                }
            });

            // 2. Determine who is the Transporter and who is the Client
            let transporterId: string;
            let clientId: string;

            if (updatedRequest.transportCompany.type === 'CLIENT_COMPANY') {
                // Le client a initié la demande
                transporterId = updatedRequest.linkedCompanyId!;
                clientId = updatedRequest.transportCompanyId;
            } else {
                // Le transporteur a initié la demande
                transporterId = updatedRequest.transportCompanyId;
                clientId = updatedRequest.linkedCompanyId!;
            }

            // 3. Ajouter le client à la liste des clients du transporteur
            if (transporterId && clientId) {
                const transportCompany = await prisma.company.findUnique({
                    where: { id: transporterId },
                    select: { linkedClientIds: true }
                });

                if (transportCompany) {
                    const clientAlreadyLinked = transportCompany.linkedClientIds.includes(clientId);

                    if (!clientAlreadyLinked) {
                        await prisma.company.update({
                            where: { id: transporterId },
                            data: {
                                linkedClientIds: {
                                    push: clientId
                                }
                            }
                        });
                    }
                }
            }

            // 3. Créer le lien inverse : Le client ajoue le transporteur comme partenaire
            // (Pour que le client puisse voir le transporteur dans "Nouvelle Opération")

            // Vérifier si le lien inverse existe déjà
            const reverseLinkExists = await prisma.subcontractor.findFirst({
                where: {
                    transportCompanyId: user.companyId, // Le client (qui confirme) devient le "propriétaire" du lien
                    linkedCompanyId: linkRequest.transportCompanyId // Le transporteur devient le "linkedCompany"
                }
            });

            if (!reverseLinkExists && updatedRequest.transportCompany) {
                await prisma.subcontractor.create({
                    data: {
                        name: updatedRequest.transportCompany.contactPerson || updatedRequest.transportCompany.name,
                        companyName: updatedRequest.transportCompany.name,
                        phone: updatedRequest.transportCompany.phone || '',
                        email: updatedRequest.transportCompany.email || '',
                        address: updatedRequest.transportCompany.address || '',
                        companyId: updatedRequest.transportCompany.ice || '', // Utilisation du champ companyId pour ICE comme dans link/route.ts
                        paymentWithInvoice: true,
                        transportCompanyId: user.companyId, // Client
                        linkedCompanyId: linkRequest.transportCompanyId, // Transporteur
                        status: 'ACTIVE' // Directement actif car c'est une conséquence de l'acceptation
                    }
                });
            }

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
