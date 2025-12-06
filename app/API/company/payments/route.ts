import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const subcontractorId = searchParams.get('subcontractorId');

        const whereClause: any = {
            transportCompanyId: user.companyId
        };

        if (subcontractorId) whereClause.subcontractorId = subcontractorId;

        const payments = await prisma.subcontractorPayment.findMany({
            where: whereClause,
            include: {
                subcontractor: { select: { companyName: true, name: true } },
                operations: { select: { reference: true, operationDate: true, purchasePrice: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
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
        const { subcontractorId, operationIds, paymentDate, notes } = body;

        if (!subcontractorId || !operationIds || !Array.isArray(operationIds) || operationIds.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch operations to calculate total
        const operations = await prisma.operation.findMany({
            where: {
                id: { in: operationIds },
                transportCompanyId: user.companyId,
                subcontractorId: subcontractorId,
                subcontractorPaid: false // Ensure not already paid
            }
        });

        if (operations.length !== operationIds.length) {
            return NextResponse.json({ error: 'Some operations not found or already paid' }, { status: 400 });
        }

        // Calculate total amount
        const totalAmount = operations.reduce((sum, op) => sum + (op.purchasePrice || 0), 0);

        // Generate payment number
        const count = await prisma.subcontractorPayment.count({
            where: { transportCompanyId: user.companyId }
        });
        const paymentNumber = `PAY-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

        // Create payment record and update operations
        const payment = await prisma.$transaction(async (tx) => {
            const newPayment = await tx.subcontractorPayment.create({
                data: {
                    paymentNumber,
                    paymentDate: new Date(paymentDate || new Date()),
                    totalAmount,
                    status: 'PAID', // Usually created when paid
                    notes,
                    subcontractorId,
                    transportCompanyId: user.companyId as string,
                    operations: {
                        connect: operationIds.map((id: string) => ({ id }))
                    }
                }
            });

            // Update operations status
            await tx.operation.updateMany({
                where: { id: { in: operationIds } },
                data: {
                    subcontractorPaid: true,
                    subcontractorPaidAt: new Date(),
                    paymentStatus: 'PAID'
                }
            });

            return newPayment;
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error('Error creating payment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
