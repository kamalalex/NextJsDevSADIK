'use client';

import { useState, useEffect, useMemo } from 'react';
import { Operation, Company } from '@prisma/client';
import { format } from 'date-fns';
import { Plus, Trash2, Calculator, Info } from 'lucide-react';

interface Client extends Company {
    id: string;
    name: string;
}

interface OperationWithDetails extends Operation {
    client: Client;
}

interface InvoiceLine {
    id: string; // Temporary ID for UI
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    taxAmount: number;
    totalLine: number;
}

export default function InvoiceGenerator({ onSuccess }: { onSuccess: () => void }) {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [operations, setOperations] = useState<OperationWithDetails[]>([]);
    const [selectedOperationIds, setSelectedOperationIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Dates
    const [invoiceDate, setInvoiceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [dueDate, setDueDate] = useState<string>(
        format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    );

    // Line Items
    const [items, setItems] = useState<InvoiceLine[]>([]);

    // Partial Payments
    const [allowPartial, setAllowPartial] = useState(false);
    const [minPaymentPercent, setMinPaymentPercent] = useState(20);
    const [maxInstallments, setMaxInstallments] = useState(3);

    // Metadata
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClientId) {
            fetchOperations(selectedClientId);
        } else {
            setOperations([]);
            setSelectedOperationIds([]);
        }
    }, [selectedClientId]);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/company/clients');
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchOperations = async (clientId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/company/operations?clientId=${clientId}&notInvoiced=true`);
            if (res.ok) {
                const data = await res.json();
                const invoiceableOps = data.filter((op: OperationWithDetails) =>
                    op.status === 'CONFIRMED' || op.status === 'DELIVERED'
                );
                setOperations(invoiceableOps);
            }
        } catch (error) {
            console.error('Error fetching operations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = (initial?: Partial<InvoiceLine>) => {
        const newItem: InvoiceLine = {
            id: Math.random().toString(36).substr(2, 9),
            description: initial?.description || '',
            quantity: initial?.quantity || 1,
            unitPrice: initial?.unitPrice || 0,
            vatRate: initial?.vatRate || 20,
            taxAmount: 0,
            totalLine: 0,
            ...initial
        };

        // Recalculate tax and total for the new item
        newItem.taxAmount = (newItem.quantity * newItem.unitPrice) * (newItem.vatRate / 100);
        newItem.totalLine = (newItem.quantity * newItem.unitPrice) + newItem.taxAmount;

        setItems([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, updates: Partial<InvoiceLine>) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, ...updates };
                updated.taxAmount = (updated.quantity * updated.unitPrice) * (updated.vatRate / 100);
                updated.totalLine = (updated.quantity * updated.unitPrice) + updated.taxAmount;
                return updated;
            }
            return item;
        }));
    };

    const handleOperationToggle = (op: OperationWithDetails) => {
        setSelectedOperationIds(prev => {
            if (prev.includes(op.id)) {
                // Remove item from lines
                setItems(items.filter(item => item.description !== `Transport ${op.reference}`));
                return prev.filter(id => id !== op.id);
            } else {
                // Add to lines
                handleAddItem({
                    description: `Transport ${op.reference}`,
                    unitPrice: op.salePrice || 0,
                    quantity: 1,
                    vatRate: 20
                });
                return [...prev, op.id];
            }
        });
    };

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const totalAmount = subtotal + taxTotal;

        // Group by VAT rate
        const vatSummary: Record<number, number> = {};
        items.forEach(item => {
            vatSummary[item.vatRate] = (vatSummary[item.vatRate] || 0) + item.taxAmount;
        });

        return { subtotal, taxTotal, totalAmount, vatSummary };
    }, [items]);

    const handleGenerateInvoice = async () => {
        if (!selectedClientId || items.length === 0) return;

        try {
            setGenerating(true);
            const res = await fetch('/api/company/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClientId,
                    operationIds: selectedOperationIds,
                    dueDate: new Date(dueDate).toISOString(),
                    invoiceDate: new Date(invoiceDate).toISOString(),
                    items: items,
                    notes,
                    terms,
                    partialPaymentsAllowed: allowPartial,
                    minPaymentPercentage: allowPartial ? minPaymentPercent : null,
                    maxInstallments: allowPartial ? maxInstallments : null
                })
            });

            if (res.ok) {
                onSuccess();
                alert('Facture générée avec succès !');
                // Reset form
                setItems([]);
                setSelectedOperationIds([]);
            } else {
                const error = await res.json();
                alert(`Erreur: ${error.error}`);
            }
        } catch (error) {
            console.error('Error generating invoice:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-5xl mx-auto border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nouvelle Facture</h2>
                    <p className="text-gray-500 text-sm">Créez une facture professionnelle avec gestion du taux de TVA par ligne.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleAddItem()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        Ajouter une ligne
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Configuration Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50/50"
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                            >
                                <option value="">Choisir un client</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Operations Disponibles</label>
                            <div className="relative group">
                                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50/50">
                                    {loading ? (
                                        <p className="text-xs text-center py-2 text-gray-400">Chargement...</p>
                                    ) : operations.length === 0 ? (
                                        <p className="text-xs text-center py-2 text-gray-400">Aucune operation</p>
                                    ) : operations.map(op => (
                                        <label key={op.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedOperationIds.includes(op.id)}
                                                onChange={() => handleOperationToggle(op)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs text-gray-700">{op.reference} - {op.salePrice} MAD</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Description</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-20 text-center">Qté</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-32">Prix Unitaire</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-24">TVA %</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-32 text-right">Total TTC</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                                            Aucune ligne ajoutée. Sélectionnez des opérations ou ajoutez une ligne manuellement.
                                        </td>
                                    </tr>
                                ) : items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                                placeholder="Description du service"
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm p-0"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-center"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm p-0"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={item.vatRate}
                                                onChange={(e) => updateItem(item.id, { vatRate: Number(e.target.value) })}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 appearance-none"
                                            >
                                                <option value={20}>20%</option>
                                                <option value={14}>14%</option>
                                                <option value={10}>10%</option>
                                                <option value={7}>7%</option>
                                                <option value={0}>0%</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-none">
                                            {item.totalLine.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Calculator size={16} className="text-indigo-600" />
                            Récapitulatif
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Total HT</span>
                                <span>{totals.subtotal.toFixed(2)} MAD</span>
                            </div>
                            <div className="space-y-1">
                                {Object.entries(totals.vatSummary).map(([rate, amount]) => (
                                    <div key={rate} className="flex justify-between text-xs text-gray-500 pl-4 border-l border-gray-200">
                                        <span>TVA {rate}%</span>
                                        <span>{amount.toFixed(2)} MAD</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-base font-bold text-gray-900">Total TTC</span>
                                <span className="text-xl font-black text-indigo-600">{totals.totalAmount.toFixed(2)} MAD</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Options de Paiement</label>
                            <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-all shadow-sm">
                                <input
                                    type="checkbox"
                                    checked={allowPartial}
                                    onChange={(e) => setAllowPartial(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Paiements Partiels</p>
                                    <p className="text-xs text-gray-500">Autoriser plusieurs versements</p>
                                </div>
                            </label>
                        </div>

                        {allowPartial && (
                            <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 gap-4 flex flex-col animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-xs font-semibold text-indigo-900 mb-1.5">Paiement Minimum (%)</label>
                                    <input
                                        type="number"
                                        value={minPaymentPercent}
                                        onChange={(e) => setMinPaymentPercent(Number(e.target.value))}
                                        className="w-full bg-white border border-indigo-200 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-indigo-900 mb-1.5">Nb. Max d'échéances</label>
                                    <input
                                        type="number"
                                        value={maxInstallments}
                                        onChange={(e) => setMaxInstallments(Number(e.target.value))}
                                        className="w-full bg-white border border-indigo-200 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date Facture</label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Échéance</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 border-t border-gray-100 pt-8 justify-end">
                <div className="flex-1 flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-xs border border-amber-100">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p>
                        Une fois générée, la facture sera enregistrée en tant que <strong>Brouillon (Draft)</strong>.
                        Vous pourrez la valider et l'envoyer au client depuis la liste des factures.
                    </p>
                </div>
                <button
                    onClick={handleGenerateInvoice}
                    disabled={generating || !selectedClientId || items.length === 0}
                    className={`px-8 py-3 rounded-xl text-white font-bold text-lg shadow-lg active:scale-95 transition-all ${generating || !selectedClientId || items.length === 0
                            ? 'bg-gray-300 shadow-none cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                        }`}
                >
                    {generating ? 'Traitement...' : 'Générer la facture'}
                </button>
            </div>
        </div>
    );
}
