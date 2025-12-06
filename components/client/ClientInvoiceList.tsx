'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Invoice {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    status: 'EN_ATTENTE' | 'PAYEE' | 'ANNULEE';
    transportCompany: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
    };
}

export default function ClientInvoiceList() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/client/invoices');
            if (res.ok) {
                const data = await res.json();
                setInvoices(data);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
        try {
            const res = await fetch(`/api/company/invoices/${invoiceId}/pdf`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${invoiceNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Erreur lors du téléchargement du PDF');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Erreur lors du téléchargement du PDF');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
            PAYEE: 'bg-green-100 text-green-800',
            ANNULEE: 'bg-red-100 text-red-800'
        };
        const labels = {
            EN_ATTENTE: 'En attente',
            PAYEE: 'Payée',
            ANNULEE: 'Annulée'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Mes Factures</h2>
            </div>

            {invoices.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    Aucune facture disponible.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Numéro
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date d'échéance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transporteur
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Montant HT
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Montant TTC
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {invoice.number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(invoice.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {invoice.transportCompany.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        {invoice.amount.toFixed(2)} MAD
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                        {invoice.totalAmount.toFixed(2)} MAD
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(invoice.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button
                                            onClick={() => handleDownloadPDF(invoice.id, invoice.number)}
                                            className="text-blue-600 hover:text-blue-900 font-medium"
                                        >
                                            📥 Télécharger
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {invoices.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t">
                    <p className="text-sm text-gray-600">
                        Total: {invoices.length} facture{invoices.length > 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
}
