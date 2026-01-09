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
    ptac: string;
    firstCirculationDate?: string;
    technicalInspectionDate?: string;
    insuranceDate?: string;
    subcontractor?: { companyName: string };
    company?: { name: string };
    source?: 'INTERNAL' | 'SUBCONTRACTOR' | 'LINKED_COMPANY' | 'INDEPENDENT';
    displayCompanyName?: string;
    subcontractorId?: string;
    length?: number;
    width?: number;
    height?: number;
    registrationFront?: string;
    registrationBack?: string;
    vehiclePhoto?: string;
}

const formatVehicleType = (type: string) => {
    switch (type) {
        case 'RIDEL': return 'Ridel';
        case 'FOURGON': return 'Fourgon';
        case 'BACHE': return 'Baché';
        case 'PLATEAU': return 'Plateau';
        case 'PORTE_CONTENEUR': return 'Porte-Conteneur';
        case 'BENNE': return 'Benne';
        case 'FRIGO': return 'Frigo';
        case 'AUTRE': return 'Autre';
        default: return type;
    }
};

const formatPtac = (ptac: string) => {
    switch (ptac) {
        case 'PTAC_LESS_3_5T': return '< 3.5 Tonnes';
        case 'PTAC_3_5T': return '3.5 Tonnes';
        case 'PTAC_7T': return '7 Tonnes';
        case 'PTAC_14T': return '14 Tonnes';
        case 'PTAC_19T': return '19 Tonnes';
        case 'PTAC_25T': return '25 Tonnes';
        case 'PTAC_MORE_25T': return '> 25 Tonnes';
        default: return ptac?.replace('PTAC_', '').replace('_', ' ') || '-';
    }
};

