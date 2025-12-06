'use client';

import { useState, useEffect } from 'react';
import AssignmentModal from './AssignmentModal';
import OperationModal from '@/components/operations/OperationModal';

interface Operation {
    id: string;
    reference: string;
    operationDate: string;
    status: string;
    loadingPoints: any[];
    unloadingPoints: any[];
    client: { name: string };
    assignedDriver?: { id: string; name: string };
    assignedVehicle?: { id: string; plateNumber: string };
    subcontractor?: { id: string; companyName: string };
    subcontractedByCompany?: boolean;
    salePrice?: number;
    purchasePrice?: number;
}

export default function OperationBoard() {
    const [operations, setOperations] = useState<Operation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOpForAssignment, setSelectedOpForAssignment] = useState<Operation | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchOperations();
    }, []);

    const fetchOperations = async () => {
        try {
            const response = await fetch('/api/company/operations');
            if (response.ok) {
                const data = await response.json();
                setOperations(data);
            }
        } catch (error) {
            console.error('Error fetching operations:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/company/operations/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                fetchOperations();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getAddress = (point: any) => {
        if (typeof point === 'string') return point;
        return point?.address || '';
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            CONFIRMED: 'bg-blue-100 text-blue-800',
            IN_PROGRESS: 'bg-orange-100 text-orange-800',
            DELIVERED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Planning des Opérations</h3>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <span>+</span> Nouvelle Opération
                    </button>
                    <button onClick={fetchOperations} className="text-blue-600 hover:text-blue-800 text-sm">
                        Actualiser
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {operations.map((op) => (
                    <div key={op.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-gray-900">{op.reference}</span>
                                    <StatusBadge status={op.status} />
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    Client: <span className="font-medium text-gray-900">{op.client?.name || 'Inconnu'}</span>
                                </div>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                                {new Date(op.operationDate).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="text-sm">
                                <div className="text-gray-500">Chargement</div>
                                <div className="font-medium">{getAddress(op.loadingPoints[0])}</div>
                            </div>
                            <div className="text-sm">
                                <div className="text-gray-500">Déchargement</div>
                                <div className="font-medium">{getAddress(op.unloadingPoints[0])}</div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-4 text-sm">
                                    <div className="flex items-center">
                                        <span className="text-gray-500 mr-2">Chauffeur:</span>
                                        {op.assignedDriver ? (
                                            <span className="font-medium text-green-700">{op.assignedDriver.name}</span>
                                        ) : (
                                            <span className="text-red-500 italic">Non assigné</span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-500 mr-2">Véhicule:</span>
                                        {op.assignedVehicle ? (
                                            <span className="font-medium text-blue-700">{op.assignedVehicle.plateNumber}</span>
                                        ) : (
                                            <span className="text-red-500 italic">Non assigné</span>
                                        )}
                                    </div>
                                    {op.subcontractor && (
                                        <div className="flex items-center">
                                            <span className="text-gray-500 mr-2">Sous-traitant:</span>
                                            <span className="font-medium text-purple-700">{op.subcontractor.companyName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pricing Information */}
                            {(op.salePrice || op.purchasePrice) && (
                                <div className="flex items-center space-x-4 text-sm mb-3">
                                    {op.salePrice && (
                                        <div className="flex items-center">
                                            <span className="text-gray-500 mr-2">Prix client:</span>
                                            <span className="font-semibold text-green-600">{op.salePrice.toFixed(2)} MAD</span>
                                        </div>
                                    )}
                                    {op.purchasePrice && (
                                        <div className="flex items-center">
                                            <span className="text-gray-500 mr-2">Prix sous-traitant:</span>
                                            <span className="font-semibold text-orange-600">{op.purchasePrice.toFixed(2)} MAD</span>
                                        </div>
                                    )}
                                    {op.salePrice && op.purchasePrice && (
                                        <div className="flex items-center">
                                            <span className="text-gray-500 mr-2">Marge:</span>
                                            <span className="font-semibold text-blue-600">
                                                {(op.salePrice - op.purchasePrice).toFixed(2)} MAD
                                                ({(((op.salePrice - op.purchasePrice) / op.salePrice) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex space-x-2">
                                {/* Only show Assigner button if operation is not delivered or cancelled */}
                                {op.status !== 'DELIVERED' && op.status !== 'CANCELLED' && (
                                    <button
                                        onClick={() => setSelectedOpForAssignment(op)}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                                    >
                                        Assigner
                                    </button>
                                )}

                                {op.status === 'CONFIRMED' && (
                                    <button
                                        onClick={() => updateStatus(op.id, 'IN_PROGRESS')}
                                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200"
                                    >
                                        Démarrer
                                    </button>
                                )}

                                {op.status === 'IN_PROGRESS' && (
                                    <button
                                        onClick={() => updateStatus(op.id, 'DELIVERED')}
                                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                                    >
                                        Livrer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {operations.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-500">Aucune opération assignée à votre compagnie.</p>
                    </div>
                )}
            </div>

            {selectedOpForAssignment && (
                <AssignmentModal
                    isOpen={!!selectedOpForAssignment}
                    onClose={() => setSelectedOpForAssignment(null)}
                    operationId={selectedOpForAssignment.id}
                    currentDriverId={selectedOpForAssignment.assignedDriver?.id}
                    currentVehicleId={selectedOpForAssignment.assignedVehicle?.id}
                    onSuccess={() => {
                        fetchOperations();
                        setSelectedOpForAssignment(null);
                    }}
                />
            )}

            <OperationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchOperations();
                    setIsCreateModalOpen(false);
                }}
                userRole="COMPANY_ADMIN"
            />
        </div>
    );
}
