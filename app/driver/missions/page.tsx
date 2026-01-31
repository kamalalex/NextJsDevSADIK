'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, ChevronRight, Loader2, Package, Truck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Mission {
    id: string;
    reference: string;
    operationDate: string;
    status: string;
    loadingPoints: any[];
    unloadingPoints: any[];
    client: { name: string; address: string };
    assignedVehicle?: { plateNumber: string; model: string };
}

export default function MissionsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <MissionsContent />
        </Suspense>
    );
}

function MissionsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const statusParam = searchParams.get('status') || 'CURRENT'; // Default to CURRENT

    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMissions();
    }, [statusParam]);

    const fetchMissions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/driver/missions?status=${statusParam}`);
            if (!res.ok) throw new Error('Impossible de charger les missions');
            const data = await res.json();
            setMissions(data);
        } catch (err) {
            setError('Erreur lors du chargement des missions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PENDING': return { color: 'bg-yellow-100 text-yellow-800', label: 'En Attente' };
            case 'CONFIRMED': return { color: 'bg-blue-100 text-blue-800', label: 'Confirmé' };
            case 'IN_PROGRESS': return { color: 'bg-green-100 text-green-800', label: 'En Cours' };
            case 'DELIVERED': return { color: 'bg-gray-100 text-gray-800', label: 'Livré' };
            case 'CANCELLED': return { color: 'bg-red-100 text-red-800', label: 'Annulé' };
            default: return { color: 'bg-gray-100 text-gray-800', label: status };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {statusParam === 'CURRENT' ? 'Missions en Cours' : 'Historique des Missions'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {statusParam === 'CURRENT'
                            ? 'Gérez vos livraisons actives et à venir'
                            : 'Consultez l\'historique de vos courses terminées'}
                    </p>
                </div>

                {/* Mobile/Desktop Tabs Switcher */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => router.push('/driver/missions?status=CURRENT')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusParam === 'CURRENT'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        En Cours
                    </button>
                    <button
                        onClick={() => router.push('/driver/missions?status=COMPLETED')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusParam === 'COMPLETED'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Terminées
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : error ? (
                <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg">
                    {error}
                </div>
            ) : missions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Aucune mission trouvée</h3>
                    <p className="text-gray-500 mt-1">
                        {statusParam === 'CURRENT'
                            ? 'Vous n\'avez aucune mission active pour le moment.'
                            : 'Votre historique de missions est vide.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {missions.map((mission) => {
                        const statusConfig = getStatusConfig(mission.status);
                        return (
                            <Link href={`/driver/missions/${mission.id}`} key={mission.id}>
                                <div className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">#{mission.reference}</span>
                                                    {mission.client && (
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                            {mission.client.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {format(new Date(mission.operationDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                                            {statusConfig.label}
                                        </span>
                                    </div>

                                    <div className="space-y-4 relative">
                                        {/* Timeline Line */}
                                        <div className="absolute left-[7px] top-2 bottom-6 w-0.5 bg-gray-100"></div>

                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Chargement</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {mission.loadingPoints[0]?.address || 'Non défini'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-sm mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Livraison</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {mission.unloadingPoints[0]?.address || 'Non défini'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                                        <div className="text-gray-500 flex items-center gap-2">
                                            {mission.assignedVehicle && (
                                                <span className="bg-gray-50 px-2 py-1 rounded text-xs font-mono text-gray-600">
                                                    {mission.assignedVehicle.plateNumber}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-blue-600 font-medium flex items-center group-hover:gap-2 transition-all">
                                            Voir détails <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
