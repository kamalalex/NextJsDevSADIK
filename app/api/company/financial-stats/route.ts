import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import {
    calculateTotalRevenue,
    calculateTotalInvoiced,
    calculateTotalSubcontractorPayments,
    calculateAverageMargin
} from '@/lib/financial-calculations';
import { startOfMonth, subMonths, endOfMonth, isAfter, isBefore, addDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const thirtyDaysFromNow = addDays(now, 30);
        const sixtyDaysFromNow = addDays(now, 60);
        const ninetyDaysFromNow = addDays(now, 90);

        // Fetch all relevant data
        const [allOperations, allInvoices, allPayments] = await Promise.all([
            prisma.operation.findMany({
                where: { transportCompanyId: user.companyId },
                select: {
                    salePrice: true,
                    purchasePrice: true,
                    status: true,
                    operationDate: true,
                    subcontractorId: true,
                    subcontractorPaid: true
                }
            }),
            prisma.invoice.findMany({
                where: { transportCompanyId: user.companyId },
                include: {
                    client: { select: { id: true, name: true } },
                    installments: true
                }
            }),
            prisma.subcontractorPayment.findMany({
                where: { transportCompanyId: user.companyId }
            })
        ]);

        // 1. Basic KPIs
        const totalRevenue = calculateTotalRevenue(allOperations);
        const totalInvoiced = calculateTotalInvoiced(allInvoices as any);
        const totalUninvoiced = Math.max(0, totalRevenue - totalInvoiced);

        // Calculate truly paid amount from installments
        const totalPaidAmount = allInvoices.reduce((sum, inv) => {
            const paidInstTotal = (inv as any).installments
                ?.filter((inst: any) => inst.status === 'PAID')
                .reduce((instSum: number, inst: any) => instSum + inst.amount, 0) || 0;

            // If no installments, use full totalAmount if status is PAID
            if ((inv as any).installments?.length === 0 && (inv.status as any) === 'PAID') {
                return sum + inv.totalAmount;
            }
            return sum + paidInstTotal;
        }, 0);

        const marginStats = calculateAverageMargin(allOperations);
        const totalSubcontractorPayments = calculateTotalSubcontractorPayments(allPayments);
        const realTimeProfit = totalPaidAmount - totalSubcontractorPayments;

        // 2. Cash Flow Forecast
        const cashFlowForecast = {
            thirtyDays: allInvoices
                .filter(inv => (inv.status as any) !== 'PAID' && (inv.status as any) !== 'CANCELLED' && isBefore(new Date(inv.dueDate), thirtyDaysFromNow))
                .reduce((sum, inv) => {
                    const alreadyPaid = (inv as any).installments?.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + i.amount, 0) || 0;
                    return sum + (inv.totalAmount - alreadyPaid);
                }, 0),
            sixtyDays: allInvoices
                .filter(inv => (inv.status as any) !== 'PAID' && (inv.status as any) !== 'CANCELLED' && isBefore(new Date(inv.dueDate), sixtyDaysFromNow))
                .reduce((sum, inv) => {
                    const alreadyPaid = (inv as any).installments?.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + i.amount, 0) || 0;
                    return sum + (inv.totalAmount - alreadyPaid);
                }, 0),
            ninetyDays: allInvoices
                .filter(inv => (inv.status as any) !== 'PAID' && (inv.status as any) !== 'CANCELLED' && isBefore(new Date(inv.dueDate), ninetyDaysFromNow))
                .reduce((sum, inv) => {
                    const alreadyPaid = (inv as any).installments?.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + i.amount, 0) || 0;
                    return sum + (inv.totalAmount - alreadyPaid);
                }, 0)
        };

        // 3. Revenue Trend
        const revenueTrend = [];
        for (let i = 5; i >= 0; i--) {
            const start = startOfMonth(subMonths(now, i));
            const end = endOfMonth(subMonths(now, i));
            const monthRevenue = allOperations
                .filter(op => op.operationDate && isAfter(new Date(op.operationDate), start) && isBefore(new Date(op.operationDate), end))
                .reduce((sum, op) => sum + (op.salePrice || 0), 0);

            revenueTrend.push({
                label: start.toLocaleString('fr-FR', { month: 'short' }).toUpperCase(),
                revenue: monthRevenue
            });
        }

        // 4. Clients
        const clientStats: Record<string, { id: string, name: string, revenue: number, overdueAmount: number }> = {};
        allInvoices.forEach(inv => {
            const clientId = inv.clientId;
            if (!clientStats[clientId]) {
                clientStats[clientId] = { id: clientId, name: (inv as any).client?.name || 'Inconnu', revenue: 0, overdueAmount: 0 };
            }
            clientStats[clientId].revenue += inv.totalAmount;
            if ((inv.status as any) === 'OVERDUE' || ((inv.status as any) !== 'PAID' && isBefore(new Date(inv.dueDate), now))) {
                const paid = (inv as any).installments?.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + i.amount, 0) || 0;
                clientStats[clientId].overdueAmount += (inv.totalAmount - paid);
            }
        });

        const topClients = Object.values(clientStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const overdueClients = Object.values(clientStats)
            .filter(c => c.overdueAmount > 0)
            .sort((a, b) => b.overdueAmount - a.overdueAmount);

        // 5. Critical Overdue Alerts
        const criticalOverdueAlerts = allInvoices
            .filter(inv => (inv.status as any) !== 'PAID' && (inv.status as any) !== 'CANCELLED' && isBefore(new Date(inv.dueDate), addDays(now, -30)))
            .map(inv => {
                const diffTime = Math.abs(now.getTime() - new Date(inv.dueDate).getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const paid = (inv as any).installments?.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + i.amount, 0) || 0;
                return {
                    id: inv.id,
                    number: inv.number,
                    clientName: (inv as any).client?.name || 'Inconnu',
                    totalAmount: inv.totalAmount - paid,
                    daysOverdue: diffDays
                };
            })
            .sort((a, b) => b.daysOverdue - a.daysOverdue)
            .slice(0, 5);

        // 6. Distribution
        const paymentDistribution = {
            full: allInvoices.filter(inv => (inv.status as any) === 'PAID' && (inv as any).installments?.length === 0).length,
            partial: allInvoices.filter(inv => ((inv as any).installments?.length || 0) > 0).length
        };

        return NextResponse.json({
            totalRevenue,
            totalInvoiced,
            totalUninvoiced,
            totalPaidInvoices: totalPaidAmount,
            totalUnpaidInvoices: Math.max(0, totalInvoiced - totalPaidAmount),
            totalInvoicesCount: allInvoices.length,
            averageMargin: marginStats.averageMargin,
            totalMargin: marginStats.totalMargin,
            marginPercentage: marginStats.marginPercentage,
            totalOwedToSubcontractors: allOperations
                .filter(op => (op as any).subcontractorId && !(op as any).subcontractorPaid)
                .reduce((sum, op) => sum + (op.purchasePrice || 0), 0),
            realTimeProfit,
            totalSubcontractorPayments,
            cashFlowForecast,
            revenueTrend,
            topClients,
            overdueClients,
            criticalOverdueAlerts,
            paymentDistribution
        });

    } catch (error) {
        console.error('Error calculating financial stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
