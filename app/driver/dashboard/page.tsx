'use client';

import { useState, useEffect, useMemo } from 'react';
import { Truck, Users, TrendingUp, Package, MapPin, Calendar, ArrowRight, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DriverStats {
    totalOperations: number;
    activeOperations: number;
    totalClients: number;
    topClients: { name: string; count: number }[];
    revenueTrend: { label: string; revenue: number }[];
    isInternal?: boolean;
    currentMonthBreakdown?: {
        baseSalary: number;
        commissions: number;
        bonuses: number;
        expenses: number;
        total: number;
    } | null;
}

export default function DriverDashboard() {
    const [stats, setStats] = useState<DriverStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/driver/dashboard');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const maxRevenue = useMemo(() => {
        if (!stats?.revenueTrend.length) return 100;
        return Math.max(...stats.revenueTrend.map(d => d.revenue), 100);
    }, [stats]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!stats) return <div className="p-4 text-center text-red-500">Erreur de chargement des données.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord</h2>
                    <p className="text-gray-500 text-sm">Aperçu de votre activité et performances</p>
                </div>
                <div className="text-sm text-gray-400 hidden sm:block">
                    {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Opérations</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalOperations}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Truck size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Missions en Cours</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{stats.activeOperations}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Package size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Clients</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalClients}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                            {stats.isInternal ? 'Commissions du mois' : 'Revenus du mois'}
                        </p>
                        <p className="text-3xl font-black text-gray-900 mt-1">
                            {stats.revenueTrend[stats.revenueTrend.length - 1]?.revenue.toLocaleString() || 0}
                            <span className="text-sm text-gray-500 font-normal ml-1">MAD</span>
                        </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Earnings Graph */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="text-blue-600" size={20} />
                            Évolution des Gains
                        </h3>
                    </div>

                    <div className="h-64 flex items-end justify-between px-4 pb-4 relative">
                        {/* Dashed Grid Lines using absolute positioning */}
                        <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-100"></div>
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100"></div>
                        <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-gray-100"></div>

                        {stats.revenueTrend.map((month, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 w-1/6 group relative z-10">
                                <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                    {month.revenue.toLocaleString()} MAD
                                </div>
                                <div
                                    className="w-full max-w-[40px] bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-all shadow-md shadow-blue-100"
                                    style={{ height: `${(month.revenue / maxRevenue) * 100}%` }}
                                ></div>
                                <span className="text-xs font-bold text-gray-400 uppercase">{month.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Clients List - HIDDEN FOR INTERNAL DRIVERS */}
                {!stats.isInternal && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Users className="text-purple-600" size={20} />
                            Top Clients
                        </h3>

                        {stats.topClients.length > 0 ? (
                            <div className="space-y-4">
                                {stats.topClients.map((client, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                {idx + 1}
                                            </div>
                                            <span className="font-medium text-gray-900">{client.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-500">{client.count} ops</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Aucun client pour le moment.
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <Link href="/driver/missions?status=COMPLETED" className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1 justify-center">
                                Voir l'historique complet
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Internal Drivers - Earnings Breakdown */}
                {stats.isInternal && stats.currentMonthBreakdown && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <DollarSign className="text-emerald-600" size={20} />
                            Détail des Gains (ce mois)
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Salaire de base</span>
                                <span className="font-bold text-gray-900">{stats.currentMonthBreakdown.baseSalary.toLocaleString()} MAD</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Commissions de trajet</span>
                                <span className="font-bold text-emerald-600">+{stats.currentMonthBreakdown.commissions.toLocaleString()} MAD</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Primes / Bonus</span>
                                <span className="font-bold text-blue-600">+{stats.currentMonthBreakdown.bonuses.toLocaleString()} MAD</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                                <span className="text-gray-600 text-sm font-medium">Notes de frais (validées)</span>
                                <span className="font-bold text-gray-700">+{stats.currentMonthBreakdown.expenses.toLocaleString()} MAD</span>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between px-3">
                                <span className="font-bold text-gray-900">Total à percevoir</span>
                                <span className="text-xl font-black text-gray-900">{stats.currentMonthBreakdown.total.toLocaleString()} MAD</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 mt-6 text-center italic">
                            Les montants sont mis à jour en temps réel selon vos missions terminées.
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Actions / Active Mission Teaser */}
            {stats.activeOperations > 0 && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold mb-1">Vous avez {stats.activeOperations} mission(s) en cours</h3>
                            <p className="text-blue-100">Consultez les détails et mettez à jour le statut de vos livraisons.</p>
                        </div>
                        <Link href="/driver/missions?status=CURRENT">
                            <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm">
                                Accéder aux missions
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
