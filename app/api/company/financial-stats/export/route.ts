import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const sixMonthsAgo = startOfMonth(subMonths(now, 5));

        // Fetch invoices for the last 6 months
        const invoices = await prisma.invoice.findMany({
            where: {
                transportCompanyId: user.companyId,
                date: { gte: sixMonthsAgo }
            },
            include: {
                client: true
            },
            orderBy: { date: 'desc' }
        });

        // Generate CSV content
        let csvContent = 'Date,Reference,Client,Total TTC,Status\n';

        invoices.forEach(inv => {
            const dateStr = format(inv.date, 'yyyy-MM-dd');
            const clientName = inv.client.name.replace(/,/g, ''); // Simple comma escaping
            csvContent += `${dateStr},${inv.number},${clientName},${inv.totalAmount.toFixed(2)},${inv.status}\n`;
        });

        // Return CSV file
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="rapport-financier-${format(now, 'yyyy-MM-dd')}.csv"`
            }
        });
    } catch (error) {
        console.error('Error exporting financial data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
