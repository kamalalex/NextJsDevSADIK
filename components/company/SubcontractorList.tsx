'use client';

import { useState, useEffect } from 'react';

interface Subcontractor {
    id: string;
    name: string;
    companyName: string;
    phone: string;
    email: string;
    address: string;
    companyId: string; // RC/IF
    paymentWithInvoice: boolean;
    vehicles?: any[];
    drivers?: any[];
}

export default function SubcontractorList() {
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        phone: '',
        email: '',
        address: '',
        companyId: '',
        paymentWithInvoice: true
    });

    useEffect(() => {
        fetchSubcontractors();
    }, []);

    const fetchSubcontractors = async () => {
        try {
            const response = await fetch('/api/company/subcontractors');
            if (response.ok) {
                const data = await response.json();
                setSubcontractors(data);
            }
        } catch (error) {
            console.error('Error fetching subcontractors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/company/subcontractors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setFormData({
                    name: '',
                    companyName: '',
                    phone: '',
                    email: '',
                    address: '',
                    companyId: '',
                    paymentWithInvoice: true
                });
                fetchSubcontractors();
            }
        } catch (error) {
            console.error('Error creating subcontractor:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Sous-traitants</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    + Ajouter un sous-traitant
                </button>
            </div>

            <ul className="divide-y divide-gray-200">
                {subcontractors.map((sub) => (
                    <li key={sub.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                    {sub.companyName.charAt(0)}
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{sub.companyName}</div>
                                    <div className="text-sm text-gray-500">{sub.name} - {sub.phone}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm text-gray-500">
                                    {sub.vehicles?.length || 0} véhicules
                                </span>
                                <span className="text-xs text-gray-400">
                                    {sub.drivers?.length || 0} chauffeurs
                                </span>
                            </div>
                        </div>
                    </li>
                ))}
                {subcontractors.length === 0 && (
                    <li className="px-4 py-8 text-center text-gray-500">
                        Aucun sous-traitant enregistré.
                    </li>
                )}
            </ul>

            {/* Modal d'ajout */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Ajouter un sous-traitant</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom de la société</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom du contact</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Adresse</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">RC / IF (Identifiant)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.companyId}
                                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={formData.paymentWithInvoice}
                                    onChange={(e) => setFormData({ ...formData, paymentWithInvoice: e.target.checked })}
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    Paiement sur facture
                                </label>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
