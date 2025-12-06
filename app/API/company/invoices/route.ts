import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { generateInvoiceNumber, calculateInvoiceTotals } from '@/lib/invoice-utils';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const status = searchParams.get('status');

        const whereClause: any = {
            transportCompanyId: user.companyId
        };

        if (clientId) whereClause.clientId = clientId;
        if (status) whereClause.status = status;

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                client: { select: { name: true } },
                operations: { select: { reference: true, operationDate: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
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
        const { clientId, operationIds, dueDate, taxRate = 20 } = body;

        if (!clientId || !operationIds || !Array.isArray(operationIds) || operationIds.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch operations to calculate totals
        const operations = await prisma.operation.findMany({
            where: {
                id: { in: operationIds },
                transportCompanyId: user.companyId,
                // Ensure operations are not already invoiced
                invoiceId: { isSet: false }
            }
        });

        if (operations.length !== operationIds.length) {
            return NextResponse.json({ error: 'Some operations not found or already invoiced' }, { status: 400 });
        }

        // Calculate totals
        const { totalHT, taxAmount, totalTTC } = calculateInvoiceTotals(operations, taxRate);

        // Generate invoice number
        // In a real app, we'd need a transaction or better sequence handling
        const count = await prisma.invoice.count({
            where: { transportCompanyId: user.companyId }
        });
        const invoiceNumber = generateInvoiceNumber(count + 1);

        // Create invoice and update operations
        const invoice = await prisma.$transaction(async (tx) => {
            const newInvoice = await tx.invoice.create({
                data: {
                    number: invoiceNumber,
                    date: new Date(),
                    dueDate: new Date(dueDate),
                    amount: totalHT,
                    taxAmount: taxAmount,
                    totalAmount: totalTTC,
                    taxRate: taxRate,
                    status: 'EN_ATTENTE',
                    clientId: clientId,
                    transportCompanyId: user.companyId as string,
                    operations: {
                        connect: operationIds.map((id: string) => ({ id }))
                    }
                }
            });

            return newInvoice;
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