export default function VehicleList() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ownerType, setOwnerType] = useState<'COMPANY' | 'SUBCONTRACTOR'>('COMPANY');
    const [viewDocsVehicle, setViewDocsVehicle] = useState<Vehicle | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [formData, setFormData] = useState({
        plateNumber: '',
        model: '',
        brand: '',
        ptac: 'PTAC_7T',
        vehicleType: 'RIDEL',
        firstCirculationDate: '',
        technicalInspectionDate: '',
        insuranceDate: '',
        subcontractorId: '',
        length: '',
        width: '',
        height: '',
        registrationFront: '',
        registrationBack: '',
        vehiclePhoto: ''
    });

    const [editingId, setEditingId] = useState<string | null>(null);

    const resetForm = () => {
        setFormData({
            plateNumber: '',
            model: '',
            brand: '',
            ptac: 'PTAC_7T',
            vehicleType: 'RIDEL',
            firstCirculationDate: '',
            technicalInspectionDate: '',
            insuranceDate: '',
            subcontractorId: '',
            length: '',
            width: '',
            height: '',
            registrationFront: '',
            registrationBack: '',
            vehiclePhoto: ''
        });
        setEditingId(null);
        setOwnerType('COMPANY');
    };

    const handleEdit = (vehicle: Vehicle) => {
        setFormData({
            plateNumber: vehicle.plateNumber,
            model: vehicle.model,
            brand: vehicle.brand || '',
            ptac: vehicle.ptac || 'PTAC_7T',
            vehicleType: vehicle.vehicleType || 'RIDEL',
            firstCirculationDate: vehicle.firstCirculationDate ? new Date(vehicle.firstCirculationDate).toISOString().split('T')[0] : '',
            technicalInspectionDate: vehicle.technicalInspectionDate ? new Date(vehicle.technicalInspectionDate).toISOString().split('T')[0] : '',
            insuranceDate: vehicle.insuranceDate ? new Date(vehicle.insuranceDate).toISOString().split('T')[0] : '',
            subcontractorId: vehicle.source === 'SUBCONTRACTOR' ? (vehicle as any).subcontractorId || '' : '',
            length: vehicle.length ? vehicle.length.toString() : '',
            width: vehicle.width ? vehicle.width.toString() : '',
            height: vehicle.height ? vehicle.height.toString() : '',
            registrationFront: vehicle.registrationFront || '',
            registrationBack: vehicle.registrationBack || '',
            vehiclePhoto: vehicle.vehiclePhoto || ''
        });

        if (vehicle.source === 'SUBCONTRACTOR') {
            setOwnerType('SUBCONTRACTOR');
        } else {
            setOwnerType('COMPANY');
        }

        setEditingId(vehicle.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;

        try {
            const response = await fetch(`/api/company/vehicles/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchVehicles();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const localFormData = new FormData();
        localFormData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: localFormData
            });
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, [field]: data.url }));
            } else {
                alert('Erreur lors de l\'upload');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erreur lors de l\'upload');
        }
    };


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
                capacity: formData.ptac,
                length: formData.length ? parseFloat(formData.length) : null,
                width: formData.width ? parseFloat(formData.width) : null,
                height: formData.height ? parseFloat(formData.height) : null,
                registrationFront: formData.registrationFront,
                registrationBack: formData.registrationBack,
                vehiclePhoto: formData.vehiclePhoto
            };

            if (ownerType === 'COMPANY') {
                delete payload.subcontractorId;
            }

            const url = editingId
                ? `/api/company/vehicles/${editingId}`
                : '/api/company/vehicles';

            const method = editingId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsModalOpen(false);
                resetForm();
                fetchVehicles();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de l\'enregistrement');
            }
        } catch (error) {
            console.error('Error creating vehicle:', error);
        }
    };



    const filteredVehicles = vehicles.filter(vehicle => {
        const term = searchTerm.toLowerCase();
        const plate = vehicle.plateNumber?.toLowerCase() || '';
        const type = formatVehicleType(vehicle.vehicleType)?.toLowerCase() || '';
        const ptac = formatPtac(vehicle.ptac || vehicle.capacity)?.toLowerCase() || '';

        return plate.includes(term) || type.includes(term) || ptac.includes(term);
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 gap-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Flotte de Véhicules <span className="ml-2 text-sm text-gray-500">({filteredVehicles.length})</span>
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                    <div className="relative rounded-md shadow-sm w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                            placeholder="Rechercher (Matricule, Type, PTAC)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
                    >
                        + Ajouter un véhicule
                    </button>
                </div>
            </div>

            <ul className="divide-y divide-gray-200">
                {currentItems.map((vehicle) => (
                    <li key={vehicle.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                                    {vehicle.vehiclePhoto ? (
                                        <img src={vehicle.vehiclePhoto} alt={vehicle.plateNumber} className="h-full w-full object-cover" />
                                    ) : (
                                        vehicle.vehicleType.charAt(0)
                                    )}
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{vehicle.plateNumber}</div>
                                    <div className="text-sm text-gray-500">
                                        <span className="font-semibold">{formatVehicleType(vehicle.vehicleType)}</span>
                                        <span className="mx-1">-</span>
                                        {vehicle.brand} {vehicle.model}
                                        {/* Badge Type */}
                                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.source === 'INDEPENDENT' ? 'bg-yellow-100 text-yellow-800' :
                                            vehicle.source === 'INTERNAL' ? 'bg-green-100 text-green-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                            {vehicle.source === 'INTERNAL' ? 'Interne' :
                                                vehicle.source === 'INDEPENDENT' ? 'Indépendant' :
                                                    `ST: ${vehicle.displayCompanyName || '?'}`}
                                        </span>
                                    </div>
                                    {/* PTAC and Dimensions info */}
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium mr-2">PTAC: {formatPtac(vehicle.ptac || vehicle.capacity)}</span>
                                        {(vehicle.length || vehicle.width || vehicle.height) && (
                                            <span className="text-gray-400">
                                                | Dim: {vehicle.length || '-'} x {vehicle.width || '-'} x {vehicle.height || '-'} m
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {vehicle.status}
                                </span>


                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setViewDocsVehicle(vehicle)}
                                        className="text-gray-600 hover:text-gray-900 text-xs font-medium"
                                    >
                                        Documents
                                    </button>
                                    {(vehicle.source === 'INTERNAL' || vehicle.source === 'SUBCONTRACTOR') && (
                                        <button
                                            onClick={() => handleEdit(vehicle)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                        >
                                            Modifier
                                        </button>
                                    )}
                                    {(vehicle.source === 'INTERNAL' || vehicle.source === 'SUBCONTRACTOR' || vehicle.source === 'INDEPENDENT') && (
                                        <button
                                            onClick={() => handleDelete(vehicle.id)}
                                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                                        >
                                            Supprimer
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
                {filteredVehicles.length === 0 && (
                    <li className="px-4 py-8 text-center text-gray-500">
                        {searchTerm ? 'Aucun véhicule ne correspond à votre recherche.' : 'Aucun véhicule enregistré.'}
                    </li>
                )}
            </ul>

            {/* Pagination Controls */}
            {filteredVehicles.length > itemsPerPage && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Suivant
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à <span className="font-medium">{Math.min(indexOfLastItem, filteredVehicles.length)}</span> sur <span className="font-medium">{filteredVehicles.length}</span> résultats
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="sr-only">Précédent</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {/* Page Numbers */}
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === i + 1 ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="sr-only">Suivant</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}



            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-medium mb-4">{editingId ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</h3>
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
                                            <option value="PTAC_LESS_3_5T">&lt; 3.5 Tonnes</option>
                                            <option value="PTAC_3_5T">3.5 Tonnes</option>
                                            <option value="PTAC_7T">7 Tonnes</option>
                                            <option value="PTAC_14T">14 Tonnes</option>
                                            <option value="PTAC_19T">19 Tonnes</option>
                                            <option value="PTAC_25T">25 Tonnes</option>
                                            <option value="PTAC_MORE_25T">&gt; 25 Tonnes</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Dimensions (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (m) - Optionnel</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="L"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={formData.length}
                                                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                                            />
                                            <span className="text-xs text-gray-500">Longueur</span>
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="l"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={formData.width}
                                                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                                            />
                                            <span className="text-xs text-gray-500">Largeur</span>
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="H"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                value={formData.height}
                                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                            />
                                            <span className="text-xs text-gray-500">Hauteur</span>
                                        </div>
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

                                {/* Documents & Photos */}
                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Documents & Photos</h4>
                                    <div className="space-y-4">
                                        {/* Photo du véhicule */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Photo du véhicule</label>
                                            <div className="flex items-center gap-4 mt-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    onChange={(e) => handleFileUpload(e, 'vehiclePhoto')}
                                                />
                                                {formData.vehiclePhoto && (
                                                    <a href={formData.vehiclePhoto} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                        Voir
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Carte Grise Recto */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Carte Grise (Recto)</label>
                                            <div className="flex items-center gap-4 mt-1">
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    onChange={(e) => handleFileUpload(e, 'registrationFront')}
                                                />
                                                {formData.registrationFront && (
                                                    <a href={formData.registrationFront} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                        Voir
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Carte Grise Verso */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Carte Grise (Verso)</label>
                                            <div className="flex items-center gap-4 mt-1">
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    onChange={(e) => handleFileUpload(e, 'registrationBack')}
                                                />
                                                {formData.registrationBack && (
                                                    <a href={formData.registrationBack} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                        Voir
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
                )
            }
            {/* Modal Documents */}
            {
                viewDocsVehicle && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Documents du véhicule {viewDocsVehicle.plateNumber}</h3>
                                <button onClick={() => setViewDocsVehicle(null)} className="text-gray-400 hover:text-gray-500">
                                    <span className="sr-only">Fermer</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Photo du véhicule */}
                                <div className="border rounded-md p-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Photo du véhicule</h4>
                                    {viewDocsVehicle.vehiclePhoto ? (
                                        <div className="mt-2">
                                            <img src={viewDocsVehicle.vehiclePhoto} alt="Véhicule" className="max-h-48 rounded-md mx-auto" />
                                            <div className="mt-2 text-center">
                                                <a href={viewDocsVehicle.vehiclePhoto} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                    Ouvrir l'image en grand
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Aucune photo disponible</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Carte Grise Recto */}
                                    <div className="border rounded-md p-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Carte Grise (Recto)</h4>
                                        {viewDocsVehicle.registrationFront ? (
                                            <div className="mt-2 text-center">
                                                <a href={viewDocsVehicle.registrationFront} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                                                    Voir le document
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Non disponible</p>
                                        )}
                                    </div>

                                    {/* Carte Grise Verso */}
                                    <div className="border rounded-md p-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Carte Grise (Verso)</h4>
                                        {viewDocsVehicle.registrationBack ? (
                                            <div className="mt-2 text-center">
                                                <a href={viewDocsVehicle.registrationBack} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                                                    Voir le document
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Non disponible</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setViewDocsVehicle(null)}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
