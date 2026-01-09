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
    company?: {
        name: string;
        type: string;
    };
    isIndependent: boolean;
    companyId?: string;
    source?: 'INTERNAL' | 'INDEPENDENT' | 'SUBCONTRACTOR' | 'LINKED_COMPANY';
    displayCompanyName?: string;
    subcontractorId?: string;
    idCardFront?: string;
    idCardBack?: string;
    licenseFront?: string;
    licenseBack?: string;
    licenseCategory?: string;
}

export default function DriverList() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [ownerType, setOwnerType] = useState<'COMPANY' | 'SUBCONTRACTOR'>('COMPANY');
    const [viewDocsDriver, setViewDocsDriver] = useState<Driver | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        license: '',
        cin: '',
        licenseDate: '',
        subcontractorId: '',
        idCardFront: '',
        idCardBack: '',
        licenseFront: '',
        licenseBack: '',
        licenseCategory: 'B'
    });

    const [editingId, setEditingId] = useState<string | null>(null);

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
        fetchDrivers();
        fetchSubcontractors();
    }, []);

    const filteredDrivers = drivers.filter(driver => {
        const term = searchTerm.toLowerCase();
        return (
            driver.name.toLowerCase().includes(term) ||
            driver.phone.includes(term) ||
            driver.license.toLowerCase().includes(term) ||
            (driver.licenseCategory && driver.licenseCategory.toLowerCase().includes(term))
        );
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentDrivers = filteredDrivers.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
    const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

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

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            license: '',
            cin: '',
            licenseDate: '',
            subcontractorId: '',
            idCardFront: '',
            idCardBack: '',
            licenseFront: '',
            licenseBack: '',
            licenseCategory: 'B'
        });
        setEditingId(null);
        setOwnerType('COMPANY');
    };

    const handleEdit = (driver: Driver) => {
        setFormData({
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            license: driver.license,
            cin: driver.cin || '',
            licenseDate: driver.licenseDate ? new Date(driver.licenseDate).toISOString().split('T')[0] : '',
            subcontractorId: driver.source === 'SUBCONTRACTOR' ? (driver as any).subcontractorId || '' : '',
            idCardFront: driver.idCardFront || '',
            idCardBack: driver.idCardBack || '',
            licenseFront: driver.licenseFront || '',
            licenseBack: driver.licenseBack || '',
            licenseCategory: driver.licenseCategory || 'B'
        });

        if (driver.source === 'SUBCONTRACTOR') {
            setOwnerType('SUBCONTRACTOR');
        } else {
            setOwnerType('COMPANY');
        }

        setEditingId(driver.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) return;

        try {
            const response = await fetch(`/api/company/drivers/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchDrivers();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting driver:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                ...formData,
                idCardFront: formData.idCardFront,
                idCardBack: formData.idCardBack,
                licenseFront: formData.licenseFront,
                licenseBack: formData.licenseBack,
                licenseCategory: formData.licenseCategory
            };

            if (ownerType === 'COMPANY') {
                delete payload.subcontractorId;
            }

            const url = editingId
                ? `/api/company/drivers/${editingId}`
                : '/api/company/drivers';

            const method = editingId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsModalOpen(false);
                resetForm();
                fetchDrivers();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de l\'enregistrement');
            }
        } catch (error) {
            console.error('Error creating driver:', error);
        }
    };

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [sadicCode, setSadicCode] = useState('');

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/company/drivers/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sadicCode })
            });

            const data = await response.json();

            if (response.ok) {
                setIsLinkModalOpen(false);
                setSadicCode('');
                fetchDrivers();
                // Optionally show success toast/alert
            } else {
                alert(data.error || 'Une erreur est survenue');
            }
        } catch (error) {
            console.error('Error linking driver:', error);
            alert('Erreur de connexion');
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Chauffeurs ({filteredDrivers.length})
                </h3>
                <div className="flex-1 mx-4">
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">🔍</span>
                        </div>
                        <input
                            type="text"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="Rechercher par nom, téléphone, permis..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsLinkModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        🔗 Lier Chauffeur Existant
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        + Ajouter un chauffeur
                    </button>
                </div>
            </div>

            <ul className="divide-y divide-gray-200">
                {currentDrivers.map((driver) => (
                    <li key={driver.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                    {driver.name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {driver.phone}
                                        {/* Badge Type */}
                                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.source === 'INDEPENDENT' ? 'bg-yellow-100 text-yellow-800' :
                                            driver.source === 'INTERNAL' ? 'bg-green-100 text-green-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                            {driver.source === 'INTERNAL' ? 'Interne' :
                                                driver.source === 'INDEPENDENT' ? 'Indépendant' :
                                                    `ST: ${driver.displayCompanyName || '?'}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {driver.status}
                                </span>
                                <div className="text-sm text-gray-500 mt-1 flex flex-col items-end">
                                    <span>Permis: {driver.license}</span>
                                    {driver.licenseCategory && (
                                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full mt-1">
                                            Type: {driver.licenseCategory}
                                        </span>
                                    )}
                                </div>

                                {/* Documents Button */}
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setViewDocsDriver(driver)}
                                        className="text-gray-600 hover:text-gray-900 text-xs font-medium"
                                    >
                                        Documents
                                    </button>
                                    {(driver.source === 'INTERNAL' || driver.source === 'SUBCONTRACTOR') && (
                                        <button
                                            onClick={() => handleEdit(driver)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                        >
                                            Modifier
                                        </button>
                                    )}
                                    {(driver.source === 'INTERNAL' || driver.source === 'SUBCONTRACTOR' || driver.source === 'INDEPENDENT') && (
                                        <button
                                            onClick={() => handleDelete(driver.id)}
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
                {drivers.length === 0 && (
                    <li className="px-4 py-8 text-center text-gray-500">
                        Aucun chauffeur enregistré.
                    </li>
                )}
            </ul>

            {/* Pagination Controls */}
            {filteredDrivers.length > itemsPerPage && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à <span className="font-medium">{Math.min(indexOfLastItem, filteredDrivers.length)}</span> sur <span className="font-medium">{filteredDrivers.length}</span> résultats
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span className="sr-only">Précédent</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === i + 1 ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
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

            {/* Modal Link Driver */}
            {
                isLinkModalOpen && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-medium mb-4">Lier un chauffeur existant</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Entrez le <strong>Code Système (SADIC Code)</strong> du chauffeur indépendant pour l'ajouter à votre flotte.
                            </p>
                            <form onSubmit={handleLinkSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Code Système *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ex: DRV-123456"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={sadicCode}
                                        onChange={(e) => setSadicCode(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsLinkModalOpen(false)}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                    >
                                        Lier le chauffeur
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal d'ajout */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-medium mb-4">{editingId ? 'Modifier le chauffeur' : 'Ajouter un chauffeur'}</h3>
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
                                    <label className="block text-sm font-medium text-gray-700">Type de Permis</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.licenseCategory}
                                        onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                                    >
                                        {['A', 'B', 'C', 'D', 'EB', 'EC', 'ED'].map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
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

                                {/* Documents Upload Section */}
                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Documents</h4>
                                    <div className="space-y-4">
                                        {/* CIN Recto */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">CIN (Recto)</label>
                                            <div className="flex items-center gap-4 mt-1">
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    onChange={(e) => handleFileUpload(e, 'idCardFront')}
                                                />
                                                {formData.idCardFront && (
                                                    <a href={formData.idCardFront} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                        Voir
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* CIN Verso */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">CIN (Verso)</label>
                                            <div className="flex items-center gap-4 mt-1">
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    onChange={(e) => handleFileUpload(e, 'idCardBack')}
                                                />
                                                {formData.idCardBack && (
                                                    <a href={formData.idCardBack} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                        Voir
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Permis Recto */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Permis (Recto)</label>
                                            <div className="flex items-center gap-4 mt-1">
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    onChange={(e) => handleFileUpload(e, 'licenseFront')}
                                                />
                                                {formData.licenseFront && (
                                                    <a href={formData.licenseFront} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                        Voir
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Permis Verso */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Permis (Verso)</label>
                                            <div className="flex items-center gap-4 mt-1">
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    onChange={(e) => handleFileUpload(e, 'licenseBack')}
                                                />
                                                {formData.licenseBack && (
                                                    <a href={formData.licenseBack} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
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
                                        onClick={() => { setIsModalOpen(false); resetForm(); }}
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
            {/* Modal Documents View */}
            {viewDocsDriver && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Documents de {viewDocsDriver.name}</h3>
                            <button onClick={() => setViewDocsDriver(null)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Fermer</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* CIN */}
                            <div className="border rounded-md p-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Carte d'Identité Nationale</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Recto</span>
                                        {viewDocsDriver.idCardFront ? (
                                            <a href={viewDocsDriver.idCardFront} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                Voir le document
                                            </a>
                                        ) : <span className="text-sm text-gray-400 italic">Non disponible</span>}
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Verso</span>
                                        {viewDocsDriver.idCardBack ? (
                                            <a href={viewDocsDriver.idCardBack} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                Voir le document
                                            </a>
                                        ) : <span className="text-sm text-gray-400 italic">Non disponible</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Permis */}
                            <div className="border rounded-md p-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Permis de Conduire</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Recto</span>
                                        {viewDocsDriver.licenseFront ? (
                                            <a href={viewDocsDriver.licenseFront} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                Voir le document
                                            </a>
                                        ) : <span className="text-sm text-gray-400 italic">Non disponible</span>}
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Verso</span>
                                        {viewDocsDriver.licenseBack ? (
                                            <a href={viewDocsDriver.licenseBack} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                                Voir le document
                                            </a>
                                        ) : <span className="text-sm text-gray-400 italic">Non disponible</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setViewDocsDriver(null)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
