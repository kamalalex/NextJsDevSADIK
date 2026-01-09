import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                items: true,
                installments: true,
                history: {
                    include: {
                        user: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                operations: true
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.transportCompanyId !== user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, paymentStatus, notes, terms, dueDate } = body;

        const oldInvoice = await prisma.invoice.findUnique({
            where: { id }
        });

        if (!oldInvoice || oldInvoice.transportCompanyId !== user.companyId) {
            return NextResponse.json({ error: 'Invoice not found or unauthorized' }, { status: 404 });
        }

        const updateData: any = {};
        if (status) updateData.status = status as InvoiceStatus;
        if (paymentStatus) updateData.paymentStatus = paymentStatus as PaymentStatus;
        if (notes !== undefined) updateData.notes = notes;
        if (terms !== undefined) updateData.terms = terms;
        if (dueDate) updateData.dueDate = new Date(dueDate);

        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: {
                ...updateData,
                history: status && status !== oldInvoice.status ? {
                    create: {
                        statusFrom: oldInvoice.status,
                        statusTo: status as InvoiceStatus,
                        action: `Status updated to ${status}`,
                        userId: user.userId
                    }
                } : undefined
            },
            include: {
                history: true
            }
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
