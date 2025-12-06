import { Invoice, SubcontractorPayment } from "@prisma/client";

/**
 * Calculates the total revenue from a list of operations (sum of salePrice)
 */
export function calculateTotalRevenue(operations: any[]): number {
    return operations.reduce((sum, op) => sum + (op.salePrice || 0), 0);
}

/**
 * Calculates the total amount invoiced from a list of invoices
 */
export function calculateTotalInvoiced(invoices: Invoice[]): number {
    return invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
}

/**
 * Calculates the total amount paid to subcontractors
 */
export function calculateTotalSubcontractorPayments(payments: SubcontractorPayment[]): number {
    return payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
}

/**
 * Calculates the average margin per operation
 * Margin = Sale Price - Purchase Price
 */
export function calculateAverageMargin(operations: any[]): { totalMargin: number, averageMargin: number, marginPercentage: number } {
    let totalMargin = 0;
    let totalRevenue = 0;
    let count = 0;

    operations.forEach(op => {
        if (op.salePrice && op.purchasePrice) {
            totalMargin += (op.salePrice - op.purchasePrice);
            totalRevenue += op.salePrice;
            count++;
        }
    });

    return {
        totalMargin: parseFloat(totalMargin.toFixed(2)),
        averageMargin: count > 0 ? parseFloat((totalMargin / count).toFixed(2)) : 0,
        marginPercentage: totalRevenue > 0 ? parseFloat(((totalMargin / totalRevenue) * 100).toFixed(2)) : 0
    };
}

/**
 * Calculates real-time profit
 * Profit = Total Paid Invoices - Total Subcontractor Payments
 */
export function calculateRealTimeProfit(paidInvoices: Invoice[], subcontractorPayments: SubcontractorPayment[]): number {
    const totalIncome = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalExpenses = subcontractorPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);

    return parseFloat((totalIncome - totalExpenses).toFixed(2));
}
