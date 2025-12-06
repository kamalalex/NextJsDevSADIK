'use client';

import { useState, useEffect } from 'react';

interface Driver {
    id: string;
    name: string;
    email: string;
    phone: string;
    license: string;
    cin?: string;
    licenseDate?: string;
    status: string;
    subcontractor?: {
        companyName: string;
    };
}

export default function DriverList() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [ownerType, setOwnerType] = useState<'COMPANY' | 'SUBCONTRACTOR'>('COMPANY');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        license: '',
        cin: '',
        licenseDate: '',
        subcontractorId: ''
    });

    useEffect(() => {
        fetchDrivers();
        fetchSubcontractors();
    }, []);

    const fetchDrivers = async () => {
        try {
            const response = await fetch('/api/company/drivers');
            if (response.ok) {
                const data = await response.json();
                setDrivers(data);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubcontractors = async () => {
        try {
            const response = await fetch('/api/company/subcontractors');
            if (response.ok) {
                const data = await response.json();
                setSubcontractors(data);
            }
        } catch (error) {
            console.error('Error fetching subcontractors:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...formData };

            if (ownerType === 'COMPANY') {
                delete payload.subcontractorId;
            }

            const response = await fetch('/api/company/drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    license: '',
                    cin: '',
                    licenseDate: '',
                    subcontractorId: ''
                });
                setOwnerType('COMPANY');
                fetchDrivers();
            }
        } catch (error) {
            console.error('Error creating driver:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Chauffeurs</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    + Ajouter un chauffeur
                </button>
            </div>

            <ul className="divide-y divide-gray-200">
                {drivers.map((driver) => (
                    <li key={driver.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                    {driver.name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                                    <div className="text-sm text-gray-500">{driver.phone}</div>
                                    {driver.subcontractor && (
                                        <div className="text-xs text-blue-600 mt-0.5">
                                            Sous-traitant: {driver.subcontractor.companyName}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {driver.status}
                                </span>
                                <span className="text-sm text-gray-500 mt-1">Permis: {driver.license}</span>
                            </div>
                        </div>
                    </li>
                ))}
                {drivers.length === 0 && (
                    <li className="px-4 py-8 text-center text-gray-500">
                        Aucun chauffeur enregistré.
                    </li>
                )}
            </ul>

            {/* Modal d'ajout */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Ajouter un chauffeur</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Owner Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Employeur</label>
                                <div className="mt-1 flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-blue-600"
                                            name="ownerType"
                                            value="COMPANY"
                                            checked={ownerType === 'COMPANY'}
                                            onChange={() => setOwnerType('COMPANY')}
                                        />
                                        <span className="ml-2">Ma Société</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-blue-600"
                                            name="ownerType"
                                            value="SUBCONTRACTOR"
                                            checked={ownerType === 'SUBCONTRACTOR'}
                                            onChange={() => setOwnerType('SUBCONTRACTOR')}
                                        />
                                        <span className="ml-2">Sous-traitant</span>
                                    </label>
                                </div>
                            </div>

                            {ownerType === 'SUBCONTRACTOR' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sous-traitant *</label>
                                    <select
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.subcontractorId}
                                        onChange={(e) => setFormData({ ...formData, subcontractorId: e.target.value })}
                                    >
                                        <option value="">Sélectionner un sous-traitant</option>
                                        {subcontractors.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.companyName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom complet *</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email (optionnel)</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Téléphone *</label>
                                <input
                                    type="tel"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Numéro de CIN</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.cin}
                                        onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Numéro de permis *</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.license}
                                        onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date d'obtention du permis</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.licenseDate}
                                    onChange={(e) => setFormData({ ...formData, licenseDate: e.target.value })}
                                />
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
