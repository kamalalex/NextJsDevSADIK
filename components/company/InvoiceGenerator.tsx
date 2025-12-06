'use client';

import { useState, useEffect } from 'react';
import { Operation, Company } from '@prisma/client';
import { format } from 'date-fns';

interface Client extends Company {
    id: string;
    name: string;
}

interface OperationWithDetails extends Operation {
    client: Client;
}

export default function InvoiceGenerator({ onSuccess }: { onSuccess: () => void }) {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [operations, setOperations] = useState<OperationWithDetails[]>([]);
    const [selectedOperationIds, setSelectedOperationIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [dueDate, setDueDate] = useState<string>(
        format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    );

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
            // Fetch operations that are confirmed/delivered but not invoiced
            const res = await fetch(`/api/company/operations?clientId=${clientId}&notInvoiced=true`);
            if (res.ok) {
                const data = await res.json();
                // Filter for CONFIRMED or DELIVERED status
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

    const handleOperationToggle = (opId: string) => {
        setSelectedOperationIds(prev => {
            if (prev.includes(opId)) {
                return prev.filter(id => id !== opId);
            } else {
                return [...prev, opId];
            }
        });
    };

    const handleGenerateInvoice = async () => {
        if (!selectedClientId || selectedOperationIds.length === 0) return;

        try {
            setGenerating(true);
            const res = await fetch('/api/company/invoices/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClientId,
                    operationIds: selectedOperationIds,
                    dueDate: new Date(dueDate).toISOString(),
                    taxRate: 20 // Default tax rate
                })
            });

            if (res.ok) {
                // Reset form
                setSelectedClientId('');
                setSelectedOperationIds([]);
                setOperations([]);
                onSuccess();
                alert('Facture générée avec succès !');
            } else {
                const error = await res.json();
                alert(`Erreur: ${error.error}`);
            }
        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Une erreur est survenue lors de la génération de la facture.');
        } finally {
            setGenerating(false);
        }
    };

    const calculateSelectedTotal = () => {
        return operations
            .filter(op => selectedOperationIds.includes(op.id))
            .reduce((sum, op) => sum + (op.salePrice || 0), 0);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Générer une Facture</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <select
                        className="w-full border rounded-md px-3 py-2"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                        <option value="">Sélectionner un client</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                    <input
                        type="date"
                        className="w-full border rounded-md px-3 py-2"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
            </div>

            {selectedClientId && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Opérations à facturer ({operations.length} disponibles)
                    </h3>

                    {loading ? (
                        <div className="text-center py-4 text-gray-500">Chargement des opérations...</div>
                    ) : operations.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
                            Aucune opération facturable trouvée pour ce client.
                        </div>
                    ) : (
                        <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 w-10">
                                            <input
                                                type="checkbox"
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedOperationIds(operations.map(op => op.id));
                                                    } else {
                                                        setSelectedOperationIds([]);
                                                    }
                                                }}
                                                checked={selectedOperationIds.length === operations.length && operations.length > 0}
                                            />
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Montant HT</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {operations.map(op => (
                                        <tr key={op.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOperationIds.includes(op.id)}
                                                    onChange={() => handleOperationToggle(op.id)}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500">
                                                {format(new Date(op.operationDate), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                {op.reference}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                                                {(op.salePrice || 0).toFixed(2)} MAD
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center border-t pt-4">
                <div className="text-sm text-gray-600">
                    {selectedOperationIds.length} opérations sélectionnées
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-gray-900">
                        Total HT: {calculateSelectedTotal().toFixed(2)} MAD
                    </div>
                    <button
                        onClick={handleGenerateInvoice}
                        disabled={generating || selectedOperationIds.length === 0}
                        className={`px-4 py-2 rounded-md text-white font-medium ${generating || selectedOperationIds.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {generating ? 'Génération...' : 'Générer la facture'}
                    </button>
                </div>
            </div>
        </div>
    );
}
