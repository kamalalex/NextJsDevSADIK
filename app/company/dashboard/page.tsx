'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import VehicleList from '../../../components/company/VehicleList';
import DriverList from '../../../components/company/DriverList';
import ClientList from '../../../components/company/ClientList';
import SubcontractorList from '../../../components/company/SubcontractorList';
import OperationBoard from '../../../components/company/OperationBoard';
import InvoiceList from '../../../components/company/InvoiceList';
import InvoiceGenerator from '../../../components/company/InvoiceGenerator';
import SubcontractorPayments from '../../../components/company/SubcontractorPayments';
import FinancialDashboard from '../../../components/company/FinancialDashboard';
import CompanyProfile from '../../../components/company/CompanyProfile';
import TeamList from '../../../components/company/TeamList';
import PartnerList from '../../../components/company/PartnerList';
import HumanResources from '../../../components/company/HumanResources';


interface CompanyStats {
  totalOperations: number;
  activeOperations: number;
  completedOperations: number;
  availableVehicles: number;
  activeDrivers: number;
  totalRevenue: number;
  sadicCode?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

type MainTab = 'overview' | 'planning' | 'finance' | 'resources' | 'profile' | 'hr';
type FinanceTab = 'invoices' | 'payments';
type ResourceTab = 'fleet' | 'drivers' | 'subcontractors' | 'partners' | 'clients' | 'team';


export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [activeFinanceTab, setActiveFinanceTab] = useState<FinanceTab>('invoices');
  const [activeResourceTab, setActiveResourceTab] = useState<ResourceTab>('fleet');

  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user/me');
      if (response.ok) {
        if (!response.ok) {
          // If fetching user fails or not authenticated, redirect happens by middleware or next interaction
          return;
        }
        const data = await response.json();
        setUser(data);

        // If not admin, ensure operator lands on planning
        if (data.role !== 'COMPANY_ADMIN') {
          setActiveTab('planning');
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

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

  const isAdmin = user?.role === 'COMPANY_ADMIN';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleMobileNavClick = (tab: MainTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
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
      <header className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">Espace Transporteur</h1>
              {stats?.sadicCode && (
                <span className="hidden md:inline-block ml-4 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-mono font-bold tracking-wider border border-purple-200">
                  ID: {stats.sadicCode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-3 mr-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">Administrateur</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-gray-200 text-blue-600 font-bold">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{user.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="hidden md:flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`text-sm font-medium ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Mon Profil
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Déconnexion
                </button>
              </div>

              {/* Mobile Hamburger Button */}
              <button
                onClick={toggleMenu}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full z-30">
            <div className="px-4 py-2 space-y-1">
              {/* Mobile User Info */}
              {user && (
                <div className="flex items-center gap-3 py-3 border-b border-gray-100 mb-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 text-blue-700 font-bold">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <span>{user.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">
                      {stats?.sadicCode ? `ID: ${stats.sadicCode}` : 'Administrateur'}
                    </p>
                  </div>
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleMobileNavClick('overview')}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  📊 Vue d'ensemble
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleMobileNavClick('hr')}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'hr'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  👥 RH & Paie
                </button>
              )}
              <button
                onClick={() => handleMobileNavClick('planning')}
                className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'planning'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                🗓️ Planning & Opérations
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => handleMobileNavClick('finance')}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'finance'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    💰 Finance
                  </button>
                  <button
                    onClick={() => handleMobileNavClick('resources')}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'resources'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    📦 Ressources
                  </button>
                </>
              )}

              <div className="border-t border-gray-100 my-2 pt-2">
                <button
                  onClick={() => handleMobileNavClick('profile')}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  Mon Profil
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Navigation (Desktop Only) */}
      <div className="bg-white border-b hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                📊 Vue d'ensemble
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('hr')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'hr'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                👥 RH & Paie
              </button>
            )}
            <button
              onClick={() => setActiveTab('planning')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'planning'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              🗓️ Planning & Opérations
            </button>
            {isAdmin && (
              <>
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
              </>
            )}
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
              {isAdmin && (
                <button
                  onClick={() => setActiveResourceTab('team')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeResourceTab === 'team'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  👥 Équipe
                </button>
              )}
            </div>

            {/* Resources Content */}
            {activeResourceTab === 'fleet' && <VehicleList />}
            {activeResourceTab === 'drivers' && <DriverList />}
            {activeResourceTab === 'subcontractors' && <SubcontractorList />}
            {activeResourceTab === 'clients' && <ClientList />}
            {activeResourceTab === 'team' && isAdmin && <TeamList />}

          </div>
        )}

        {activeTab === 'profile' && (
          <CompanyProfile
            userAvatar={user?.avatar}
            currentName={user?.name}
            onAvatarUpdate={(url) => setUser(prev => prev ? { ...prev, avatar: url } : null)}
            onNameUpdate={(newName) => setUser(prev => prev ? { ...prev, name: newName } : null)}
          />
        )}

        {activeTab === 'hr' && isAdmin && <HumanResources />}
      </main>
    </div>
  );
}