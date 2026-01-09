'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogOut, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const { toast } = useToast();

    useEffect(() => {
        fetch('/api/driver/profile')
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                setFormData(data); // Init form data
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/auth/login';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/driver/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const updated = await res.json();
            if (res.ok) {
                setProfile(updated);
                setIsEditing(false);
                toast({ title: 'Profil mis à jour' });
            } else {
                throw new Error(updated.error);
            }
        } catch (error) {
            toast({ title: 'Erreur', description: 'Impossible de mettre à jour le profil', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profile) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!profile) return <div className="text-center p-8">Profil non disponible</div>;

    const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'EB', 'EC', 'ED'];

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Mon Profil</h1>
                {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-1" /> Modifier
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setFormData(profile); }}>
                            <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4 mr-1" /> Enregistrer
                        </Button>
                    </div>
                )}
            </div>

            <Card>
                <CardContent className="pt-6 flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={profile.user?.avatar} />
                        <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>

                    {isEditing ? (
                        <div className="w-full space-y-2">
                            <Label>Nom Complet</Label>
                            <Input
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="text-center font-semibold"
                            />
                        </div>
                    ) : (
                        <h2 className="text-xl font-semibold text-center">{profile.name}</h2>
                    )}

                    <p className="text-gray-500 text-sm mt-1">{profile.isIndependent ? 'Chauffeur Indépendant' : 'Chauffeur Salarié'}</p>

                    {profile.sadicCode && (
                        <div className="mt-2 bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm font-mono border border-blue-200">
                            Code: {profile.sadicCode}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg">Informations Personnelles</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                            <Label>Téléphone</Label>
                            {isEditing ? (
                                <Input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            ) : (
                                <p className="font-medium p-2 bg-gray-50 rounded-md">{profile.phone}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label>Numéro CIN</Label>
                            {isEditing ? (
                                <Input value={formData.cin || ''} onChange={(e) => setFormData({ ...formData, cin: e.target.value })} />
                            ) : (
                                <p className="font-medium p-2 bg-gray-50 rounded-md">{profile.cin || 'Non renseigné'}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label>Numéro de Permis</Label>
                            {isEditing ? (
                                <Input value={formData.license || ''} onChange={(e) => setFormData({ ...formData, license: e.target.value })} />
                            ) : (
                                <p className="font-medium p-2 bg-gray-50 rounded-md">{profile.license || 'Non renseigné'}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label>Catégorie de Permis</Label>
                            {isEditing ? (
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.licenseCategory || ''}
                                    onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                                >
                                    <option value="">Sélectionner...</option>
                                    {LICENSE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="font-medium p-2 bg-gray-50 rounded-md">{profile.licenseCategory || 'Non renseigné'}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label>Email (Compte)</Label>
                            <p className="font-medium p-2 bg-gray-50 rounded-md text-gray-500">{profile.user?.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button
                variant="outline"
                className="w-full h-12 text-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                onClick={() => window.location.href = '/driver/vehicles'}
            >
                🚛 Gérer mes Véhicules
            </Button>

            <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Se Déconnecter
            </Button>
        </div>
    );
}
