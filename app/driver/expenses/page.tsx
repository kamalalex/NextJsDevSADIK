
'use client';

import { useState, useEffect } from 'react';
import { Plus, Request, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Expense {
    id: string;
    type: string;
    amount: number;
    date: string;
    description?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
    rejectionReason?: string;
}

export default function DriverExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form state
    const [type, setType] = useState('FUEL');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/driver/expenses');
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/driver/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, amount, date, description })
            });
            if (res.ok) {
                setIsFormOpen(false);
                setAmount('');
                setDescription('');
                fetchExpenses();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> VALIDÉ</span>;
            case 'REJECTED': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> REFUSÉ</span>;
            case 'PAID': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> PAYÉ</span>;
            default: return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> EN ATTENTE</span>;
        }
    };

    const getTypeLabel = (p: string) => {
        const types: Record<string, string> = {
            'FUEL': '⛽ Carburant',
            'TOLL': '🛣️ Péage',
            'MAINTENANCE': '🔧 Entretien',
            'MEAL': '🍔 Repas',
            'ACCOMMODATION': '🏨 Hébergement',
            'OTHER': '📄 Autre'
        };
        return types[p] || p;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Mes Frais</h1>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} /> Déclarer
                </button>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Déclarer une dépense</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de dépense</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="FUEL">⛽ Carburant</option>
                                    <option value="TOLL">🛣️ Péage</option>
                                    <option value="MAINTENANCE">🔧 Entretien</option>
                                    <option value="MEAL">🍔 Repas</option>
                                    <option value="ACCOMMODATION">🏨 Hébergement</option>
                                    <option value="OTHER">📄 Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (MAD)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Facultatif)</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Envoi...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Chargement...</div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Aucune dépense</h3>
                    <p className="text-gray-500 mt-2">Vous n'avez déclaré aucune dépense pour le moment.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Montant</th>
                                    <th className="px-6 py-4">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-600">{format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{getTypeLabel(expense.type)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{expense.description || '-'}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{expense.amount.toLocaleString()} MAD</td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(expense.status)}
                                            {expense.status === 'REJECTED' && (
                                                <div className="text-xs text-red-500 mt-1">{expense.rejectionReason}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
