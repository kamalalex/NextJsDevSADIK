import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { generateInvoiceNumber, calculateInvoiceTotals } from '@/lib/invoice-utils';

export async function POST(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { operationIds, clientId, dueDate, taxRate = 20 } = body;

        if (!operationIds || !Array.isArray(operationIds) || operationIds.length === 0 || !clientId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch operations
        const operations = await prisma.operation.findMany({
            where: {
                id: { in: operationIds },
                transportCompanyId: user.companyId,
                invoiceId: { isSet: false } // Ensure not already invoiced
            }
        });

        if (operations.length !== operationIds.length) {
            return NextResponse.json({ error: 'Some operations not found or already invoiced' }, { status: 400 });
        }

        // Calculate totals
        const { totalHT, taxAmount, totalTTC } = calculateInvoiceTotals(operations, taxRate);

        // Generate invoice number
        const count = await prisma.invoice.count({
            where: { transportCompanyId: user.companyId }
        });
        const invoiceNumber = generateInvoiceNumber(count + 1);

        // Create invoice
        const invoice = await prisma.$transaction(async (tx) => {
            const newInvoice = await tx.invoice.create({
                data: {
                    number: invoiceNumber,
                    date: new Date(),
                    dueDate: new Date(dueDate || new Date()),
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
        console.error('Error generating invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
