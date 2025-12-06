'use client';

import { useState, useEffect } from 'react';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    operationId: string;
    onSuccess: () => void;
    currentDriverId?: string | null;
    currentVehicleId?: string | null;
}

interface Driver {
    id: string;
    name: string;
    companyId?: string;
    subcontractorId?: string;
}

interface Vehicle {
    id: string;
    plateNumber: string;
    model: string;
    companyId?: string;
    subcontractorId?: string;
}

interface Subcontractor {
    id: string;
    companyName: string;
    drivers: Driver[];
    vehicles: Vehicle[];
}

export default function AssignmentModal({
    isOpen,
    onClose,
    operationId,
    onSuccess,
    currentDriverId,
    currentVehicleId
}: AssignmentModalProps) {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
    const [selectedDriver, setSelectedDriver] = useState(currentDriverId || '');
    const [selectedVehicle, setSelectedVehicle] = useState(currentVehicleId || '');
    const [selectedSubcontractor, setSelectedSubcontractor] = useState('');
    const [useSubcontractor, setUseSubcontractor] = useState(false);
    const [salePrice, setSalePrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchResources();
        }
    }, [isOpen]);

    const fetchResources = async () => {
        try {
            const [driversRes, vehiclesRes, subcontractorsRes] = await Promise.all([
                fetch('/api/company/drivers'),
                fetch('/api/company/vehicles'),
                fetch('/api/company/subcontractors')
            ]);

            if (driversRes.ok && vehiclesRes.ok && subcontractorsRes.ok) {
                setDrivers(await driversRes.json());
                setVehicles(await vehiclesRes.json());
                setSubcontractors(await subcontractorsRes.json());
            }
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch(`/api/company/operations/${operationId}/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverId: selectedDriver || null,
                    vehicleId: selectedVehicle || null,
                    subcontractorId: useSubcontractor ? selectedSubcontractor : null,
                    salePrice: salePrice ? parseFloat(salePrice) : null,
                    purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null
                })
            });

            if (response.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error assigning resources:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getAvailableDrivers = () => {
        if (!useSubcontractor) {
            return drivers.filter(d => d.companyId);
        }
        if (!selectedSubcontractor) return [];
        const sub = subcontractors.find(s => s.id === selectedSubcontractor);
        return sub?.drivers || [];
    };

    const getAvailableVehicles = () => {
        if (!useSubcontractor) {
            return vehicles.filter(v => v.companyId);
        }
        if (!selectedSubcontractor) return [];
        const sub = subcontractors.find(s => s.id === selectedSubcontractor);
        return sub?.vehicles || [];
    };

    const handleSubcontractorChange = (subId: string) => {
        setSelectedSubcontractor(subId);
        setSelectedDriver('');
        setSelectedVehicle('');
    };

    const handleUseSubcontractorChange = (value: boolean) => {
        setUseSubcontractor(value);
        setSelectedSubcontractor('');
        setSelectedDriver('');
        setSelectedVehicle('');
        if (!value) {
            setPurchasePrice('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-medium mb-4">Assigner des ressources</h3>

                {loading ? (
                    <div className="text-center py-4">Chargement...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Resource Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type de ressources</label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        name="resourceType"
                                        checked={!useSubcontractor}
                                        onChange={() => handleUseSubcontractorChange(false)}
                                    />
                                    <span className="ml-2">Ressources internes</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600"
                                        name="resourceType"
                                        checked={useSubcontractor}
                                        onChange={() => handleUseSubcontractorChange(true)}
                                    />
                                    <span className="ml-2">Sous-traitant</span>
                                </label>
                            </div>
                        </div>

                        {/* Subcontractor Selection */}
                        {useSubcontractor && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sous-traitant *</label>
                                <select
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={selectedSubcontractor}
                                    onChange={(e) => handleSubcontractorChange(e.target.value)}
                                >
                                    <option value="">Sélectionner un sous-traitant</option>
                                    {subcontractors.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.companyName} ({sub.drivers.length} chauffeurs, {sub.vehicles.length} véhicules)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Driver Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Chauffeur</label>
                            <select
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                value={selectedDriver}
                                onChange={(e) => setSelectedDriver(e.target.value)}
                                disabled={useSubcontractor && !selectedSubcontractor}
                            >
                                <option value="">-- Aucun --</option>
                                {getAvailableDrivers().map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Vehicle Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Véhicule</label>
                            <select
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                                disabled={useSubcontractor && !selectedSubcontractor}
                            >
                                <option value="">-- Aucun --</option>
                                {getAvailableVehicles().map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.plateNumber} - {vehicle.model}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Pricing Section */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Tarification</h4>

                            {/* Sale Price (Client) */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Prix de vente client (MAD)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={salePrice}
                                    onChange={(e) => setSalePrice(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Purchase Price (Subcontractor) - Only show when using subcontractor */}
                            {useSubcontractor && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Prix d'achat sous-traitant (MAD)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={purchasePrice}
                                        onChange={(e) => setPurchasePrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {salePrice && purchasePrice && parseFloat(salePrice) > 0 && parseFloat(purchasePrice) > 0 && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Marge: {(parseFloat(salePrice) - parseFloat(purchasePrice)).toFixed(2)} MAD
                                            ({(((parseFloat(salePrice) - parseFloat(purchasePrice)) / parseFloat(salePrice)) * 100).toFixed(1)}%)
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                                disabled={submitting}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
