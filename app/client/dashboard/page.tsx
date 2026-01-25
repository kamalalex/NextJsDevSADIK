// app/client/dashboard/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import OperationModal from '../../../components/operations/OperationModal';
import OperationMap from '../../../components/operations/OperationMap';
import ClientInvoiceList from '../../../components/client/ClientInvoiceList';
import CancellationModal from '../../../components/operations/CancellationModal';
import PartnerList from '../../../components/company/PartnerList';


interface Operation {
  id: string;
  reference: string;
  operationDate: string;
  loadingPoints: any[];
  unloadingPoints: any[];
  vehicleType: string;
  ptac: string;
  status: string;
  observations?: string;
  operationPrice: number;
  salePrice?: number;
  createdAt: string;
  licensePlate?: string;
  driverName?: string;
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
    timestamp: string;
  };
  assignedDriver?: {
    id: string;
    name: string;
    phone: string;
    license: string;
  };
  assignedVehicle?: {
    id: string;
    plateNumber: string;
  };
  packaging?: string;
  quantity?: number;
  trackingUpdates?: any[];
}

interface ClientStats {
  totalOperations: number;
  operationsEnCours: number;
  operationsTerminees: number;
  montantDepense: number;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  destination: string;
  vehicleType: string;
  status: string;
}

export default function ClientDashboard() {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tableau' | 'operations' | 'factures' | 'partenaires'>('tableau');

  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);

  // New state for cancellation
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [operationToCancel, setOperationToCancel] = useState<Operation | null>(null);
  const [cancellationLoading, setCancellationLoading] = useState(false);

  // New state for modification
  const [operationToEdit, setOperationToEdit] = useState<Operation | null>(null);

  const [clientInfo, setClientInfo] = useState<{ sadicCode?: string } | null>(null);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    destination: '',
    vehicleType: '',
    status: ''
  });

  useEffect(() => {
    fetchData();
    fetchClientInfo();
  }, []);

  const fetchClientInfo = async () => {
    try {
      const response = await fetch('/api/client/info');
      if (response.ok) {
        const data = await response.json();
        setClientInfo(data);
      }
    } catch (error) {
      console.error('Error fetching client info:', error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch('/api/operations');
      if (response.ok) {
        const operationsData = await response.json();
        setOperations(operationsData);

        setStats({
          totalOperations: operationsData.length,
          operationsEnCours: operationsData.filter((op: Operation) =>
            ['EN_ATTENTE', 'PENDING', 'CONFIRME', 'CONFIRMED', 'EN_COURS', 'IN_PROGRESS'].includes(op.status)
          ).length,
          operationsTerminees: operationsData.filter((op: Operation) =>
            ['TERMINE', 'DELIVERED'].includes(op.status)
          ).length,
          montantDepense: operationsData.reduce((sum: number, op: Operation) =>
            sum + (op.salePrice || op.operationPrice || 0), 0
          )
        });
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
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

  const handleCancelOperation = async (reason: string) => {
    if (!operationToCancel) return;

    setCancellationLoading(true);
    try {
      const response = await fetch(`/api/operations/${operationToCancel.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'annulation');
      }

      await fetchData();
      setCancellationModalOpen(false);
      setOperationToCancel(null);
      console.log('Opération annulée avec succès');
    } catch (error) {
      console.error('Erreur annulation:', error);
    } finally {
      setCancellationLoading(false);
    }
  };

  const openCancellationModal = (e: React.MouseEvent, operation: Operation) => {
    e.stopPropagation();
    setOperationToCancel(operation);
    setCancellationModalOpen(true);
  };

  const handleEditOperation = (e: React.MouseEvent, operation: Operation) => {
    e.stopPropagation();
    setOperationToEdit(operation);
    setIsModalOpen(true);
  };

  const getAddress = (point: any) => {
    if (typeof point === 'string') return point;
    return point?.address || '';
  };

  const filteredOperations = useMemo(() => {
    return operations.filter(operation => {
      const matchesDate = (!filters.dateFrom || new Date(operation.operationDate) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(operation.operationDate) <= new Date(filters.dateTo));

      const matchesDestination = !filters.destination ||
        operation.loadingPoints.some(point => getAddress(point).toLowerCase().includes(filters.destination.toLowerCase())) ||
        operation.unloadingPoints.some(point => getAddress(point).toLowerCase().includes(filters.destination.toLowerCase()));

      const matchesVehicleType = !filters.vehicleType || operation.vehicleType === filters.vehicleType;
      const matchesStatus = !filters.status || operation.status === filters.status;

      return matchesDate && matchesDestination && matchesVehicleType && matchesStatus;
    });
  }, [operations, filters]);

  const paginatedOperations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOperations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOperations, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOperations.length / itemsPerPage);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      destination: '',
      vehicleType: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: any = {
      EN_ATTENTE: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'En attente' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'En attente' },
      CONFIRME: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Prise en charge' },
      CONFIRMED: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Prise en charge' },
      EN_COURS: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'En cours' },
      IN_PROGRESS: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'En cours' },
      TERMINE: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Terminé' },
      DELIVERED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Terminé' },
      ANNULE: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Annulé' },
      CANCELLED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Annulé' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Client</h1>
              {clientInfo?.sadicCode && (
                <span className="ml-4 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-mono font-bold tracking-wider border border-blue-200">
                  ID: {clientInfo.sadicCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('tableau')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tableau'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              📊 Tableau de Bord
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'operations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              🚚 Opérations
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {/*operations.length*/}
                {stats?.operationsEnCours}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('partenaires')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'partenaires'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              🤝 Partenaires
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'tableau' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Opérations Total</h3>
                <p className="text-3xl font-bold text-blue-600">{stats?.totalOperations}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">En Cours</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats?.operationsEnCours}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Terminées</h3>
                <p className="text-3xl font-bold text-green-600">{stats?.operationsTerminees}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Dépensé</h3>
                <p className="text-3xl font-bold text-purple-600">{stats?.montantDepense?.toLocaleString()} MAD</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-left"
                  >
                    📦 Nouvelle Demande de Transport
                  </button>

                  <button
                    onClick={() => setActiveTab('operations')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg text-left"
                  >
                    📊 Voir toutes mes Opérations
                  </button>

                  <button
                    onClick={() => setActiveTab('factures')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg text-left"
                  >
                    🧾 Factures et Paiements
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Opérations Récentes</h2>
                <div className="space-y-3">
                  {operations.slice(0, 3).map((operation) => (
                    <div key={operation.id} className="p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900">
                          {getAddress(operation.loadingPoints[0])} → {getAddress(operation.unloadingPoints[0])}
                        </p>
                        <StatusBadge status={operation.status} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(operation.operationDate)} • {operation.vehicleType} {operation.ptac.replace('_', ' ').toLowerCase()}
                      </p>
                    </div>
                  ))}
                  {operations.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucune opération récente</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'operations' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Mes Opérations</h2>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  + Nouvelle Demande
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <input
                    type="text"
                    placeholder="Ville ou adresse"
                    value={filters.destination}
                    onChange={(e) => handleFilterChange('destination', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule</label>
                  <select
                    value={filters.vehicleType}
                    onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous</option>
                    <option value="RIDEL">Ridel</option>
                    <option value="FOURGON">Fourgon</option>
                    <option value="BACHE">Baché</option>
                    <option value="PLATEAU">Plateau</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous</option>
                    <option value="PENDING">En attente</option>
                    <option value="CONFIRMED">Prise en charge</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="DELIVERED">Terminé</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {filteredOperations.length} opération(s) trouvée(s)
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Effacer les filtres
                </button>
              </div>
            </div>

            {paginatedOperations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune opération trouvée</h3>
                <p className="text-gray-500">Aucune opération ne correspond à vos critères de recherche.</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200">
                  {paginatedOperations.map((operation) => (
                    <div
                      key={operation.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedOperation(
                        selectedOperation?.id === operation.id ? null : operation
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(operation.operationDate)}
                            </div>
                            <div className="text-sm text-gray-500">{operation.reference}</div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-900">De:</span>
                              <div className="flex flex-col gap-1 mt-1">
                                {operation.loadingPoints.map((point, idx) => (
                                  <div key={idx} className="text-sm text-gray-600 flex items-start">
                                    <span className="mr-1">•</span>
                                    {getAddress(point)}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">À:</span>
                              <div className="flex flex-col gap-1 mt-1">
                                {operation.unloadingPoints.map((point, idx) => (
                                  <div key={idx} className="text-sm text-gray-600 flex items-start">
                                    <span className="mr-1">•</span>
                                    {getAddress(point)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-900">{operation.vehicleType}</div>
                            <div className="text-sm text-gray-500">{operation.ptac.replace('_', ' ').toLowerCase()}</div>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              INFORMATIONS
                            </div>
                            <div className="text-sm text-gray-500">
                              {`${operation.assignedDriver?.name || "—"} // ${operation.assignedVehicle?.plateNumber || "—"} // ${operation.assignedDriver?.phone || "—"}`}
                            </div>

                          </div>

                          <div className="flex justify-end items-center gap-2">
                            {['PENDING', 'EN_ATTENTE', 'CONFIRMED', 'CONFIRME'].includes(operation.status) && (
                              <button
                                onClick={(e) => openCancellationModal(e, operation)}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 transition-colors"
                              >
                                Annuler
                              </button>
                            )}
                            {['PENDING', 'EN_ATTENTE'].includes(operation.status) && (
                              <button
                                onClick={(e) => handleEditOperation(e, operation)}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                              >
                                Modifier
                              </button>
                            )}
                            <StatusBadge status={operation.status} />
                          </div>
                        </div>
                      </div>

                      {selectedOperation?.id === operation.id && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <h4 className="font-medium text-gray-900">Détails de l'opération</h4>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Date de l'opération</label>
                                  <div className="mt-1 text-sm text-gray-900">{formatDate(operation.operationDate)}</div>
                                </div>

                                {operation.driverName && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Chauffeur</label>
                                    <div className="mt-1 text-sm text-gray-900">{operation.driverName}</div>
                                  </div>
                                )}

                                {operation.licensePlate && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Immatriculation</label>
                                    <div className="mt-1 text-sm text-gray-900">{operation.licensePlate}</div>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-500">Points de chargement</label>
                                <div className="mt-1">
                                  {operation.loadingPoints.map((point, index) => (
                                    <div key={index} className="text-sm text-gray-900">• {getAddress(point)}</div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-500">Points de déchargement</label>
                                <div className="mt-1">
                                  {operation.unloadingPoints.map((point, index) => (
                                    <div key={index} className="text-sm text-gray-900">• {getAddress(point)}</div>
                                  ))}
                                </div>
                              </div>

                              {operation.observations && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Instructions spéciales</label>
                                  <div className="mt-1 text-sm text-gray-900">{operation.observations}</div>
                                </div>
                              )}
                            </div>



                            <div className="space-y-6">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-4">Suivi en temps réel</h4>
                                <div className="h-64 rounded-lg border border-gray-200 overflow-hidden">
                                  <OperationMap
                                    loadingPoints={operation.loadingPoints}
                                    unloadingPoints={operation.unloadingPoints}
                                    currentLocation={operation.currentLocation}
                                    status={operation.status}
                                  />
                                </div>
                                {operation.currentLocation && (
                                  <div className="mt-2 text-sm text-gray-500">
                                    Dernière mise à jour: {formatDate(operation.currentLocation.timestamp)}
                                  </div>
                                )}
                              </div>

                              {/* Historique de Suivi */}
                              {operation.trackingUpdates && operation.trackingUpdates.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-4">Historique de Suivi</h4>
                                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                                    <ul className="space-y-4">
                                      {operation.trackingUpdates.map((update: any, idx: number) => (
                                        <li key={idx} className="relative pl-4 border-l-2 border-blue-200 py-1">
                                          <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-blue-400 ring-2 ring-white" />
                                          <div className="text-sm font-medium">{update.note || update.status}</div>
                                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>{new Date(update.createdAt).toLocaleString('fr-FR')}</span>
                                            <span>{update.recordedBy}</span>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} sur {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )
        }

        {
          activeTab === 'factures' && (
            <ClientInvoiceList />
          )
        }
        {
          activeTab === 'partenaires' && (
            <PartnerList />
          )
        }
      </main >

      <OperationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setOperationToEdit(null);
        }}
        onSuccess={() => {
          console.log('✅ Demande traitée avec succès!');
          fetchData();
        }}
        userRole="CLIENT"
        initialData={operationToEdit}
      />

      <CancellationModal
        isOpen={cancellationModalOpen}
        onClose={() => {
          setCancellationModalOpen(false);
          setOperationToCancel(null);
        }}
        onConfirm={handleCancelOperation}
        loading={cancellationLoading}
      />
    </div >
  );
}