import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OperationStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const clientId = searchParams.get('clientId');
        const notInvoiced = searchParams.get('notInvoiced');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const whereClause: any = {
            transportCompanyId: user.companyId
        };

        // Restrict COMPANY_OPERATOR to only see their own operations
        if (user.role === 'COMPANY_OPERATOR') {
            whereClause.createdById = user.userId;
        }

        if (status) {
            whereClause.status = status as OperationStatus;
        }

        if (clientId) {
            whereClause.clientId = clientId;
        }

        if (notInvoiced === 'true') {
            whereClause.invoiceId = { isSet: false };
        }

        if (dateFrom || dateTo) {
            whereClause.operationDate = {};
            if (dateFrom) whereClause.operationDate.gte = new Date(dateFrom);
            if (dateTo) whereClause.operationDate.lte = new Date(dateTo);
        }

        const operations = await prisma.operation.findMany({
            where: whereClause,
            include: {
                client: {
                    select: { name: true }
                },
                assignedDriver: {
                    select: { name: true, phone: true }
                },
                assignedVehicle: {
                    select: { plateNumber: true, model: true }
                },
                subcontractor: {
                    select: { companyName: true }
                },
                createdBy: {
                    select: { name: true, role: true }
                }
            },
            orderBy: {
                operationDate: 'desc'
            }
        });

        return NextResponse.json(operations);

    } catch (error) {
        console.error('Error fetching company operations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
