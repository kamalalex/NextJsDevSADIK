'use client';

import { useState, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

interface PendingUser {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    company?: {
        name: string;
        ice: string;
        type: string;
    };
    driver?: {
        license: string;
        professionalCard: string;
        cin: string;
    };
}

export default function ValidationsPage() {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const res = await fetch('/api/admin/users/validate');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        setProcessing(userId);
        try {
            const res = await fetch('/api/admin/users/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action }),
            });

            if (res.ok) {
                setUsers(users.filter((u) => u.id !== userId));
            } else {
                alert('Erreur lors du traitement');
            }
        } catch (error) {
            console.error('Error processing user:', error);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Validations de Compte</h1>

            {users.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    Aucune demande en attente.
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <li key={user.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-blue-600">
                                                {user.company ? user.company.name : user.name}
                                            </h3>
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {user.role}
                                            </span>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500 mr-6">
                                                    📧 {user.email}
                                                </p>
                                                {user.company && (
                                                    <p className="flex items-center text-sm text-gray-500 mr-6">
                                                        🏢 ICE: {user.company.ice}
                                                    </p>
                                                )}
                                                {user.driver && (
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        🆔 CIN: {user.driver.cin} | Permis: {user.driver.license}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                    Inscrit le {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-6 flex items-center space-x-4">
                                        <button
                                            onClick={() => handleAction(user.id, 'approve')}
                                            disabled={!!processing}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                        >
                                            {processing === user.id ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4 mr-1" />}
                                            Valider
                                        </button>
                                        <button
                                            onClick={() => handleAction(user.id, 'reject')}
                                            disabled={!!processing}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Rejeter
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
