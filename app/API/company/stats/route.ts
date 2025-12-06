import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = user.companyId;

        // Récupérer les stats
        const [
            totalOperations,
            activeOperations,
            completedOperations,
            vehicles,
            drivers,
            revenue
        ] = await Promise.all([
            // Total opérations
            prisma.operation.count({
                where: { transportCompanyId: companyId }
            }),
            // Opérations en cours
            prisma.operation.count({
                where: {
                    transportCompanyId: companyId,
                    status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
                }
            }),
            // Opérations terminées
            prisma.operation.count({
                where: {
                    transportCompanyId: companyId,
                    status: 'DELIVERED'
                }
            }),
            // Véhicules disponibles
            prisma.vehicle.count({
                where: { companyId: companyId, status: 'ACTIVE' }
            }),
            // Chauffeurs actifs
            prisma.driver.count({
                where: { companyId: companyId, status: 'ACTIVE' }
            }),
            // Chiffre d'affaires (basé sur salePrice pour l'instant)
            prisma.operation.aggregate({
                where: {
                    transportCompanyId: companyId,
                    status: 'DELIVERED'
                },
                _sum: {
                    salePrice: true
                }
            })
        ]);

        return NextResponse.json({
            totalOperations,
            activeOperations,
            completedOperations,
            availableVehicles: vehicles,
            activeDrivers: drivers,
            totalRevenue: revenue._sum.salePrice || 0
        });

    } catch (error) {
        console.error('Error fetching company stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
