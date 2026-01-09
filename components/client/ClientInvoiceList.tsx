'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Download,
    Eye,
    ChevronRight,
    Info,
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';

interface Invoice {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    transportCompany: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    installments?: any[];
    items?: any[];
}

export default function ClientInvoiceList() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            DRAFT: 'bg-gray-100 text-gray-600',
            APPROVED: 'bg-blue-100 text-blue-800',
            SENT: 'bg-indigo-100 text-indigo-800',
            PARTIALLY_PAID: 'bg-orange-100 text-orange-800',
            PAID: 'bg-green-100 text-green-800',
            OVERDUE: 'bg-red-100 text-red-800',
            CANCELLED: 'bg-gray-100 text-gray-400',
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
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="text-gray-500 font-medium">Chargement de vos factures...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Mes Factures & Paiements</h2>
                        <p className="text-sm text-gray-500">Consultez vos factures et suivez vos échéances de paiement.</p>
                    </div>
                </div>

                {invoices.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg">Aucune facture</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">Vous n'avez pas encore de factures émises pour le moment.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Numéro</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date / Échéance</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Transporteur</th>
                                    <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Total TTC</th>
                                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Statut</th>
                                    <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="text-sm font-black text-gray-900">{invoice.number}</div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-700">
                                                {invoice.date ? format(new Date(invoice.date), 'dd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                                            </div>
                                            <div className="text-[10px] text-rose-500 font-black flex items-center gap-1 uppercase tracking-tighter mt-0.5">
                                                <Clock size={10} />
                                                Échéance: {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy') : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-gray-600">
                                            {invoice.transportCompany.name}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-black text-indigo-600">
                                            {invoice.totalAmount.toLocaleString()} MAD
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-center">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-right text-sm">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={async () => {
                                                        const res = await fetch(`/api/company/invoices/${invoice.id}`);
                                                        if (res.ok) setSelectedInvoice(await res.json());
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 bg-white border border-gray-100 rounded-xl hover:border-indigo-100 shadow-sm transition-all"
                                                    title="Voir les détails"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPDF(invoice.id, invoice.number)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 bg-white border border-gray-100 rounded-xl hover:border-indigo-100 shadow-sm transition-all"
                                                    title="Télécharger"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Invoice Detail Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">{selectedInvoice.number}</h3>
                                <p className="text-gray-500 text-sm">Émise par {selectedInvoice.transportCompany.name}</p>
                            </div>
                            <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
                                <ChevronRight className="rotate-90 md:rotate-0" size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <DetailCard label="Total TTC" value={`${selectedInvoice.totalAmount.toLocaleString()} MAD`} color="indigo" />
                                <DetailCard label="Status" value={selectedInvoice.status} isStatus badge={getStatusBadge(selectedInvoice.status)} />
                                <DetailCard label="Échéance Finale" value={selectedInvoice.dueDate ? format(new Date(selectedInvoice.dueDate), 'dd/MM/yyyy') : 'N/A'} color="rose" />
                            </div>

                            {/* Payment Schedule */}
                            {selectedInvoice.installments && selectedInvoice.installments.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <CreditCard size={16} />
                                        Échéancier de Paiement
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedInvoice.installments.map((inst: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${inst.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        {inst.status === 'PAID' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-gray-900">{inst.amount.toLocaleString()} MAD</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Échéance: {format(new Date(inst.dueDate), 'dd/MM/yyyy')}</div>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${inst.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {inst.status === 'PAID' ? 'Réglé' : 'À régler'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Line Items */}
                            <div>
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Info size={16} />
                                    Détails de la Facture
                                </h4>
                                <div className="border border-gray-100 rounded-3xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50/50 border-b border-gray-100 font-bold text-gray-400">
                                            <tr>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4 text-center">Qté</th>
                                                <th className="px-6 py-4 text-right">Montant TTC</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {selectedInvoice.items?.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-800">{item.description}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right font-black text-indigo-600">{item.totalLine.toLocaleString()} MAD</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl text-xs font-bold border border-amber-100">
                                <AlertCircle size={14} />
                                Vous avez une question ? Contactez le transporteur.
                            </div>
                            <button
                                onClick={() => handleDownloadPDF(selectedInvoice.id, selectedInvoice.number)}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                <Download size={18} />
                                Télécharger PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailCard({ label, value, isStatus, badge, color }: { label: string, value: string, isStatus?: boolean, badge?: React.ReactNode, color?: string }) {
    return (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{label}</p>
            {isStatus ? (
                <div className="pt-1">{badge}</div>
            ) : (
                <p className={`text-lg font-black tracking-tight ${color === 'rose' ? 'text-rose-600' : 'text-gray-900'}`}>{value}</p>
            )}
        </div>
    );
}
