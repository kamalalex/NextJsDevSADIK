'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Mission {
    id: string;
    reference: string;
    operationDate: string;
    status: string;
    loadingPoints: any[];
    unloadingPoints: any[];
    assignedVehicle?: { plateNumber: string };
}

export default function MissionsPage() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMissions() {
            try {
                const res = await fetch('/api/driver/missions');
                if (!res.ok) throw new Error('Failed to load missions');
                const data = await res.json();
                // Filter out completed missions
                const activeMissions = data.filter((m: Mission) =>
                    m.status !== 'DELIVERED' && m.status !== 'CANCELLED'
                );
                setMissions(activeMissions);
            } catch (err) {
                setError('Impossible de charger les missions');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchMissions();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-blue-100 text-blue-700';
            case 'CONFIRMED': return 'bg-indigo-100 text-indigo-700';
            case 'IN_PROGRESS': return 'bg-green-100 text-green-700'; // Pulsing in CSS usually
            case 'DELIVERED': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'En Attente';
            case 'CONFIRMED': return 'Confirmé';
            case 'IN_PROGRESS': return 'En Cours';
            case 'DELIVERED': return 'Livré';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold mb-4">Mes Missions</h1>

            {missions.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">Aucune mission assignée.</p>
            ) : (
                missions.map((mission) => (
                    <Link href={`/driver/missions/${mission.id}`} key={mission.id}>
                        <Card className="mb-3 hover:bg-gray-50 active:scale-[99%] transition-all">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-gray-500">#{mission.reference}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(mission.status)}`}>
                                        {getStatusLabel(mission.status)}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start space-x-2">
                                        <MapPin className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {mission.loadingPoints[0]?.address || 'Départ non défini'}
                                            </p>
                                            <p className="text-xs text-gray-400">Départ</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-2">
                                        <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {mission.unloadingPoints[0]?.address || 'Arrivée non définie'}
                                            </p>
                                            <p className="text-xs text-gray-400">Arrivée</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {mission.operationDate ? format(new Date(mission.operationDate), 'dd MMM yyyy, HH:mm', { locale: fr }) : '-'}
                                        <div className="flex-1"></div>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))
            )}
        </div>
    );
}
