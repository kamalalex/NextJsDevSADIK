import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Récupérer l'entreprise courante pour avoir ses linkedClientIds
        const currentCompany = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { linkedClientIds: true }
        });

        const linkedClientIds = currentCompany?.linkedClientIds || [];

        // 1. Récupérer les clients liés via l'ancienne méthode (linkedClientIds)
        const legacyClients = await prisma.company.findMany({
            where: {
                type: 'CLIENT_COMPANY',
                id: { in: linkedClientIds }
            }
        });

        // 2. Récupérer les clients liés via la nouvelle méthode (Subcontractor/Partenariat)
        // Cas A: Je suis Transporteur, le client est LinkedCompany (j'ai invité le client)
        // Cas B: Je suis Transporteur, le client est TransportCompany (le client m'a invité)
        const partnerLinks = await prisma.subcontractor.findMany({
            where: {
                OR: [
                    { transportCompanyId: user.companyId, linkedCompany: { type: 'CLIENT_COMPANY' } },
                    { linkedCompanyId: user.companyId, transportCompany: { type: 'CLIENT_COMPANY' } }
                ],
                status: 'ACTIVE'
            },
            include: {
                linkedCompany: true,
                transportCompany: true
            }
        });

        const partnerClients = partnerLinks.map(link => {
            return link.transportCompanyId === user.companyId
                ? link.linkedCompany
                : link.transportCompany;
        });

        // 3. Fusionner et dédoublonner
        const allClientsMap = new Map();

        [...legacyClients, ...partnerClients].forEach(client => {
            if (client && !allClientsMap.has(client.id)) {
                allClientsMap.set(client.id, client);
            }
        });

        const clients = Array.from(allClientsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(clients);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, address, phone, email, ice, contactPerson, contactPhone, contactEmail } = body;

        // Generate SADIC Code for new client
        const code = `CLI-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

        const client = await prisma.company.create({
            data: {
                name,
                address,
                phone,
                email,
                ice,
                contactPerson,
                contactPhone,
                contactEmail,
                sadicCode: code,
                type: 'CLIENT_COMPANY',
                isActive: true
            }
        });

        // Link the new client to the creator company
        await prisma.company.update({
            where: { id: user.companyId },
            data: {
                linkedClientIds: {
                    push: client.id
                }
            }
        });

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
