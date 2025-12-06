'use client';

import { useState, useEffect } from 'react';

interface Vehicle {
    id: string;
    plateNumber: string;
    model: string;
    brand?: string;
    capacity: string;
    vehicleType: string;
    status: string;
}

export default function VehicleList() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ownerType, setOwnerType] = useState<'COMPANY' | 'SUBCONTRACTOR'>('COMPANY');

    const [formData, setFormData] = useState({
        plateNumber: '',
        model: '',
        brand: '',
        ptac: 'PTAC_7T',
        vehicleType: 'RIDEL',
        firstCirculationDate: '',
        technicalInspectionDate: '',
        insuranceDate: '',
        subcontractorId: ''
    });

    useEffect(() => {
        fetchVehicles();
        fetchSubcontractors();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await fetch('/api/company/vehicles');
            if (response.ok) {
                const data = await response.json();
                setVehicles(data);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
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
            const payload: any = {
                ...formData,
                capacity: formData.ptac
            };

            if (ownerType === 'COMPANY') {
                delete payload.subcontractorId;
            }

            const response = await fetch('/api/company/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setFormData({
                    plateNumber: '',
                    model: '',
                    brand: '',
                    ptac: 'PTAC_7T',
                    vehicleType: 'RIDEL',
                    firstCirculationDate: '',
                    technicalInspectionDate: '',
                    insuranceDate: '',
                    subcontractorId: ''
                });
                setOwnerType('COMPANY');
                fetchVehicles();
            }
        } catch (error) {
            console.error('Error creating vehicle:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Flotte de Véhicules</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                    + Ajouter un véhicule
                </button>
            </div>

            <ul className="divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                    <li key={vehicle.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {vehicle.vehicleType.charAt(0)}
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{vehicle.plateNumber}</div>
                                    <div className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {vehicle.status}
                                </span>
                                <span className="text-sm text-gray-500 mt-1">{vehicle.capacity?.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </li>
                ))}
                {vehicles.length === 0 && (
                    <li className="px-4 py-8 text-center text-gray-500">
                        Aucun véhicule enregistré.
                    </li>
                )}
            </ul>

            {/* Modal d'ajout */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-medium mb-4">Ajouter un véhicule</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Owner Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Propriétaire</label>
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
                                <label className="block text-sm font-medium text-gray-700">Immatriculation *</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.plateNumber}
                                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Marque</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Modèle *</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                    >
                                        <option value="RIDEL">Ridel</option>
                                        <option value="FOURGON">Fourgon</option>
                                        <option value="BACHE">Baché</option>
                                        <option value="PLATEAU">Plateau</option>
                                        <option value="PORTE_CONTENEUR">Porte-Conteneur</option>
                                        <option value="BENNE">Benne</option>
                                        <option value="FRIGO">Frigo</option>
                                        <option value="AUTRE">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">PTAC</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.ptac}
                                        onChange={(e) => setFormData({ ...formData, ptac: e.target.value })}
                                    >
                                        <option value="PTAC_3_5T">3.5 Tonnes</option>
                                        <option value="PTAC_7T">7 Tonnes</option>
                                        <option value="PTAC_14T">14 Tonnes</option>
                                        <option value="PTAC_25T">25 Tonnes</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date de 1ère mise en circulation</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.firstCirculationDate}
                                    onChange={(e) => setFormData({ ...formData, firstCirculationDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date de visite technique</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.technicalInspectionDate}
                                    onChange={(e) => setFormData({ ...formData, technicalInspectionDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date d'assurance</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.insuranceDate}
                                    onChange={(e) => setFormData({ ...formData, insuranceDate: e.target.value })}
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
