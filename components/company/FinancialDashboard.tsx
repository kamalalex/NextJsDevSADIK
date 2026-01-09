'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    AlertTriangle,
    Calendar,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FinancialStats {
    totalRevenue: number;
    totalInvoiced: number;
    totalUninvoiced: number;
    totalPaidInvoices: number;
    totalUnpaidInvoices: number;
    totalInvoicesCount: number;
    averageMargin: number;
    totalMargin: number;
    marginPercentage: number;
    totalOwedToSubcontractors: number;
    realTimeProfit: number;
    totalSubcontractorPayments: number;
    cashFlowForecast: {
        thirtyDays: number;
        sixtyDays: number;
        ninetyDays: number;
    };
    revenueTrend: {
        label: string;
        revenue: number;
    }[];
    topClients: {
        id: string;
        name: string;
        revenue: number;
    }[];
    overdueClients: {
        id: string;
        name: string;
        overdueAmount: number;
    }[];
    criticalOverdueAlerts: {
        id: string;
        number: string;
        clientName: string;
        totalAmount: number;
        daysOverdue: number;
    }[];
    paymentDistribution: {
        full: number;
        partial: number;
    };
}

export default function FinancialDashboard() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/company/financial-stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const maxTrendRevenue = useMemo(() => {
        if (!stats?.revenueTrend.length) return 0;
        return Math.max(...stats.revenueTrend.map(t => t.revenue), 100);
    }, [stats]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Analyse de vos données financières...</p>
        </div>
    );

    if (!stats) return (
        <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-100">
            <AlertTriangle className="mx-auto text-rose-500 mb-2" size={32} />
            <h3 className="text-lg font-bold text-rose-900">Erreur de chargement</h3>
            <p className="text-rose-600">Impossible de récupérer les statistiques en temps réel.</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Vue d'ensemble Financière</h1>
                    <p className="text-gray-500">Mise à jour en temps réel • {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
                <div className="hidden md:flex gap-2">
                    <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Système Connecté
                    </div>
                </div>
            </header>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Chiffre d'Affaires"
                    value={stats.totalRevenue}
                    icon={<TrendingUp size={24} />}
                    color="indigo"
                    subValue={`Facturé: ${stats.totalInvoiced.toFixed(0)} MAD`}
                />
                <MetricCard
                    title="Marge Brute"
                    value={stats.totalMargin}
                    icon={<DollarSign size={24} />}
                    color="emerald"
                    subValue={`Moyenne: ${stats.marginPercentage.toFixed(1)}%`}
                    trend={stats.marginPercentage > 20 ? 'up' : 'down'}
                />
                <MetricCard
                    title="Trésorerie Actuelle"
                    value={stats.realTimeProfit}
                    icon={<BarChart3 size={24} />}
                    color="blue"
                    subValue="Encaissé - Décaissements"
                />
                <MetricCard
                    title="À Recouvrer"
                    value={stats.totalUnpaidInvoices}
                    icon={<Clock size={24} />}
                    color="amber"
                    subValue={`${stats.totalInvoicesCount} factures actives`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Evolution - CSS Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <TrendingUp className="text-indigo-600" size={20} />
                                Évolution du Chiffre d'Affaires
                            </h2>
                            <p className="text-xs text-gray-400">Revenus mensuels sur les 6 derniers mois</p>
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between px-4 pb-8 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-x-0 top-0 border-t border-gray-50 border-dashed" />
                        <div className="absolute inset-x-0 top-1/4 border-t border-gray-50 border-dashed" />
                        <div className="absolute inset-x-0 top-2/4 border-t border-gray-50 border-dashed" />
                        <div className="absolute inset-x-0 top-3/4 border-t border-gray-50 border-dashed" />

                        {stats.revenueTrend.map((month, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-4 w-full group relative">
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded z-10 pointer-events-none">
                                    {month.revenue.toLocaleString()} MAD
                                </div>
                                <div
                                    className="w-10 bg-indigo-500 rounded-t-lg transition-all duration-500 hover:bg-indigo-600 shadow-lg shadow-indigo-100"
                                    style={{ height: `${(month.revenue / maxTrendRevenue) * 200}px` }}
                                />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{month.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cash Flow Projections */}
                <div className="bg-indigo-900 rounded-2xl p-6 shadow-xl text-white">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-indigo-300" />
                        Prévisions de Trésorerie
                    </h2>
                    <div className="space-y-6">
                        <ProjectionItem label="Prochains 30 Jours" value={stats.cashFlowForecast.thirtyDays} icon={<Clock size={16} />} />
                        <ProjectionItem label="Prochains 60 Jours" value={stats.cashFlowForecast.sixtyDays} icon={<TrendingUp size={16} />} />
                        <ProjectionItem label="Prochains 90 Jours" value={stats.cashFlowForecast.ninetyDays} icon={<DollarSign size={16} />} />
                    </div>
                    <div className="mt-8 pt-6 border-t border-indigo-800">
                        <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-1">Analyse de risque</p>
                        <p className="text-xs text-indigo-200 leading-relaxed italic">
                            Basé sur l'historique de paiement et les dates d'échéance des factures actives.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Critical Alerts */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                        <AlertTriangle className="text-rose-500" size={20} />
                        Alertes de Retard Critiques
                    </h2>
                    <div className="space-y-4">
                        {stats.criticalOverdueAlerts.length === 0 ? (
                            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-center font-medium">
                                Excellente nouvelle ! Aucun retard critique ({'>'} 60 jours).
                            </div>
                        ) : stats.criticalOverdueAlerts.map((alert) => (
                            <div key={alert.id} className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100 group hover:scale-[1.01] transition-transform">
                                <div>
                                    <div className="text-sm font-black text-rose-900">{alert.clientName}</div>
                                    <div className="text-xs text-rose-600 flex items-center gap-2 mt-0.5">
                                        <span className="font-bold">{alert.number}</span>
                                        <span>•</span>
                                        <span>En retard de {alert.daysOverdue} jours</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-rose-900">{alert.totalAmount.toLocaleString()} MAD</div>
                                    <button className="text-[10px] font-bold text-white bg-rose-500 px-2 py-1 rounded shadow-sm hover:bg-rose-600 mt-1 transition-colors uppercase">
                                        Relance Urgente
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Clients */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                        <Users className="text-indigo-600" size={20} />
                        Top 5 Clients (Volume d'Affaire)
                    </h2>
                    <div className="space-y-5">
                        {stats.topClients.map((client, idx) => (
                            <div key={client.id} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-gray-700">{idx + 1}. {client.name}</span>
                                    <span className="text-sm font-black text-indigo-600">{client.revenue.toLocaleString()} MAD</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-full rounded-full"
                                        style={{ width: `${(client.revenue / stats.topClients[0].revenue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, color, subValue, trend }: {
    title: string,
    value: number,
    icon: React.ReactNode,
    color: 'indigo' | 'emerald' | 'blue' | 'amber',
    subValue?: string,
    trend?: 'up' | 'down'
}) {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-0.5 text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {trend === 'up' ? 'OPTIMAL' : 'À SURVEILLER'}
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
                <p className="text-2xl font-black text-gray-900">{value.toLocaleString()} <span className="text-xs">MAD</span></p>
                {subValue && <p className="text-xs text-gray-400 font-medium">{subValue}</p>}
            </div>
        </div>
    );
}

function ProjectionItem({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 group hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/30 rounded-lg text-indigo-300">
                    {icon}
                </div>
                <span className="text-sm font-medium text-indigo-100">{label}</span>
            </div>
            <span className="text-lg font-black tracking-tight">{value.toLocaleString()} MAD</span>
        </div>
    );
}
