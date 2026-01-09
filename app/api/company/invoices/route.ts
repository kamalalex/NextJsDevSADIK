import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { generateInvoiceNumber, calculateDetailedInvoiceTotals } from '@/lib/invoice-utils';
import { InvoiceStatus } from '@prisma/client';

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
        if (status) whereClause.status = status as InvoiceStatus;

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                client: { select: { name: true } },
                items: true,
                installments: true,
                operations: { select: { reference: true, operationDate: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const invoicesWithFallback = invoices.map(inv => ({
            ...inv,
            dueDate: (inv as any).dueDate || inv.date || inv.createdAt || new Date()
        }));

        return NextResponse.json(invoicesWithFallback);
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
        const {
            clientId,
            operationIds,
            dueDate,
            items,
            notes,
            terms,
            partialPaymentsAllowed,
            minPaymentPercentage,
            maxInstallments
        } = body;

        if (!clientId || (!operationIds && !items)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let finalItems = items;

        // If operationIds provided but no items, generate items from operations
        if (operationIds && (!items || items.length === 0)) {
            const operations = await prisma.operation.findMany({
                where: {
                    id: { in: operationIds },
                    transportCompanyId: user.companyId,
                    invoiceId: null
                }
            });

            if (operations.length !== operationIds.length) {
                return NextResponse.json({ error: 'Some operations not found or already invoiced' }, { status: 400 });
            }

            finalItems = operations.map(op => ({
                description: `Transport ${op.reference}`,
                quantity: 1,
                unitPrice: op.salePrice || 0,
                vatRate: 20, // Default VAT for auto-generation
                taxAmount: (op.salePrice || 0) * 0.2,
                totalLine: (op.salePrice || 0) * 1.2
            }));
        }

        const { subtotal, taxTotal, totalAmount } = calculateDetailedInvoiceTotals(finalItems);

        const count = await prisma.invoice.count({
            where: { transportCompanyId: user.companyId }
        });
        const invoiceNumber = generateInvoiceNumber(count + 1);

        const invoice = await prisma.$transaction(async (tx) => {
            const newInvoice = await tx.invoice.create({
                data: {
                    number: invoiceNumber,
                    date: new Date(), // This could be overridden if needed
                    dueDate: new Date(dueDate),
                    subtotal,
                    taxAmount: taxTotal,
                    totalAmount,
                    status: 'DRAFT',
                    partialPaymentsAllowed: partialPaymentsAllowed || false,
                    minPaymentPercentage,
                    maxInstallments,
                    notes,
                    terms,
                    clientId: clientId,
                    transportCompanyId: user.companyId as string,
                    items: {
                        create: finalItems.map((item: any) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            vatRate: item.vatRate,
                            taxAmount: item.taxAmount,
                            totalLine: item.totalLine
                        }))
                    },
                    operations: operationIds ? {
                        connect: operationIds.map((id: string) => ({ id }))
                    } : undefined,
                    history: {
                        create: {
                            statusTo: 'DRAFT',
                            action: 'Invoice Created',
                            userId: user.userId
                        }
                    }
                },
                include: {
                    items: true,
                    history: true
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
