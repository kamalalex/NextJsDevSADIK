'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Navigation, CheckCircle2, Package, MapPin, Phone, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MissionDocuments } from '@/components/driver/MissionDocuments';

interface MissionDetail {
    id: string;
    status: string;
    reference: string;
    operationDate: string;
    loadingPoints: any[];
    unloadingPoints: any[];
    client: { name: string; phone: string };
    assignedVehicle: { plateNumber: string; brand: string };
}

export default function MissionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [mission, setMission] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Tracking State
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingNote, setTrackingNote] = useState('');

    // Fetch mission details
    useEffect(() => {
        async function fetchMission() {
            try {
                // Use the new specific endpoint
                const res = await fetch(`/api/driver/missions/${params.id}`);

                if (res.status === 404) {
                    setError('Mission introuvable.');
                    setLoading(false);
                    return;
                }

                if (res.status === 403) {
                    setError('Accès refusé.');
                    setLoading(false);
                    return;
                }

                if (!res.ok) {
                    throw new Error(`Erreur API: ${res.status}`);
                }
                const data = await res.json();
                setMission(data);

            } catch (error) {
                console.error(error);
                setError('Erreur de chargement');
            } finally {
                setLoading(false);
            }
        }
        if (params.id) fetchMission();
    }, [params.id, router, toast]);

    const handleAction = async (action: string, note?: string) => {
        if (!mission) return;
        setActionLoading(true);
        try {
            const body: any = { action };
            if (note) body.note = note;

            const res = await fetch(`/api/driver/missions/${mission.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Action failed');

            // Refetch to see update
            const updatedRes = await fetch(`/api/driver/missions/${mission.id}`);
            const updatedData = await updatedRes.json();
            setMission(updatedData);

            toast({ title: 'Mise à jour effectuée !' });
            setIsTrackingModalOpen(false);
            setTrackingNote('');

        } catch (error) {
            toast({ title: 'Erreur', description: 'Impossible de mettre à jour le statut', variant: 'destructive' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!mission) return <div className="p-8 text-center">Mission introuvable</div>;

    // Determine Main Action Button based on status
    let mainAction = null;
    switch (mission.status) {
        case 'PENDING':
            mainAction = (
                <div className="flex gap-2">
                    <Button className="flex-1 bg-red-100 text-red-700 hover:bg-red-200" onClick={() => handleAction('REJECT')} disabled={actionLoading}>
                        Refuser
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleAction('ACCEPT')} disabled={actionLoading}>
                        Accepter
                    </Button>
                </div>
            );
            break;
        case 'CONFIRMED':
            mainAction = (
                <Button className="w-full bg-blue-600 h-12 text-lg" onClick={() => handleAction('START')} disabled={actionLoading}>
                    <Navigation className="mr-2" /> Démarrer la mission
                </Button>
            );
            break;
        case 'IN_PROGRESS':
            mainAction = (
                <div className="space-y-2">
                    <Button variant="secondary" className="w-full border" onClick={() => setIsTrackingModalOpen(true)}>
                        💬 Ajouter une note
                    </Button>
                    <Button className="w-full bg-green-600 h-12 text-lg" onClick={() => handleAction('DELIVERED')} disabled={actionLoading}>
                        <CheckCircle2 className="mr-2" /> Confirmer Livraison
                    </Button>
                </div>
            );
            break;
        case 'DELIVERED':
            mainAction = <div className="text-center text-green-600 font-bold p-4 border border-green-200 rounded-lg bg-green-50">Mission Terminée</div>;
            break;
    }

    return (
        <div className="p-4 pb-24 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => router.back()}>&larr; Retour</Button>
                <div className="text-right">
                    <span className="font-mono text-sm block text-gray-500">#{mission.reference}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100">{mission.status}</span>
                </div>
            </div>

            {/* Status & Action */}
            <div className="sticky top-16 z-10 bg-white/95 backdrop-blur shadow-sm p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-2 text-center uppercase tracking-wider">actions</p>
                {mainAction}
            </div>

            {/* Modal Add Note */}
            {isTrackingModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-medium mb-4">Ajouter une note</h3>
                        <textarea
                            className="w-full border rounded-md p-2 mb-4"
                            rows={3}
                            placeholder="Ex: Pause déjeuner, Trafic dense..."
                            value={trackingNote}
                            onChange={(e) => setTrackingNote(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsTrackingModalOpen(false)}>Annuler</Button>
                            <Button onClick={() => handleAction('UPDATE', trackingNote)}>Envoyer</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Route Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <MapPin className="mr-2 h-5 w-5 text-blue-600" /> Itinéraire
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="relative pl-6 border-l-2 border-dashed border-gray-200">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-blue-500 ring-4 ring-white" />
                        <div>
                            <h3 className="font-semibold text-gray-900">Chargement</h3>
                            <p className="text-gray-600">{mission.loadingPoints[0]?.address}</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {mission.operationDate && format(new Date(mission.operationDate), 'dd MMM, HH:mm', { locale: fr })}
                            </p>
                        </div>
                    </div>

                    <div className="relative pl-6 border-l-2 border-transparent">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-red-500 ring-4 ring-white" />
                        <div>
                            <h3 className="font-semibold text-gray-900">Livraison</h3>
                            <p className="text-gray-600">{mission.unloadingPoints[0]?.address}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tracking History */}
            {mission.trackingUpdates && mission.trackingUpdates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Navigation className="mr-2 h-5 w-5 text-purple-600" /> Suivi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {mission.trackingUpdates.map((update: any) => (
                                <li key={update.id} className="relative pl-4 border-l-2 border-gray-200 py-1">
                                    <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-gray-400 ring-2 ring-white" />
                                    <div className="text-sm font-medium">{update.note}</div>
                                    <div className="text-xs text-gray-500">
                                        {format(new Date(update.createdAt), 'HH:mm - dd/MM', { locale: fr })}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Client Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <Package className="mr-2 h-5 w-5 text-orange-500" /> Détails Client
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">{mission.client?.name || 'Client Inconnu'}</p>
                        </div>
                        {mission.client?.phone && (
                            <a href={`tel:${mission.client.phone}`}>
                                <Button size="sm" variant="outline"><Phone className="h-4 w-4" /></Button>
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Documents */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-gray-500" /> Documents
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <MissionDocuments missionId={mission.id} />
                </CardContent>
            </Card>
        </div>
    );
}
