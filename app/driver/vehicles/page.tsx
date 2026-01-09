'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, ArrowLeft, Truck, Trash2, Edit2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function VehiclesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        plateNumber: '',
        brand: '',
        model: '',
        vehicleType: 'FOURGON',
        capacity: ''
    });

    const fetchVehicles = async () => {
        try {
            const res = await fetch('/api/driver/vehicles');
            if (res.ok) {
                const data = await res.json();
                setVehicles(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const resetForm = () => {
        setFormData({ plateNumber: '', brand: '', model: '', vehicleType: 'FOURGON', capacity: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEditClick = (v: any) => {
        setFormData({
            plateNumber: v.plateNumber,
            brand: v.brand || '',
            model: v.model,
            vehicleType: v.vehicleType,
            capacity: v.capacity || ''
        });
        setEditingId(v.id);
        setIsAdding(true); // Reuse the add form
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/driver/vehicles?id=${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                setVehicles(vehicles.filter(v => v.id !== deleteId));
                toast({ title: 'Véhicule supprimé' });
            } else {
                const data = await res.json();
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        } finally {
            setDeleteId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const isEdit = !!editingId;
            const url = '/api/driver/vehicles';
            const method = isEdit ? 'PUT' : 'POST';
            const body = isEdit ? { ...formData, id: editingId } : formData;

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok) {
                toast({ title: isEdit ? 'Véhicule modifié !' : 'Véhicule ajouté !' });
                if (isEdit) {
                    setVehicles(vehicles.map(v => v.id === editingId ? data : v));
                } else {
                    setVehicles([data, ...vehicles]);
                }
                resetForm();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast({ title: 'Erreur', description: error.message || "Echec", variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const VEHICLE_TYPES = ['RIDEL', 'FOURGON', 'BACHE', 'PLATEAU', 'PORTE_CONTENEUR', 'BENNE', 'FRIGO', 'AUTRE'];

    // Limit check: 1 vehicle max
    const canAdd = vehicles.length === 0 && !isAdding && !editingId;

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center gap-2">
                <Button variant="ghost" className="p-0 h-auto" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold">Mes Véhicules</h1>
            </div>

            {isAdding ? (
                <Card className="border-blue-200 shadow-md">
                    <CardHeader className="bg-blue-50/50 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg text-blue-800">{editingId ? 'Modifier Véhicule' : 'Nouveau Véhicule'}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Matricule / Plaque *</Label>
                                <Input
                                    placeholder="ex: 1234-A-50"
                                    required
                                    value={formData.plateNumber}
                                    onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Marque</Label>
                                    <Input
                                        placeholder="ex: Renault"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Modèle</Label>
                                    <Input
                                        placeholder="ex: Master"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.vehicleType}
                                    onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                                >
                                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Capacité / Tonnage</Label>
                                <Input
                                    placeholder="ex: 15T"
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Annuler</Button>
                                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Enregistrer</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {canAdd && (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setIsAdding(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un Véhicule
                        </Button>
                    )}
                    {!canAdd && vehicles.length >= 1 && (
                        <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200 text-center">
                            Limite atteinte (1 véhicule max).
                        </div>
                    )}
                </>
            )}

            {loading && !isAdding ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="space-y-4">
                    {vehicles.length === 0 && !isAdding && (
                        <div className="text-center text-gray-400 py-8 border-2 border-dashed rounded-xl">
                            <Truck className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>Aucun véhicule enregistré.</p>
                        </div>
                    )}

                    {vehicles.map((vehicle) => (
                        <Card key={vehicle.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start space-x-4">
                                        <div className="p-3 bg-gray-100 rounded-lg">
                                            <Truck className="h-6 w-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{vehicle.plateNumber}</h3>
                                            <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="outline" className="text-xs">{vehicle.vehicleType}</Badge>
                                                {vehicle.capacity && <Badge variant="secondary" className="text-xs">{vehicle.capacity}</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(vehicle)}>
                                            <Edit2 className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteId(vehicle.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce véhicule ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600" onClick={handleDelete}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
