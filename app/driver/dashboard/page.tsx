import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, ArrowRight, Package } from 'lucide-react';

export default function DriverDashboard() {
    // TODO: Fetch real data via SWR or Server Actions for today's summary
    // Mock data for initial UI build
    const currentMission = {
        id: 'op_12345',
        from: 'Casablanca (Port)',
        to: 'Tanger (Zone Franche)',
        customer: 'Renault',
        status: 'IN_PROGRESS',
        timeLeft: '2h 15m'
    };

    const hasActiveMission = true;

    return (
        <div className="p-4 space-y-6">
            {/* Welcome Section */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Bonjour, Ahmed</h2>
                <p className="text-gray-500 text-sm">Prêt pour la route ?</p>
            </div>

            {/* Active Mission Card - Prominent */}
            {hasActiveMission ? (
                <Card className="border-l-4 border-l-green-500 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2">
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                            En Cours
                        </span>
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Mission Actuelle
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex flex-col items-center mt-1">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <div className="w-0.5 h-10 bg-gray-200 my-1"></div>
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-400">Chargement</p>
                                        <p className="font-semibold text-gray-800">{currentMission.from}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Livraison</p>
                                        <p className="font-semibold text-gray-800">{currentMission.to}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Link href={`/driver/missions/${currentMission.id}`}>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        Ouvrir la Mission <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-gray-50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                        <Package className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500">Aucune mission en cours</p>
                        <Button variant="outline" className="mt-4">Voir les missions disponibles</Button>
                    </CardContent>
                </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-800">1,250</span>
                        <span className="text-xs text-gray-500">Km ce mois</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-800">12</span>
                        <span className="text-xs text-gray-500">Missions</span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
