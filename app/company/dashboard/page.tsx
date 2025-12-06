'use client';

import { useState, useEffect } from 'react';
import VehicleList from '../../../components/company/VehicleList';
import DriverList from '../../../components/company/DriverList';
import ClientList from '../../../components/company/ClientList';
import SubcontractorList from '../../../components/company/SubcontractorList';
import OperationBoard from '../../../components/company/OperationBoard';
import InvoiceList from '../../../components/company/InvoiceList';
import InvoiceGenerator from '../../../components/company/InvoiceGenerator';
import SubcontractorPayments from '../../../components/company/SubcontractorPayments';
import FinancialDashboard from '../../../components/company/FinancialDashboard';

interface CompanyStats {
  totalOperations: number;
  activeOperations: number;
  completedOperations: number;
  availableVehicles: number;
  activeDrivers: number;
  totalRevenue: number;
}

type MainTab = 'overview' | 'planning' | 'finance' | 'resources';
type FinanceTab = 'invoices' | 'payments';
type ResourceTab = 'fleet' | 'drivers' | 'subcontractors' | 'clients';

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [activeFinanceTab, setActiveFinanceTab] = useState<FinanceTab>('invoices');
  const [activeResourceTab, setActiveResourceTab] = useState<ResourceTab>('fleet');

  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/company/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Espace Transporteur</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              📊 Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('planning')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'planning'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              🗓️ Planning & Opérations
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'finance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              💰 Finance
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'resources'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              📦 Ressources
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                <h3 className="text-gray-500 text-sm font-medium">Opérations Actives</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.activeOperations || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                <h3 className="text-gray-500 text-sm font-medium">Opérations Terminées</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.completedOperations || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                <h3 className="text-gray-500 text-sm font-medium">Véhicules Disponibles</h3>
                <p className="text-3xl font-bold text-gray-900">{stats?.availableVehicles || 0}</p>
              </div>
            </div>

            {/* Financial Dashboard Integration */}
            <div>
              <FinancialDashboard />
            </div>

            {/* Recent Activity / Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Alertes</h3>
              <div className="space-y-4">
                {stats?.activeOperations === 0 && (
                  <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                    Aucune opération en cours. Vérifiez le planning.
                  </div>
                )}
                {stats?.availableVehicles === 0 && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    Attention: Aucun véhicule disponible.
                  </div>
                )}
                {stats?.activeOperations !== undefined && stats?.activeOperations > 0 && stats?.availableVehicles > 0 && (
                  <div className="p-4 bg-green-50 text-green-700 rounded-md">
                    Tout semble normal. Bonne route !
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planning' && <OperationBoard />}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Finance Sub-navigation */}
            <div className="flex space-x-4 border-b pb-2">
              <button
                onClick={() => setActiveFinanceTab('invoices')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFinanceTab === 'invoices'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Facturation
              </button>
              <button
                onClick={() => setActiveFinanceTab('payments')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFinanceTab === 'payments'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Paiements Sous-traitants
              </button>
            </div>

            {/* Finance Content */}
            {activeFinanceTab === 'invoices' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowInvoiceGenerator(!showInvoiceGenerator)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    {showInvoiceGenerator ? 'Voir la liste' : 'Générer une facture'}
                  </button>
                </div>
                {showInvoiceGenerator ? (
                  <InvoiceGenerator onSuccess={() => setShowInvoiceGenerator(false)} />
                ) : (
                  <InvoiceList />
                )}
              </div>
            )}

            {activeFinanceTab === 'payments' && <SubcontractorPayments />}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            {/* Resources Sub-navigation */}
            <div className="flex space-x-4 border-b pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveResourceTab('fleet')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeResourceTab === 'fleet'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                🚛 Flotte
              </button>
              <button
                onClick={() => setActiveResourceTab('drivers')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeResourceTab === 'drivers'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                👥 Chauffeurs
              </button>
              <button
                onClick={() => setActiveResourceTab('subcontractors')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeResourceTab === 'subcontractors'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                🤝 Sous-traitants
              </button>
              <button
                onClick={() => setActiveResourceTab('clients')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeResourceTab === 'clients'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                🏢 Clients
              </button>
            </div>

            {/* Resources Content */}
            {activeResourceTab === 'fleet' && <VehicleList />}
            {activeResourceTab === 'drivers' && <DriverList />}
            {activeResourceTab === 'subcontractors' && <SubcontractorList />}
            {activeResourceTab === 'clients' && <ClientList />}
          </div>
        )}
      </main>
    </div>
  );
}