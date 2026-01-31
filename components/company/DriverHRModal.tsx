
'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Check, XCircle, FileText, Gift } from 'lucide-react';
import { format } from 'date-fns';

interface DriverHRModalProps {
    driverId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export default function DriverHRModal({ driverId, onClose, onUpdate }: DriverHRModalProps) {
    const [driver, setDriver] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'bonuses' | 'expenses'>('details');

    // Forms
    const [newSalary, setNewSalary] = useState('');
    const [bonusAmount, setBonusAmount] = useState('');
    const [bonusReason, setBonusReason] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [driverId]);

    const fetchDetails = async () => {
        try {
            const res = await fetch(`/api/company/hr/drivers/${driverId}`);
            if (res.ok) {
                const data = await res.json();
                setDriver(data);
                setNewSalary(data.baseSalary?.toString() || '');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSalary = async () => {
        if (!newSalary) return;
        try {
            const res = await fetch('/api/company/hr/salary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId, baseSalary: newSalary })
            });
            if (res.ok) {
                alert('Salaire mis à jour !');
                fetchDetails();
                onUpdate();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddBonus = async () => {
        if (!bonusAmount || !bonusReason) return;
        try {
            const res = await fetch('/api/company/hr/bonuses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId, amount: bonusAmount, reason: bonusReason })
            });
            if (res.ok) {
                alert('Prime ajoutée !');
                setBonusAmount('');
                setBonusReason('');
                fetchDetails();
                onUpdate();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateExpense = async (expenseId: string, status: string, reason?: string) => {
        try {
            const res = await fetch('/api/company/hr/expenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expenseId, status, rejectionReason: reason })
            });
            if (res.ok) {
                fetchDetails();
                onUpdate();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (!driver && loading) return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center text-white">Chargement...</div>;
    if (!driver) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{driver.name}</h2>
                        <p className="text-sm text-gray-500">Gestion RH & Paie</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex border-b bg-white">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        💰 Salaire & Détails
                    </button>
                    <button
                        onClick={() => setActiveTab('bonuses')}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 ${activeTab === 'bonuses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        🎁 Primes & Bonus
                    </button>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 ${activeTab === 'expenses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        📝 Notes de Frais
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <DollarSign className="text-blue-500" /> Configuration Salaire
                                </h3>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Salaire de Base Mensuel (MAD)</label>
                                        <input
                                            type="number"
                                            value={newSalary}
                                            onChange={(e) => setNewSalary(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateSalary}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                    >
                                        Mettre à jour
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-bold mb-4">Résumé du Mois en Cours</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-emerald-50 rounded-lg">
                                        <p className="text-sm text-emerald-600 font-medium">Commissions de Trajet</p>
                                        <p className="text-xl font-bold text-emerald-900">
                                            {driver.assignments?.reduce((sum: number, a: any) => sum + (a.assignedPrice || 0), 0).toLocaleString()} MAD
                                        </p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-600 font-medium">Primes / Bonus</p>
                                        <p className="text-xl font-bold text-blue-900">
                                            {driver.bonuses?.reduce((sum: number, b: any) => sum + b.amount, 0).toLocaleString()} MAD
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bonuses' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Plus className="text-green-500" /> Ajouter une Prime
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant (MAD)</label>
                                        <input
                                            type="number"
                                            value={bonusAmount}
                                            onChange={(e) => setBonusAmount(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Ex: 500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                                        <input
                                            type="text"
                                            value={bonusReason}
                                            onChange={(e) => setBonusReason(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Ex: Excellent service client"
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <button
                                        onClick={handleAddBonus}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                                    >
                                        Ajouter la Prime
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Motif</th>
                                            <th className="px-6 py-3 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {driver.bonuses?.map((bonus: any) => (
                                            <tr key={bonus.id}>
                                                <td className="px-6 py-3 text-sm text-gray-600">{format(new Date(bonus.date), 'dd/MM/yyyy')}</td>
                                                <td className="px-6 py-3 text-sm text-gray-900 font-medium">{bonus.reason}</td>
                                                <td className="px-6 py-3 text-sm text-green-600 font-bold text-right">+{bonus.amount.toLocaleString()} MAD</td>
                                            </tr>
                                        ))}
                                        {(!driver.bonuses || driver.bonuses.length === 0) && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-gray-400">Aucune prime pour le moment.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="space-y-4">
                            {driver.expenses?.map((expense: any) => (
                                <div key={expense.id} className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                                expense.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                    'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900">{expense.type}</h4>
                                                <span className="text-sm text-gray-500">• {format(new Date(expense.date), 'dd/MM/yyyy')}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{expense.description || "Pas de description"}</p>
                                            <p className="text-lg font-bold text-gray-900 mt-2">{expense.amount.toLocaleString()} MAD</p>

                                            {expense.status === 'REJECTED' && (
                                                <p className="text-xs text-red-500 mt-1">Refusé : {expense.rejectionReason}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {expense.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateExpense(expense.id, 'APPROVED')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                                >
                                                    <Check size={16} /> Valider
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Motif du refus ?');
                                                        if (reason) handleUpdateExpense(expense.id, 'REJECTED', reason);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                                >
                                                    <XCircle size={16} /> Refuser
                                                </button>
                                            </>
                                        )}
                                        {expense.status !== 'PENDING' && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-center ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {expense.status === 'APPROVED' ? 'VALIDÉ' : 'REFUSÉ'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!driver.expenses || driver.expenses.length === 0) && (
                                <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-400">
                                    Aucune note de frais déclarée.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
