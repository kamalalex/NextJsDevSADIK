import { Operation } from "@prisma/client";

/**
 * Generates a unique invoice number based on the current date and a sequence number.
 * Format: INV-YYYY-MM-XXXXX
 * Example: INV-2025-11-00001
 */
export function generateInvoiceNumber(sequence: number): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const sequenceStr = sequence.toString().padStart(5, '0');

    return `INV-${year}-${month}-${sequenceStr}`;
}

/**
 * Calculates totals for an invoice based on its line items.
 * Each line can have a different VAT rate.
 */
export function calculateDetailedInvoiceTotals(lines: any[]) {
    const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
    const taxTotal = lines.reduce((sum, line) => sum + (line.taxAmount || 0), 0);
    const totalAmount = subtotal + taxTotal;

    // Grouping by VAT rate for summary
    const vatSummary = lines.reduce((acc: any, line) => {
        const rate = line.vatRate;
        if (!acc[rate]) {
            acc[rate] = { rate, base: 0, tax: 0 };
        }
        acc[rate].base += (line.quantity * line.unitPrice);
        acc[rate].tax += (line.taxAmount || 0);
        return acc;
    }, {});

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxTotal: parseFloat(taxTotal.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        vatSummary: Object.values(vatSummary).map((v: any) => ({
            rate: v.rate,
            base: parseFloat(v.base.toFixed(2)),
            tax: parseFloat(v.tax.toFixed(2))
        }))
    };
}

/**
 * Legacy support: Calculates the total amount for a list of operations.
 * Returns HT, Tax, and TTC amounts.
 */
export function calculateInvoiceTotals(operations: any[], taxRate: number = 20) {
    const totalHT = operations.reduce((sum, op) => {
        return sum + (op.salePrice || 0);
    }, 0);

    const taxAmount = totalHT * (taxRate / 100);
    const totalTTC = totalHT + taxAmount;

    return {
        totalHT: parseFloat(totalHT.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        totalTTC: parseFloat(totalTTC.toFixed(2))
    };
}

/**
 * Formats operation data for invoice display
 */
export function formatOperationForInvoice(operation: any) {
    return {
        date: new Date(operation.operationDate).toLocaleDateString(),
        reference: operation.reference,
        description: `Transport ${operation.loadingPoints?.[0]?.address || ''} -> ${operation.unloadingPoints?.[0]?.address || ''}`,
        vehicleType: operation.vehicleType,
        plateNumber: operation.assignedVehicle?.plateNumber || 'N/A',
        price: operation.salePrice || 0
    };
}
