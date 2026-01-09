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

        // Initialiser la clause where de base pour les opérations
        const operationWhere: any = {
            transportCompanyId: companyId
        };

        // Restrict COMPANY_OPERATOR to only see their own operations details
        if (user.role === 'COMPANY_OPERATOR') {
            operationWhere.createdById = user.userId;
        }

        // Récupérer les stats
        const [
            totalOperations,
            activeOperations,
            completedOperations,
            vehicles,
            drivers,
            revenue,
            companyInfo
        ] = await Promise.all([
            // Total opérations
            prisma.operation.count({
                where: operationWhere
            }),
            // Opérations en cours
            prisma.operation.count({
                where: {
                    ...operationWhere,
                    status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
                }
            }),
            // Opérations terminées
            prisma.operation.count({
                where: {
                    ...operationWhere,
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
                    ...operationWhere,
                    status: 'DELIVERED'
                },
                _sum: {
                    salePrice: true
                }
            }),
            // Info compagnie
            prisma.company.findUnique({
                where: { id: companyId },
                select: { sadicCode: true }
            })
        ]);

        return NextResponse.json({
            totalOperations,
            activeOperations,
            completedOperations,
            availableVehicles: vehicles,
            activeDrivers: drivers,
            totalRevenue: revenue._sum.salePrice || 0,
            sadicCode: companyInfo?.sadicCode
        });

    } catch (error) {
        console.error('Error fetching company stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
