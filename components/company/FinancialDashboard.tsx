'use client';

import { useState, useEffect } from 'react';

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

    if (loading) return <div className="p-4 text-center">Chargement des statistiques...</div>;
    if (!stats) return <div className="p-4 text-center text-red-500">Erreur de chargement des données</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Tableau de Bord Financier</h2>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Card */}
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="text-sm text-gray-500">Chiffre d'Affaires Total</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.totalRevenue.toFixed(2)} MAD</div>
                    <div className="text-xs text-gray-400 mt-1">
                        Facturé: {stats.totalInvoiced.toFixed(2)} MAD
                    </div>
                </div>

                {/* Profit Card */}
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <div className="text-sm text-gray-500">Marge Totale</div>
                    <div className="text-2xl font-bold text-green-600">{stats.totalMargin.toFixed(2)} MAD</div>
                    <div className="text-xs text-gray-400 mt-1">
                        Moyenne: {stats.marginPercentage}%
                    </div>
                </div>

                {/* Cash Flow Card */}
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="text-sm text-gray-500">Trésorerie (Profit Réel)</div>
                    <div className="text-2xl font-bold text-purple-600">{stats.realTimeProfit.toFixed(2)} MAD</div>
                    <div className="text-xs text-gray-400 mt-1">
                        Encaissé - Décaissements
                    </div>
                </div>

                {/* Pending Card */}
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                    <div className="text-sm text-gray-500">Reste à Payer (Sous-traitants)</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.totalOwedToSubcontractors.toFixed(2)} MAD</div>
                    <div className="text-xs text-gray-400 mt-1">
                        Factures impayées: {stats.totalUnpaidInvoices.toFixed(2)} MAD
                    </div>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Invoicing Status */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">État de la Facturation</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Total Facturé</span>
                            <span className="font-medium">{stats.totalInvoiced.toFixed(2)} MAD</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Reste à Facturer</span>
                            <span className="font-medium text-orange-600">{stats.totalUninvoiced.toFixed(2)} MAD</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Factures Payées</span>
                            <span className="font-medium text-green-600">{stats.totalPaidInvoices.toFixed(2)} MAD</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Factures En Attente</span>
                            <span className="font-medium text-red-600">{stats.totalUnpaidInvoices.toFixed(2)} MAD</span>
                        </div>
                    </div>
                </div>

                {/* Subcontracting Status */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">État de la Sous-traitance</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Total Payé aux Sous-traitants</span>
                            <span className="font-medium text-blue-600">{stats.totalSubcontractorPayments.toFixed(2)} MAD</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600">Reste à Payer</span>
                            <span className="font-medium text-red-600">{stats.totalOwedToSubcontractors.toFixed(2)} MAD</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Marge Moyenne par Opération</span>
                            <span className="font-medium">{stats.averageMargin.toFixed(2)} MAD</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
