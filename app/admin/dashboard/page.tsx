'use client';

import { useState, useEffect } from 'react';
import { Users, Building2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingValidations: 0,
    activeCompanies: 0,
    activeDrivers: 0,
    expiringTrials: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Administrateur</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Validations */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Validations en attente</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingValidations}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Active Companies */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entreprises Actives</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeCompanies}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Drivers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chauffeurs Indépendants</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeDrivers}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Expiring Trials */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Essais expirant bientôt</p>
              <p className="text-3xl font-bold text-gray-900">{stats.expiringTrials}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions or Recent Activity could go here */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-blue-600">Valider les comptes</h3>
            <p className="text-sm text-gray-500">Examiner les demandes d'inscription récentes</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-blue-600">Gérer les essais</h3>
            <p className="text-sm text-gray-500">Prolonger ou terminer les périodes d'essai</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-blue-600">Envoyer une annonce</h3>
            <p className="text-sm text-gray-500">Diffuser un message à tous les utilisateurs</p>
          </button>
        </div>
      </div>
    </div>
  );
}