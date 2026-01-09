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
            return NextResponse.json({ error: 'Code requis' }, { status: 400 });
        }

        // Trouver le chauffeur par son code SADIC
        const driver = await prisma.driver.findUnique({
            where: { sadicCode }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Chauffeur non trouvé' }, { status: 404 });
        }

        if (!driver.isIndependent) {
            return NextResponse.json({ error: 'Ce chauffeur n\'est pas indépendant et ne peut pas être lié ainsi' }, { status: 400 });
        }

        if (driver.companyId === user.companyId) {
            return NextResponse.json({ error: 'Ce chauffeur est déjà lié à votre entreprise' }, { status: 400 });
        }

        // Lier le chauffeur à l'entreprise
        const updatedDriver = await prisma.driver.update({
            where: { id: driver.id },
            data: { companyId: user.companyId }
        });

        // Optionnel: Mettre à jour ses véhicules aussi? 
        // Dans une session précédente il était dit : "Update driver's vehicles companyId"
        await prisma.vehicle.updateMany({
            where: { driverId: driver.id },
            data: { companyId: user.companyId }
        });

        return NextResponse.json(updatedDriver);
    } catch (error) {
        console.error('Error linking driver:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
