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
 * Calculates the total amount for a list of operations.
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
