import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import {
    calculateTotalRevenue,
    calculateTotalInvoiced,
    calculateTotalSubcontractorPayments,
    calculateAverageMargin,
    calculateRealTimeProfit
} from '@/lib/financial-calculations';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all relevant data
        // 1. All operations for revenue and margin
        const allOperations = await prisma.operation.findMany({
            where: { transportCompanyId: user.companyId },
            select: { salePrice: true, purchasePrice: true, status: true }
        });

        // 2. Invoices for invoiced/paid stats
        const allInvoices = await prisma.invoice.findMany({
            where: { transportCompanyId: user.companyId }
        });

        // 3. Subcontractor payments
        const allPayments = await prisma.subcontractorPayment.findMany({
            where: { transportCompanyId: user.companyId }
        });

        // 4. Unpaid subcontractor operations
        const unpaidSubcontractorOps = await prisma.operation.findMany({
            where: {
                transportCompanyId: user.companyId,
                subcontractorId: { not: null },
                subcontractorPaid: false
            },
            select: { purchasePrice: true }
        });

        // Calculate KPIs

        // 1. Total Revenue (all operations with a price)
        const totalRevenue = calculateTotalRevenue(allOperations);

        // 2. Total Invoiced
        const totalInvoiced = calculateTotalInvoiced(allInvoices);

        // 3. Total Uninvoiced (Revenue - Invoiced)
        // Note: This is an approximation. A more accurate way would be to sum salePrice of operations where invoiceId is null
        const uninvoicedOps = await prisma.operation.findMany({
            where: {
                transportCompanyId: user.companyId,
                invoiceId: { isSet: false },
                salePrice: { not: null }
            },
            select: { salePrice: true }
        });
        const totalUninvoiced = calculateTotalRevenue(uninvoicedOps);

        // 4. Total Paid Invoices
        const paidInvoices = allInvoices.filter(inv => inv.status === 'PAYEE');
        const totalPaidInvoices = calculateTotalInvoiced(paidInvoices);

        // 5. Total Unpaid Invoices
        const unpaidInvoices = allInvoices.filter(inv => inv.status !== 'PAYEE' && inv.status !== 'ANNULEE');
        const totalUnpaidInvoices = calculateTotalInvoiced(unpaidInvoices);

        // 6. Total Number of Invoices
        const totalInvoicesCount = allInvoices.length;

        // 7. Average Margin
        const marginStats = calculateAverageMargin(allOperations);

        // 8. Total Owed to Subcontractors
        const totalOwedToSubcontractors = unpaidSubcontractorOps.reduce((sum, op) => sum + (op.purchasePrice || 0), 0);

        // 9. Real-Time Profit
        // Profit = Paid Invoices - Subcontractor Payments (Simple version as per spec)
        // Note: The spec says "Profit = Total revenue – Total subcontractor payments" for simple version
        // But also "Profit = Total paid invoices – Total payments made to subcontractors" for accurate version
        // Let's provide the "Cash Flow" profit (Paid In - Paid Out)
        const totalSubcontractorPayments = calculateTotalSubcontractorPayments(allPayments);
        const realTimeProfit = totalPaidInvoices - totalSubcontractorPayments;

        return NextResponse.json({
            totalRevenue,
            totalInvoiced,
            totalUninvoiced,
            totalPaidInvoices,
            totalUnpaidInvoices,
            totalInvoicesCount,
            averageMargin: marginStats.averageMargin,
            totalMargin: marginStats.totalMargin,
            marginPercentage: marginStats.marginPercentage,
            totalOwedToSubcontractors,
            realTimeProfit,
            totalSubcontractorPayments
        });

    } catch (error) {
        console.error('Error calculating financial stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
