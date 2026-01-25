
'use client';

import { useState, useEffect } from 'react';

interface Partner {
    id: string;
    name: string;
    companyName: string;
    phone: string;
    email?: string;
    address?: string;
    status: 'PENDING' | 'ACTIVE' | 'REJECTED';
    linkedCompany?: {
        id: string;
        name: string;
        sadicCode: string;
        type: string;
    };
    transportCompany?: {
        name: string;
        sadicCode: string;
        type: string;
    };
}

export default function PartnerList() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [requests, setRequests] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkCode, setLinkCode] = useState('');
    const [linkLoading, setLinkLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchPartners();
        fetchRequests();
    }, []);

    const fetchPartners = async () => {
        try {
            const response = await fetch('/api/company/partners');
            if (response.ok) {
                setPartners(await response.json());
            }
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            const response = await fetch('/api/company/partners/requests');
            if (response.ok) {
                setRequests(await response.json());
            }
        } catch (error) {
            console.error('Error fetching partner requests:', error);
        }
    };

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLinkLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await fetch('/api/company/partners/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sadicCode: linkCode })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ text: 'Demande de partenariat envoyée avec succès !', type: 'success' });
                setLinkCode('');
                setTimeout(() => setIsLinkModalOpen(false), 2000);
                fetchPartners();
            } else {
                setMessage({ text: data.error || 'Une erreur est survenue', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Erreur de connexion au serveur', type: 'error' });
        } finally {
            setLinkLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'CONFIRM' | 'REJECT') => {
        try {
            const response = await fetch('/api/company/partners/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            });

            if (response.ok) {
                fetchRequests();
                fetchPartners();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de l\'action');
            }
        } catch (error) {
            console.error('Error handling partner action:', error);
        }
    };

    const handleDeletePartner = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer ce partenaire ?')) return;

        try {
            const response = await fetch(`/api/company/subcontractors/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchPartners();
            }
        } catch (error) {
            console.error('Error deleting partner:', error);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Mes Partenaires</h2>
                <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                    <span>+</span> Ajouter un Transporteur (SADIC)
                </button>
            </div>

            {/* Partnership Requests */}
            {requests.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-medium text-amber-900 flex items-center gap-2">
                        <span>🔔</span> Demandes de partenariat en attente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {requests.map((request) => (
                            <div key={request.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900">{request.transportCompany?.name}</p>
                                    <p className="text-sm text-gray-500">ID: {request.transportCompany?.sadicCode}</p>
                                    <p className="text-xs text-blue-600 uppercase mt-1">{request.transportCompany?.type === 'TRANSPORT_COMPANY' ? 'Transporteur' : 'Client'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAction(request.id, 'CONFIRM')}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                                    >
                                        Accepter
                                    </button>
                                    <button
                                        onClick={() => handleAction(request.id, 'REJECT')}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded text-xs font-medium"
                                    >
                                        Refuser
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Partners List */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code SADIC</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {partners.map((partner) => (
                            <tr key={partner.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{partner.companyName}</div>
                                    <div className="text-sm text-gray-500">{partner.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold">
                                        {partner.linkedCompany?.sadicCode || '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {partner.name}
                                    <br />
                                    {partner.phone}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleDeletePartner(partner.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {partners.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                    Aucun partenaire actif. Utilisez le code SADIC pour lier une entreprise.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Link Partner */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Ajouter un Partenaire</h3>
                            <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>
                        <form onSubmit={handleLinkSubmit} className="p-6 space-y-4">
                            {message.text && (
                                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code Système (SADIC)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: TRP-123456789"
                                    value={linkCode}
                                    onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                                <p className="mt-2 text-xs text-gray-500 italic">
                                    Demandez le code SADIC à l'entreprise que vous souhaitez ajouter.
                                    Elle devra confirmer votre demande.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsLinkModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={linkLoading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {linkLoading ? 'Envoi...' : 'Envoyer la demande'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
