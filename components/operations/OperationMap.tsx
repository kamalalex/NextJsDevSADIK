// components/operations/OperationMap.tsx
'use client';

import { useEffect, useRef } from 'react';

interface OperationMapProps {
  loadingPoints: any[]; // Changed from string[] to any[] to handle Json objects
  unloadingPoints: any[];
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
    timestamp: string;
  };
  status: string;
}

// Service de géocoding simplifié (à remplacer par un vrai service)
const mockGeocoding = {
  'casablanca': { lat: 33.5731, lng: -7.5898 },
  'marrakech': { lat: 31.6295, lng: -7.9811 },
  'tanger': { lat: 35.7595, lng: -5.8340 },
  'rabat': { lat: 34.0209, lng: -6.8416 },
  'dakhla': { lat: 23.6842, lng: -15.9582 },
  'agadir': { lat: 30.4278, lng: -9.5981 },
  'fes': { lat: 34.0181, lng: -5.0078 }
};

export default function OperationMap({ loadingPoints, unloadingPoints, currentLocation, status }: OperationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // Helper to get address string safely
  const getAddress = (point: any) => {
    if (typeof point === 'string') return point;
    return point?.address || '';
  };

  useEffect(() => {
    if (mapRef.current && loadingPoints.length > 0 && unloadingPoints.length > 0) {
      // Simulation d'intégration avec Leaflet ou Google Maps
      initializeMap();
    }
  }, [loadingPoints, unloadingPoints, currentLocation]);

  const initializeMap = () => {
    // Ici vous intégrerez votre service de cartes (Leaflet, Google Maps, etc.)
    console.log('Initialisation carte avec:', {
      départ: getAddress(loadingPoints[0]),
      arrivée: getAddress(unloadingPoints[0]),
      positionActuelle: currentLocation
    });

    // Pour l'instant, affichage d'une carte statique ou placeholder
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div class="h-full flex items-center justify-center bg-gray-100">
          <div class="text-center">
            <div class="text-4xl mb-2">🗺️</div>
            <p class="text-gray-600">Carte de suivi</p>
            <p class="text-sm text-gray-500 mt-2">
              Départ: ${getAddress(loadingPoints[0])}<br>
              Arrivée: ${getAddress(unloadingPoints[0])}<br>
              ${currentLocation ? `Position actuelle: ${currentLocation.address}` : 'En attente de localisation'}
            </p>
            <div class="mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded text-sm">
              Statut: ${getStatusText(status)}
            </div>
          </div>
        </div>
      `;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'EN_ATTENTE': 'En attente de prise en charge',
      'PENDING': 'En attente de prise en charge',
      'CONFIRME': 'Chargement en cours',
      'CONFIRMED': 'Chargement en cours',
      'EN_COURS': 'En transit',
      'IN_PROGRESS': 'En transit',
      'TERMINE': 'Livraison effectuée',
      'DELIVERED': 'Livraison effectuée',
      'ANNULE': 'Transport annulé',
      'CANCELLED': 'Transport annulé'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  return (
    <div ref={mapRef} className="w-full h-full">
      {/* La carte sera injectée ici */}
    </div>
  );
}