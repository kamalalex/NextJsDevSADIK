'use client';

import { useState, useEffect } from 'react';

interface Client {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    ice?: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    sadicCode?: string;
}

export default function ClientList() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        ice: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: ''
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/company/clients');
            if (response.ok) {
                const data = await response.json();
                setClients(data);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client => {
        const term = searchTerm.toLowerCase();
        return (
            client.name.toLowerCase().includes(term) ||
            client.phone.includes(term) ||
            client.email.toLowerCase().includes(term) ||
            (client.ice && client.ice.toLowerCase().includes(term))
        );
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

    const handleEdit = (client: Client) => {
        setFormData({
            name: client.name,
            address: client.address || '',
            phone: client.phone || '',
            email: client.email || '',
            ice: client.ice || '',
            contactPerson: client.contactPerson || '',
            contactPhone: client.contactPhone || '',
            contactEmail: client.contactEmail || ''
        });
        setEditingId(client.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

        try {
            const response = await fetch(`/api/company/clients/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchClients();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Erreur réseau');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `/api/company/clients/${editingId}`
                : '/api/company/clients';

            const method = editingId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setFormData({
                    name: '',
                    address: '',
                    phone: '',
                    email: '',
                    ice: '',
                    contactPerson: '',
                    contactPhone: '',
                    contactEmail: ''
                });
                setEditingId(null);
                fetchClients();
            }
        } catch (error) {
            console.error('Error saving client:', error);
        }
    };

    const openNewModal = () => {
        setFormData({ name: '', address: '', phone: '', email: '', ice: '', contactPerson: '', contactPhone: '', contactEmail: '' });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkCode, setLinkCode] = useState('');

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/company/clients/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sadicCode: linkCode })
            });

            if (response.ok) {
                setIsLinkModalOpen(false);
                setLinkCode('');
                fetchClients();
                alert('Client lié avec succès !');
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la liaison');
            }
        } catch (error) {
            console.error('Error linking client:', error);
            alert('Erreur réseau');
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Clients ({filteredClients.length})
                </h3>
                <div className="flex-1 mx-4">
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">🔍</span>
                        </div>
                        <input
                            type="text"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="Rechercher par nom, email, téléphone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsLinkModalOpen(true)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300"
                    >
                        🔗 Lier existant
                    </button>
                    <button
                        onClick={openNewModal}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        + Ajouter un client
                    </button>
                </div>
            </div>

            <ul className="divide-y divide-gray-200">
                {currentClients.map((client) => (
                    <li key={client.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                    {client.name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                        {client.sadicCode && (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                                {client.sadicCode}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">{client.email}</div>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        {client.ice && (
                                            <div className="text-xs text-gray-400">ICE: {client.ice}</div>
                                        )}
                                        {client.contactPerson && (
                                            <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                                👤 {client.contactPerson}
                                                {client.contactPhone && <span className="text-gray-400 ml-1">({client.contactPhone})</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right text-sm text-gray-500">
                                    <div>{client.phone}</div>
                                    <div className="text-xs mt-1 max-w-xs truncate">{client.address}</div>
                                </div>
                                <div className="flex gap-2"> {/* Removed opacity-0 group-hover:opacity-100 */}
                                    <button
                                        onClick={() => handleEdit(client)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
                {clients.length === 0 && (
                    <li className="px-4 py-8 text-center text-gray-500">
                        Aucun client enregistré.
                    </li>
                )}
            </ul>

            {/* Pagination Controls */}
            {filteredClients.length > itemsPerPage && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à <span className="font-medium">{Math.min(indexOfLastItem, filteredClients.length)}</span> sur <span className="font-medium">{filteredClients.length}</span> résultats
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

            {/* Modal de liaison */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Lier un client existant</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Entrez le code système du client (ex: CLI-123456) pour l'ajouter à votre liste.
                        </p>
                        <form onSubmit={handleLinkSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Code Système</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="CLI-XXXXXX"
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
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md"
                                >
                                    Rechercher et Lier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal d'ajout */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">{editingId ? 'Modifier le client' : 'Ajouter un client'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                <label className="block text-sm font-medium text-gray-700">ICE</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.ice}
                                    onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 p-3 bg-gray-50 rounded-md">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Personne de contact</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tél Contact</label>
                                        <input
                                            type="tel"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email Contact</label>
                                        <input
                                            type="email"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                                <input
                                    type="tel"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Adresse</label>
                                <textarea
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    rows={3}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                                    className="bg-purple-600 text-white px-4 py-2 rounded-md"
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
