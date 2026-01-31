'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Navigation, CheckCircle2, Package, MapPin, Phone, FileText, Truck, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MissionDocuments } from '@/components/driver/MissionDocuments';

interface TrackingUpdate {
    id: string;
    note: string;
    createdAt: string;
    status: string;
}

export default function MissionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [mission, setMission] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // Determines the current active step index
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Workflow Steps Definition
    const STEPS = [
        { id: 'HEADING_TO_PICKUP', label: 'Je pars vers chargement', icon: Truck, statusReq: 'CONFIRMED' },
        { id: 'ARRIVED_PICKUP', label: 'Je suis au chargement', icon: MapPin, statusReq: 'IN_PROGRESS' },
        { id: 'GOODS_LOADED', label: 'Marchandise chargée', icon: Package, statusReq: 'IN_PROGRESS' },
        { id: 'HEADING_TO_DELIVERY', label: 'Je pars vers livraison', icon: Truck, statusReq: 'IN_PROGRESS' },
        { id: 'ARRIVED_DELIVERY', label: 'Je suis à la livraison', icon: MapPin, statusReq: 'IN_PROGRESS' },
        { id: 'DELIVERED', label: 'Marchandise livrée', icon: CheckCircle2, statusReq: 'IN_PROGRESS' },
    ];

    useEffect(() => {
        if (params.id) fetchMission();
    }, [params.id]);

    // Calculate current step based on tracking history
    useEffect(() => {
        if (mission && mission.trackingUpdates) {
            const updates = mission.trackingUpdates.map((u: any) => u.note);

            // Logic to find the last completed step
            let maxIndex = -1;

            // Analyze history to find where we are
            // This is a heuristic based on the note content we set in the backend
            // In a more robust system, we might store the 'step code' directly in DB

            if (updates.some((n: string) => n.includes('En route vers le point de chargement'))) maxIndex = 0;
            if (updates.some((n: string) => n.includes('Arrivé au point de chargement'))) maxIndex = 1;
            if (updates.some((n: string) => n.includes('Marchandise chargée'))) maxIndex = 2;
            if (updates.some((n: string) => n.includes('En route vers le point de livraison'))) maxIndex = 3;
            if (updates.some((n: string) => n.includes('Arrivé au point de livraison'))) maxIndex = 4;
            if (mission.status === 'DELIVERED') maxIndex = 5;

            // The NEXT step is maxIndex + 1
            // If mission is confirmed but no tracking yet, we start at 0
            if (mission.status === 'CONFIRMED' && maxIndex === -1) {
                setCurrentStepIndex(0);
            } else {
                setCurrentStepIndex(maxIndex + 1);
            }
        }
    }, [mission]);

    async function fetchMission() {
        try {
            const res = await fetch(`/api/driver/missions/${params.id}`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setMission(data);
        } catch (error) {
            console.error(error);
            toast({ title: 'Erreur', description: 'Impossible de charger la mission', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    const getGPSLocation = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Géolocalisation non supportée'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    };

    const handleStepAction = async (stepId: string) => {
        setActionLoading(true);
        setGpsError(null);

        try {
            // 1. Get GPS
            let location = { lat: 0, lng: 0 };
            try {
                location = await getGPSLocation();
            } catch (gpsErr) {
                console.warn('GPS failed', gpsErr);
                setGpsError('Impossible de récupérer votre position. Veuillez activer le GPS.');
                // We might allow proceeding without GPS if critical, but for now let's warn
                // Uncomment to block: 
                // setActionLoading(false); return; 
            }

            // 2. Send Update
            const res = await fetch(`/api/driver/missions/${mission.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: stepId,
                    lat: location.lat,
                    lng: location.lng
                })
            });

            if (!res.ok) throw new Error('Update failed');

            toast({ title: 'Statut mis à jour !' });
            fetchMission(); // Refresh data

        } catch (error) {
            console.error(error);
            toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    if (!mission) return <div className="p-8 text-center">Mission introuvable</div>;

    const isMissionActive = ['CONFIRMED', 'IN_PROGRESS'].includes(mission.status);
    const isMissionCompleted = ['DELIVERED', 'COMPLETED'].includes(mission.status);

    return (
        <div className="p-4 pb-24 space-y-6 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    &larr; Retour
                </Button>
                <div className="text-right">
                    <div className="font-bold text-gray-900">Mission #{mission.reference}</div>
                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${mission.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {mission.status}
                    </div>
                </div>
            </div>

            {/* ERROR GPS ALERT */}
            {gpsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Attention!</strong>
                    <span className="block sm:inline"> {gpsError}</span>
                </div>
            )}

            {/* CURRENT ACTION CARD */}
            {isMissionActive && currentStepIndex < STEPS.length && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-blue-100 overflow-hidden">
                    <div className="bg-blue-50 p-4 border-b border-blue-100">
                        <h2 className="text-lg font-bold text-blue-900 flex items-center">
                            <Navigation className="mr-2 h-5 w-5" /> Action Requise
                        </h2>
                        <p className="text-sm text-blue-700">Étape {currentStepIndex + 1} sur {STEPS.length}</p>
                    </div>
                    <div className="p-6">
                        <div className="mb-6 text-center">
                            <p className="text-gray-500 mb-2">Prochaine étape :</p>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                {STEPS[currentStepIndex].label}
                            </h3>
                        </div>

                        <Button
                            className="w-full h-16 text-lg font-bold shadow-md bg-blue-600 hover:bg-blue-700 transition-all transform hover:scale-[1.02]"
                            onClick={() => handleStepAction(STEPS[currentStepIndex].id)}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <Loader2 className="animate-spin mr-2 h-6 w-6" />
                            ) : (
                                <div className="flex items-center justify-center">
                                    <span className="mr-2">Confirmer</span>
                                    <ArrowRight className="h-6 w-6" />
                                </div>
                            )}
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-3">
                            📍 Votre position GPS sera enregistrée
                        </p>
                    </div>
                </div>
            )}

            {isMissionCompleted && (
                <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-green-900">Mission Terminée !</h2>
                    <p className="text-green-700">Merci pour votre bon travail.</p>
                </div>
            )}

            {/* TIMELINE PREVIEW */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Progression</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {STEPS.map((step, index) => {
                            const isCompleted = index < currentStepIndex || isMissionCompleted;
                            const isCurrent = index === currentStepIndex && !isMissionCompleted;
                            const Icon = step.icon;

                            return (
                                <div key={step.id} className={`flex items-center ${isCompleted ? 'text-blue-600' : isCurrent ? 'text-gray-900' : 'text-gray-300'}`}>
                                    <div className={`
                                        flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border-2 mr-3
                                        ${isCompleted ? 'bg-blue-50 border-blue-600' : isCurrent ? 'bg-white border-blue-600 ring-2 ring-blue-100' : 'bg-gray-50 border-gray-200'}
                                    `}>
                                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                                    </div>
                                    <span className={`font-medium ${isCurrent ? 'font-bold' : ''}`}>{step.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* MISSION INFO */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <MapPin className="mr-2 h-5 w-5 text-gray-500" /> Détails Mission
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border-l-2 border-blue-500 pl-4 py-1">
                        <label className="text-xs text-gray-500 uppercase font-bold">Chargement</label>
                        <p className="font-medium">{mission.loadingPoints[0]?.address}</p>
                        <p className="text-sm text-gray-500">
                            {mission.operationDate && format(new Date(mission.operationDate), 'dd MMM, HH:mm', { locale: fr })}
                        </p>
                    </div>
                    <div className="border-l-2 border-green-500 pl-4 py-1">
                        <label className="text-xs text-gray-500 uppercase font-bold">Livraison</label>
                        <p className="font-medium">{mission.unloadingPoints[0]?.address}</p>
                    </div>
                    {mission.client && (
                        <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-medium text-sm">{mission.client.name}</p>
                                <p className="text-xs text-gray-500">Client</p>
                            </div>
                            {mission.client.phone && (
                                <a href={`tel:${mission.client.phone}`}>
                                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full">
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                </a>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* DOCUMENTS */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <FileText className="mr-2 h-5 w-5 text-gray-500" /> Documents & Preuves
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <MissionDocuments missionId={mission.id} />
                </CardContent>
            </Card>
        </div>
    );
}
