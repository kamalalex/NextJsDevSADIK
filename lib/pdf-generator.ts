import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Company, Operation, SubcontractorPayment, Subcontractor, Vehicle } from '@prisma/client';

// Extend jsPDF type to include autotable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

// Define extended Operation type to include relations and handle Json types
interface ExtendedOperation extends Operation {
    assignedVehicle?: Vehicle | null;
    loadingPoints: any;
    unloadingPoints: any;
}

export function generateInvoicePDF(
    invoice: Invoice & { client: Company, transportCompany: Company, items?: any[] },
    operations: ExtendedOperation[]
): ArrayBuffer {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const company = invoice.transportCompany;
    const client = invoice.client;

    // Header - Transport Company Info
    doc.setFontSize(20);
    doc.text(company.name, 14, 22);

    doc.setFontSize(10);
    doc.text(company.address || '', 14, 30);
    doc.text(`Tél: ${company.phone || ''}`, 14, 35);
    doc.text(`Email: ${company.email || ''}`, 14, 40);

    // Invoice Info
    doc.setFontSize(16);
    doc.text('FACTURE', 140, 22);

    doc.setFontSize(10);
    doc.text(`N° Facture: ${invoice.number}`, 140, 30);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, 140, 35);
    doc.text(`Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, 140, 40);

    // Client Info
    doc.setFontSize(12);
    doc.text('Facturé à:', 14, 55);
    doc.setFontSize(10);
    doc.text(client.name, 14, 62);
    doc.text(client.address || '', 14, 67);
    doc.text(`Tél: ${client.phone || ''}`, 14, 72);

    // Table Logic: Use items if present, otherwise fallback to operations
    let tableColumn: string[] = [];
    let tableRows: any[][] = [];

    if (invoice.items && invoice.items.length > 0) {
        tableColumn = ["Description", "Quantité", "TVA (%)", "Total TTC"];
        tableRows = invoice.items.map(item => [
            item.description,
            item.quantity.toString(),
            `${item.vatRate}%`,
            `${item.totalLine.toFixed(2)} MAD`
        ]);
    } else {
        tableColumn = ["Date", "Référence", "Description", "Montant Total"];
        tableRows = operations.map(op => {
            const loadingAddr = Array.isArray(op.loadingPoints) ? op.loadingPoints[0]?.address || '' : '';
            const unloadingAddr = Array.isArray(op.unloadingPoints) ? op.unloadingPoints[0]?.address || '' : '';

            return [
                new Date(op.operationDate).toLocaleDateString('fr-FR'),
                op.reference,
                `Transport ${loadingAddr} -> ${unloadingAddr}`,
                `${(op.salePrice || 0).toFixed(2)} MAD` // Adjusted for legacy simplification
            ];
        });
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [43, 67, 208] } // Use a more premium indigo color
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.text(`Total HT:`, 140, finalY);
    doc.text(`${invoice.subtotal.toFixed(2)} MAD`, 190, finalY, { align: 'right' });

    doc.text(`Taxe (TVA):`, 140, finalY + 7);
    doc.text(`${invoice.taxAmount.toFixed(2)} MAD`, 190, finalY + 7, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Net à Payer:`, 140, finalY + 15);
    doc.text(`${invoice.totalAmount.toFixed(2)} MAD`, 190, finalY + 15, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Merci de votre confiance. Facture générée via Sadic Trans.', 14, finalY + 30);

    return doc.output('arraybuffer');
}

export function generatePaymentSummaryPDF(
    payment: SubcontractorPayment & { subcontractor: Subcontractor, transportCompany: Company },
    operations: ExtendedOperation[]
): ArrayBuffer {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const company = payment.transportCompany;
    const subcontractor = payment.subcontractor;

    // Header
    doc.setFontSize(20);
    doc.text(company.name, 14, 22);

    doc.setFontSize(16);
    doc.text('REÇU DE PAIEMENT', 120, 22);

    doc.setFontSize(10);
    doc.text(`N° Paiement: ${payment.paymentNumber}`, 120, 30);
    doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString('fr-FR')}`, 120, 35);

    // Subcontractor Info
    doc.text(`Bénéficiaire: ${subcontractor.companyName}`, 14, 50);
    doc.text(`Contact: ${subcontractor.name}`, 14, 55);

    // Operations Table
    const tableColumn = ["Date", "Référence", "Description", "Montant"];
    const tableRows = operations.map(op => {
        const loadingAddr = Array.isArray(op.loadingPoints) ? op.loadingPoints[0]?.address || '' : '';
        const unloadingAddr = Array.isArray(op.unloadingPoints) ? op.unloadingPoints[0]?.address || '' : '';

        return [
            new Date(op.operationDate).toLocaleDateString('fr-FR'),
            op.reference,
            `Transport ${loadingAddr} -> ${unloadingAddr}`,
            `${(op.purchasePrice || 0).toFixed(2)} MAD`
        ];
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'grid'
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Payé: ${payment.totalAmount.toFixed(2)} MAD`, 140, finalY, { align: 'right' });

    return doc.output('arraybuffer');
}
