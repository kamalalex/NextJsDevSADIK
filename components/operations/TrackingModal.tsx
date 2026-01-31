import { X } from 'lucide-react';
import OperationMap from './OperationMap';

interface Operation {
    id: string;
    reference: string;
    loadingPoints: any[];
    unloadingPoints: any[];
    currentLocation?: any;
    status: string;
    assignedDriver?: { name: string; phone: string };
    assignedVehicle?: { plateNumber: string };
}

interface TrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    operation: Operation;
}

export default function TrackingModal({ isOpen, onClose, operation }: TrackingModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Suivi Opération #{operation.reference}</h3>
                        {operation.assignedDriver && (
                            <p className="text-sm text-gray-500">
                                Chauffeur: {operation.assignedDriver.name} • {operation.assignedVehicle?.plateNumber || 'Véhicule non défini'}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 p-4 bg-gray-50 min-h-[400px]">
                    <OperationMap
                        loadingPoints={operation.loadingPoints}
                        unloadingPoints={operation.unloadingPoints}
                        currentLocation={operation.currentLocation}
                        status={operation.status}
                    />
                </div>
            </div>
        </div>
    );
}
