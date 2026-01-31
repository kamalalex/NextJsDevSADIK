'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, DollarSign, Star, FileText, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import DriverHRModal from './DriverHRModal';

interface DriverHR {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    baseSalary: number;
    commissions: number;
    bonuses: number;
    approvedExpenses: number;
    pendingExpensesCount: number;
    totalSalary: number;
}

interface HRStats {
    totalDrivers: number;
    totalPayroll: number;
    totalPendingExpenses: number;
}

export default function HumanResources() {
    const [drivers, setDrivers] = useState<DriverHR[]>([]);
    const [stats, setStats] = useState<HRStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/company/hr/drivers');
            if (res.ok) {
                const data = await res.json();
                setDrivers(data.drivers);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching HR data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Chargement des données RH...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Ressources Humaines</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    + Configurer Salaire
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase">Employés</p>
                                <h3 className="text-2xl font-bold">{stats?.totalDrivers || 0}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase">Masse Salariale (Est.)</p>
                                <h3 className="text-2xl font-bold">{(stats?.totalPayroll || 0).toLocaleString()} MAD</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase">Notes de frais à valider</p>
                                <h3 className="text-2xl font-bold">{stats?.totalPendingExpenses || 0}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">État des Salaires & Commissions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Chauffeur</th>
                                <th className="px-6 py-4">Salaire Base</th>
                                <th className="px-6 py-4">Commissions</th>
                                <th className="px-6 py-4">Primes</th>
                                <th className="px-6 py-4">Total à Payer</th>
                                <th className="px-6 py-4">Frais (Validés)</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {drivers.map((driver) => (
                                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                                {driver.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{driver.name}</p>
                                                <p className="text-xs text-gray-500">{driver.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-600">
                                        {driver.baseSalary.toLocaleString()} MAD
                                    </td>
                                    <td className="px-6 py-4 text-emerald-600 font-medium">
                                        +{driver.commissions.toLocaleString()} MAD
                                    </td>
                                    <td className="px-6 py-4 text-blue-600 font-medium">
                                        +{driver.bonuses.toLocaleString()} MAD
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-gray-900">{driver.totalSalary.toLocaleString()} MAD</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span>{driver.approvedExpenses.toLocaleString()} MAD</span>
                                            {driver.pendingExpensesCount > 0 && (
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                    {driver.pendingExpensesCount} en attente
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Actif
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => setSelectedDriverId(driver.id)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                                        >
                                            Gérer <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {drivers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        Aucun chauffeur employé trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedDriverId && (
                <DriverHRModal
                    driverId={selectedDriverId}
                    onClose={() => setSelectedDriverId(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
}
