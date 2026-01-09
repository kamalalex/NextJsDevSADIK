'use client';

import { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Eye,
    Download,
    CheckCircle,
    Send,
    AlertCircle,
    Clock,
    CreditCard,
    MoreHorizontal,
    ChevronRight,
    Search
} from 'lucide-react';

interface InvoiceWithDetails extends Invoice {
    client: { name: string };
    operations: { reference: string; operationDate: string }[];
    history?: any[];
    items?: any[];
}

export default function InvoiceList() {
    const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, [filterStatus]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            let url = '/api/company/invoices';
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
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

    const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
        try {
            const res = await fetch(`/api/company/invoices/${invoiceId}/pdf`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Facture-${invoiceNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/company/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                if (selectedInvoice?.id === id) {
                    const updated = await res.json();
                    setSelectedInvoice({ ...selectedInvoice, ...updated });
                }
                fetchInvoices();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
            APPROVED: 'bg-blue-50 text-blue-600 border-blue-200',
            SENT: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            PARTIALLY_PAID: 'bg-orange-50 text-orange-600 border-orange-200',
            PAID: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            OVERDUE: 'bg-rose-50 text-rose-600 border-rose-200',
            CANCELLED: 'bg-gray-200 text-gray-500 border-gray-300',
        };

        const labels: Record<string, string> = {
            DRAFT: 'Brouillon',
            APPROVED: 'Approuvée',
            SENT: 'Envoyée',
            PARTIALLY_PAID: 'Partiellement Payée',
            PAID: 'Payée',
            OVERDUE: 'En Retard',
            CANCELLED: 'Annulée',
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Factures Clients</h2>
                        <p className="text-sm text-gray-500">Gérez le cycle de vie de vos facturations et suivez les paiements.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="DRAFT">Brouillon</option>
                            <option value="APPROVED">Approuvée</option>
                            <option value="SENT">Envoyée</option>
                            <option value="PAID">Payée</option>
                            <option value="OVERDUE">En Retard</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Référence</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Échéance</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Montant TTC</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Chargement des données...</td></tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Aucune facture trouvée</td></tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-gray-900">{invoice.number}</div>
                                            <div className="text-xs text-gray-400">
                                                {invoice.date ? format(new Date(invoice.date), 'dd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                                            {invoice.client.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm font-medium text-gray-600">
                                                {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy') : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-black text-gray-900">{invoice.totalAmount.toFixed(2)} MAD</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={async () => {
                                                        const res = await fetch(`/api/company/invoices/${invoice.id}`);
                                                        if (res.ok) setSelectedInvoice(await res.json());
                                                    }}
                                                    className="p-1.5 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg hover:border-indigo-200 shadow-sm"
                                                    title="Détails"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPdf(invoice.id, invoice.number)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded-lg hover:border-blue-200 shadow-sm"
                                                    title="Télécharger PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Detail & Timeline Drawer/Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end transition-all">
                    <div className="w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{selectedInvoice.number}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusBadge(selectedInvoice.status)}
                                    <span className="text-xs text-gray-400">Dernière mise à jour: {format(new Date(selectedInvoice.updatedAt), 'dd/MM HH:mm')}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 shadow-sm">
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            {/* Actions Header */}
                            <div className="flex flex-wrap gap-3">
                                {selectedInvoice.status === 'DRAFT' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedInvoice.id, 'APPROVED')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100"
                                    >
                                        <CheckCircle size={18} />
                                        Approuver
                                    </button>
                                )}
                                {selectedInvoice.status === 'APPROVED' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedInvoice.id, 'SENT')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                                    >
                                        <Send size={18} />
                                        Envoyer au client
                                    </button>
                                )}
                                {(selectedInvoice.status === 'SENT' || selectedInvoice.status === 'PARTIALLY_PAID') && (
                                    <button
                                        onClick={() => handleStatusChange(selectedInvoice.id, 'PAID')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                                    >
                                        <CreditCard size={18} />
                                        Marquer comme payée
                                    </button>
                                )}
                                {selectedInvoice.status !== 'CANCELLED' && selectedInvoice.status !== 'PAID' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedInvoice.id, 'CANCELLED')}
                                        className="flex items-center gap-2 px-5 py-2.5 text-rose-600 border border-rose-100 rounded-xl font-bold hover:bg-rose-50"
                                    >
                                        <AlertCircle size={18} />
                                        Annuler
                                    </button>
                                )}
                            </div>

                            {/* Timeline section */}
                            <div>
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Historique & Timeline</h4>
                                <div className="space-y-0 relative border-l-2 border-indigo-50 ml-4 pb-4">
                                    {selectedInvoice.history?.map((entry, idx) => (
                                        <div key={idx} className="mb-8 relative pl-8">
                                            {/* Dot */}
                                            <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-400 z-10 shadow-sm" />

                                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50 shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-bold text-gray-800">{entry.action}</span>
                                                    <span className="text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                        {format(new Date(entry.createdAt), 'dd MMM, HH:mm', { locale: fr })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <CreditCard size={12} />
                                                    Par {entry.user?.name || 'Système'}
                                                </p>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Transition:</span>
                                                    <span className="text-[10px] line-through text-gray-400">{entry.statusFrom}</span>
                                                    <ChevronRight size={10} className="text-gray-300" />
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded">{entry.statusTo}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Present State */}
                                    <div className="relative pl-8 animate-pulse">
                                        <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-indigo-600 z-10 shadow-md shadow-indigo-200" />
                                        <div className="text-sm font-black text-indigo-600">État Actuel: {selectedInvoice.status}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
