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
    sadicCode?: string;
}

export default function SubcontractorList() {
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [linkCode, setLinkCode] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        phone: '',
        email: '',
        address: '',
        companyId: '',
        paymentWithInvoice: true,
        isIndependent: false
    });

    const [editingId, setEditingId] = useState<string | null>(null);

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

    useEffect(() => {
        fetchSubcontractors();
    }, []);

    const filteredSubcontractors = subcontractors.filter(sub => {
        const term = searchTerm.toLowerCase();
        return (
            sub.companyName.toLowerCase().includes(term) ||
            sub.name.toLowerCase().includes(term) ||
            sub.phone.includes(term)
        );
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSubcontractors = filteredSubcontractors.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
    const totalPages = Math.ceil(filteredSubcontractors.length / itemsPerPage);

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/company/subcontractors/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sadicCode: linkCode })
            });

            if (response.ok) {
                setIsLinkModalOpen(false);
                setLinkCode('');
                fetchSubcontractors();
                const data = await response.json();
                alert(`Sous-traitant lié avec succès: ${data.companyName}`);
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors du lien');
            }
        } catch (error) {
            console.error('Error linking subcontractor:', error);
            alert('Erreur lors de la communication avec le serveur');
        }
    };

    const handleEdit = (sub: Subcontractor) => {
        setFormData({
            name: sub.name,
            companyName: sub.companyName,
            phone: sub.phone,
            email: sub.email,
            address: sub.address,
            companyId: sub.companyId,
            paymentWithInvoice: sub.paymentWithInvoice
        });
        setEditingId(sub.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce sous-traitant ?')) return;

        try {
            const response = await fetch(`/api/company/subcontractors/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchSubcontractors();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting subcontractor:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            companyName: '',
            phone: '',
            email: '',
            address: '',
            companyId: '',
            paymentWithInvoice: true,
            isIndependent: false
        });
        setEditingId(null);
    };

    const openNewModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `/api/company/subcontractors/${editingId}`
                : '/api/company/subcontractors';

            const method = editingId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                resetForm(); // Reset form without reopening
                fetchSubcontractors();
            }
        } catch (error) {
            console.error('Error saving subcontractor:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Sous-traitants ({filteredSubcontractors.length})
                </h3>
                <div className="flex-1 mx-4">
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">🔍</span>
                        </div>
                        <input
                            type="text"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="Rechercher par société, nom, téléphone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsLinkModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                    >
                        <span className="mr-2">🔗</span> Lier existant
                    </button>
                    <button
                        onClick={openNewModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        + Ajouter un sous-traitant
                    </button>
                </div>
            </div>


            <ul className="divide-y divide-gray-200">
                {currentSubcontractors.map((sub) => (
                    <li key={sub.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                    {sub.companyName.charAt(0)}
                                </div>
                                <div className="ml-4">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-gray-900">{sub.companyName}</div>
                                        {sub.sadicCode && (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                                {sub.sadicCode}
                                            </span>
                                        )}
                                        {sub.drivers && sub.drivers.some((d: any) => d.isIndependent) && (
                                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider border border-purple-200">
                                                Indépendant
                                            </span>
                                        )}
                                        {sub.paymentWithInvoice ? (
                                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium uppercase tracking-wider">Facture</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium uppercase tracking-wider">Sans Facture</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">{sub.name} - {sub.phone}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end mr-4">
                                    <span className="text-sm text-gray-500">
                                        {sub.vehicles?.length || 0} véhicules
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {sub.drivers?.length || 0} chauffeurs
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(sub)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sub.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Supprimer
                                    </button>
                                </div>
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

            {/* Pagination Controls */}
            {filteredSubcontractors.length > itemsPerPage && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à <span className="font-medium">{Math.min(indexOfLastItem, filteredSubcontractors.length)}</span> sur <span className="font-medium">{filteredSubcontractors.length}</span> résultats
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

            {/* Modal d'ajout */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-medium mb-4">{editingId ? 'Modifier le sous-traitant' : 'Ajouter un sous-traitant'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de partenaire</label>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isIndependent: false })}
                                            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${!formData.isIndependent ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Entreprise de Transport
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isIndependent: true })}
                                            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${formData.isIndependent ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Chauffeur Indépendant
                                        </button>
                                    </div>
                                </div>
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
                )
            }
            {/* Modal de liaison */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Lier un sous-traitant existant</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Entrez le <strong>Code Système (ID)</strong> de l'entreprise de transport à lier.
                        </p>
                        <form onSubmit={handleLinkSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Code Système (ex: TRP-123456)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="TRP-XXXXXX"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={linkCode}
                                    onChange={(e) => setLinkCode(e.target.value)}
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
                                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                                >
                                    Lier l'entreprise
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}
