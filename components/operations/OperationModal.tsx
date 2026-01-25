'use client';

import { useState, useEffect } from 'react';

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole: string; // Nouveau: pour adapter le formulaire
  initialData?: any; // Pour la modification
}

interface OperationFormData {
  operationDate: string;
  reference: string;
  loadingPoints: string[];
  unloadingPoints: string[];
  vehicleType: string;
  ptac: string;
  observations: string;
  // Prix et immatriculation retirés pour le client
  totalWeight?: number;
  packaging?: string;
  quantity?: number;
  // Champs spécifiques Transporteur
  clientId?: string;
  salePrice?: number;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  subcontractorId?: string;
  purchasePrice?: number; // Prix d'achat (sous-traitance)
  transportCompanyId?: string; // Pour les clients
  assignMode: 'INTERNAL' | 'SUBCONTRACTOR';
}

export default function OperationModal({ isOpen, onClose, onSuccess, userRole, initialData }: OperationModalProps) {
  const [formData, setFormData] = useState<OperationFormData>({
    operationDate: new Date().toISOString().split('T')[0],
    reference: `OP-${Date.now()}`,
    loadingPoints: [''],
    unloadingPoints: [''],
    vehicleType: '',
    ptac: '',
    observations: '',
    totalWeight: undefined,
    packaging: '',
    quantity: undefined,
    clientId: '',
    salePrice: undefined,
    assignedDriverId: '',
    assignedVehicleId: '',
    subcontractorId: '',
    purchasePrice: undefined,
    transportCompanyId: '',
    assignMode: 'INTERNAL'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Listes pour les sélecteurs (Transporteur uniquement)
  const [clients, setClients] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]); // Partenaires actifs

  const isCompany = userRole === 'COMPANY_ADMIN' || userRole === 'COMPANY_OPERATOR';

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode modification
        setFormData({
          operationDate: initialData.operationDate ? new Date(initialData.operationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          reference: initialData.reference,
          loadingPoints: initialData.loadingPoints && initialData.loadingPoints.length > 0
            ? initialData.loadingPoints.map((p: any) => p.address || p)
            : [''],
          unloadingPoints: initialData.unloadingPoints && initialData.unloadingPoints.length > 0
            ? initialData.unloadingPoints.map((p: any) => p.address || p)
            : [''],
          vehicleType: initialData.vehicleType || '',
          ptac: initialData.ptac || '',
          observations: initialData.observations || '',
          totalWeight: initialData.totalWeight,
          packaging: initialData.packaging || '',
          quantity: initialData.quantity,
          clientId: initialData.clientId || '',
          salePrice: initialData.salePrice,
          assignedDriverId: initialData.assignedDriverId || '',
          assignedVehicleId: initialData.assignedVehicleId || '',
          subcontractorId: initialData.subcontractorId || '',
          assignMode: initialData.subcontractorId ? 'SUBCONTRACTOR' : 'INTERNAL'
        });
      } else {
        // Mode création
        setFormData({
          operationDate: new Date().toISOString().split('T')[0],
          reference: `OP-${Date.now()}`,
          loadingPoints: [''],
          unloadingPoints: [''],
          vehicleType: '',
          ptac: '',
          observations: '',
          totalWeight: undefined,
          packaging: '',
          quantity: undefined,
          clientId: '',
          salePrice: undefined,
          assignedDriverId: '',
          assignedVehicleId: '',
          subcontractorId: '',
          transportCompanyId: '',
          assignMode: 'INTERNAL'
        });
      }

      // Fetch lists
      fetchLists();
    }
  }, [isOpen, initialData, userRole]);

  const fetchLists = async () => {
    try {
      const [clientsRes, driversRes, vehiclesRes, subcontractorsRes] = await Promise.all([
        fetch('/api/company/clients'),
        fetch('/api/company/drivers'),
        fetch('/api/company/vehicles'),
        fetch('/api/company/subcontractors')
      ]);

      if (clientsRes.ok) setClients(await clientsRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (subcontractorsRes.ok) setSubcontractors(await subcontractorsRes.json());

      // Fetch partners for both roles
      const partnersRes = await fetch('/api/company/partners');
      if (partnersRes.ok) setPartners(await partnersRes.json());

    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  // Fonctions pour points de chargement/déchargement (inchangées)
  const addLoadingPoint = () => {
    setFormData(prev => ({
      ...prev,
      loadingPoints: [...prev.loadingPoints, '']
    }));
  };

  const removeLoadingPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      loadingPoints: prev.loadingPoints.filter((_, i) => i !== index)
    }));
  };

  const updateLoadingPoint = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      loadingPoints: prev.loadingPoints.map((point, i) => i === index ? value : point)
    }));
  };

  const addUnloadingPoint = () => {
    setFormData(prev => ({
      ...prev,
      unloadingPoints: [...prev.unloadingPoints, '']
    }));
  };

  const removeUnloadingPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      unloadingPoints: prev.unloadingPoints.filter((_, i) => i !== index)
    }));
  };

  const updateUnloadingPoint = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      unloadingPoints: prev.unloadingPoints.map((point, i) => i === index ? value : point)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Filtrer les points vides
      const filteredLoadingPoints = formData.loadingPoints.filter(point => point.trim() !== '');
      const filteredUnloadingPoints = formData.unloadingPoints.filter(point => point.trim() !== '');

      if (filteredLoadingPoints.length === 0 || filteredUnloadingPoints.length === 0) {
        setError('Au moins un point de chargement et de déchargement est requis');
        return;
      }

      if (!formData.vehicleType || !formData.ptac) {
        setError('Le type de véhicule et le PTAC sont requis');
        return;
      }

      if (isCompany && !formData.clientId) {
        setError('Le client est requis');
        return;
      }

      // Préparer le payload selon votre schema
      const payload: any = {
        reference: formData.reference,
        operationDate: new Date(formData.operationDate).toISOString(),
        loadingPoints: filteredLoadingPoints,
        unloadingPoints: filteredUnloadingPoints,
        vehicleType: formData.vehicleType,
        ptac: formData.ptac,
        totalWeight: formData.totalWeight ? Number(formData.totalWeight) : 0,
        packaging: formData.packaging || null,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        observations: formData.observations || ''
      };

      // Ajouter champs spécifiques transporteur
      if (isCompany) {
        payload.clientId = formData.clientId;
        payload.salePrice = formData.salePrice;

        if (formData.assignMode === 'SUBCONTRACTOR') {
          payload.subcontractorId = formData.subcontractorId;
          payload.purchasePrice = formData.purchasePrice; // Add purchase price
          payload.assignedDriverId = null;
          payload.assignedVehicleId = null;
        } else {
          payload.assignedDriverId = formData.assignedDriverId;
          payload.assignedVehicleId = formData.assignedVehicleId;
          payload.subcontractorId = null;
          payload.purchasePrice = null;
        }
      } else {
        payload.transportCompanyId = formData.transportCompanyId;
      }


      let response;
      if (initialData) {
        // Mode modification
        response = await fetch('/api/operations', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...payload, id: initialData.id }),
        });
      } else {
        // Mode création
        response = await fetch('/api/operations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur API: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Opération créée/modifiée:', result);

      onSuccess();
      onClose();

      // Réinitialiser le formulaire
      setFormData({
        operationDate: new Date().toISOString().split('T')[0],
        reference: `OP-${Date.now()}`,
        loadingPoints: [''],
        unloadingPoints: [''],
        vehicleType: '',
        ptac: '',
        observations: '',
        totalWeight: undefined,
        packaging: '',
        quantity: undefined,
        clientId: '',
        salePrice: undefined,
        assignedDriverId: '',
        assignedVehicleId: '',
        subcontractorId: '',
        assignMode: 'INTERNAL'
      });

    } catch (error: any) {
      console.error('❌ Erreur création opération:', error);
      setError(error.message || 'Erreur lors de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Modifier la Demande' : 'Nouvelle Opération'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date souhaitée <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.operationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, operationDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Référence
              </label>
              <input
                type="text"
                value={formData.reference}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {/* Champs spécifiques Transporteur: Client */}
          {isCompany && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Transporteur pour le Client */}
          {!isCompany && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transporteur <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.transportCompanyId}
                onChange={(e) => setFormData(prev => ({ ...prev, transportCompanyId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un transporteur partenaire</option>
                {partners.map(partner => (
                  <option key={partner.linkedCompany.id} value={partner.linkedCompany.id}>
                    {partner.linkedCompany.name} ({partner.linkedCompany.sadicCode})
                  </option>
                ))}
              </select>
              {partners.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  ⚠️ Vous devez d'abord ajouter un transporteur partenaire via son code SADIC.
                </p>
              )}
            </div>
          )}

          {/* Points de chargement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points de chargement <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {formData.loadingPoints.map((point, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => updateLoadingPoint(index, e.target.value)}
                    placeholder="Adresse complète de chargement"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.loadingPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLoadingPoint(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLoadingPoint}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <span>+</span>
                Ajouter un point de chargement
              </button>
            </div>
          </div>

          {/* Points de déchargement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points de déchargement <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {formData.unloadingPoints.map((point, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => updateUnloadingPoint(index, e.target.value)}
                    placeholder="Adresse complète de déchargement"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.unloadingPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUnloadingPoint(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addUnloadingPoint}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <span>+</span>
                Ajouter un point de déchargement
              </button>
            </div>
          </div>

          {/* Véhicule et PTAC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de véhicule souhaité <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.vehicleType}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez</option>
                <option value="RIDEL">Ridel</option>
                <option value="FOURGON">Fourgon</option>
                <option value="BACHE">Baché</option>
                <option value="PLATEAU">Plateau</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PTAC requis <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.ptac}
                onChange={(e) => setFormData(prev => ({ ...prev, ptac: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez</option>
                <option value="PTAC_7T">7 tonnes</option>
                <option value="PTAC_14T">14 tonnes</option>
                <option value="PTAC_25T">25 tonnes</option>
              </select>
            </div>
          </div>

          {/* Détails Marchandise - Visible pour tous maintenant */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poids des marchandises (kg)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.totalWeight || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, totalWeight: parseFloat(e.target.value) }))}
                placeholder="Ex: 1500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conditionnement
              </label>
              <select
                value={formData.packaging || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, packaging: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez</option>
                <option value="PALLET">Palette</option>
                <option value="PARCEL">Colis</option>
                <option value="BULK">Vrac</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantité
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                placeholder="Nombre d'unités"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Champs spécifiques Transporteur: Prix, Chauffeur, Véhicule */}
          {isCompany && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix de vente (MAD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode d'assignation
                  </label>
                  <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, assignMode: 'INTERNAL' }))}
                      className={`flex-1 py-2 px-4 text-sm font-medium ${formData.assignMode === 'INTERNAL'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      Flotte Interne
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, assignMode: 'SUBCONTRACTOR', assignedDriverId: '', assignedVehicleId: '' }))}
                      className={`flex-1 py-2 px-4 text-sm font-medium ${formData.assignMode === 'SUBCONTRACTOR'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      Sous-traitance
                    </button>
                  </div>
                </div>

                {/* Sélection selon le mode */}
                {formData.assignMode === 'INTERNAL' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conducteur
                      </label>
                      <select
                        value={formData.assignedDriverId}
                        onChange={(e) => setFormData(prev => ({ ...prev, assignedDriverId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un conducteur</option>
                        {drivers
                          .filter(d => !d.subcontractorId)
                          .map(driver => (
                            <option key={driver.id} value={driver.id}>{driver.name}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Véhicule
                      </label>
                      <select
                        value={formData.assignedVehicleId}
                        onChange={(e) => setFormData(prev => ({ ...prev, assignedVehicleId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un véhicule</option>
                        {vehicles
                          .filter(v => !v.subcontractorId)
                          .map(vehicle => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.plateNumber} {vehicle.brand ? `- ${vehicle.brand}` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sous-traitant <span className="text-red-500">*</span>
                      </label>
                      <select
                        required={formData.assignMode === 'SUBCONTRACTOR'}
                        value={formData.subcontractorId}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          subcontractorId: e.target.value,
                          assignedDriverId: '',
                          assignedVehicleId: ''
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner un sous-traitant</option>
                        {subcontractors.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.companyName || sub.name}</option>
                        ))}
                      </select>
                    </div>

                    {formData.assignMode === 'SUBCONTRACTOR' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix d'achat (MAD) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required={formData.assignMode === 'SUBCONTRACTOR'}
                          value={formData.purchasePrice || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) }))}
                          placeholder="Prix convenu avec le sous-traitant"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {formData.subcontractorId && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Conducteur (Sous-traitant)
                          </label>
                          <select
                            value={formData.assignedDriverId}
                            onChange={(e) => setFormData(prev => ({ ...prev, assignedDriverId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Sélectionner un conducteur</option>
                            {drivers
                              .filter(d => d.subcontractorId === formData.subcontractorId)
                              .map(driver => (
                                <option key={driver.id} value={driver.id}>{driver.name}</option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Véhicule (Sous-traitant)
                          </label>
                          <select
                            value={formData.assignedVehicleId}
                            onChange={(e) => setFormData(prev => ({ ...prev, assignedVehicleId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Sélectionner un véhicule</option>
                            {vehicles
                              .filter(v => v.subcontractorId === formData.subcontractorId)
                              .map(vehicle => (
                                <option key={vehicle.id} value={vehicle.id}>
                                  {vehicle.plateNumber} {vehicle.brand ? `- ${vehicle.brand}` : ''}
                                </option>
                              ))}
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}

              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                'Soumettre la demande'
              )}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
}
