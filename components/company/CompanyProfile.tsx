
'use client';

import { useState, useRef } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle, Camera, Upload } from 'lucide-react';

export default function CompanyProfile({ userAvatar, onAvatarUpdate }: { userAvatar?: string | null, onAvatarUpdate?: (url: string) => void }) {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [status, setStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });

    const [loading, setLoading] = useState(false);

    // Avatar state
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(userAvatar || null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setStatus({
                    type: 'error',
                    message: 'L\'image est trop volumineuse (max 5 Mo)'
                });
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;

        setUploadingAvatar(true);
        setStatus({ type: null, message: '' });

        try {
            const formData = new FormData();
            formData.append('file', avatarFile);

            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors du téléchargement');
            }

            setStatus({
                type: 'success',
                message: 'Photo de profil mise à jour !'
            });

            setAvatarFile(null);
            if (onAvatarUpdate && data.avatarUrl) {
                onAvatarUpdate(data.avatarUrl);
            }

        } catch (error) {
            setStatus({
                type: 'error',
                message: (error as Error).message
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: null, message: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setStatus({
                type: 'error',
                message: 'Les nouveaux mots de passe ne correspondent pas.'
            });
            return;
        }

        if (formData.newPassword.length < 6) {
            setStatus({
                type: 'error',
                message: 'Le mot de passe doit contenir au moins 6 caractères.'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors du changement de mot de passe');
            }

            setStatus({
                type: 'success',
                message: 'Mot de passe modifié avec succès !',
            });

            setFormData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
            });

        } catch (error) {
            setStatus({
                type: 'error',
                message: (error as Error).message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Mon Profil</h2>
                </div>

                <div className="space-y-8">
                    {/* Section Avatar */}
                    <div className="border-b pb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Camera className="w-5 h-5 text-gray-500" />
                            <h3 className="text-lg font-medium text-gray-900">Photo de profil</h3>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-gray-400" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition"
                                    title="Changer la photo"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <div className="text-sm text-gray-500 mb-2">
                                    <p>Format supporté: JPG, PNG</p>
                                    <p>Taille maximale: 5 Mo</p>
                                </div>
                                {avatarFile && (
                                    <button
                                        onClick={handleAvatarUpload}
                                        disabled={uploadingAvatar}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                                    >
                                        {uploadingAvatar ? 'Envoi...' : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                Enregistrer la photo
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section Changement de mot de passe */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="w-5 h-5 text-gray-500" />
                            <h3 className="text-lg font-medium text-gray-900">Sécurité</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ancien mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={formData.oldPassword}
                                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmer le nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {status.message && (
                                <div className={`p-4 rounded-lg flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {status.type === 'success' ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5" />
                                    )}
                                    <p className="text-sm font-medium">{status.message}</p>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        'Modification en cours...'
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Enregistrer le mot de passe
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
