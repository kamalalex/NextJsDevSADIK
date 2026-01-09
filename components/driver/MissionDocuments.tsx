"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Upload, Loader2, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Document {
    id: string;
    type: string;
    url: string;
    filename: string;
    createdAt: string;
}

const DOCUMENT_TYPES = [
    { value: "BON_LIVRAISON", label: "Bon de Livraison (BL)" },
    { value: "BON_COMMANDE", label: "Bon de Commande" },
    { value: "PHOTO_CHARGEMENT", label: "Photo Chargement" },
    { value: "PHOTO_DECHARGEMENT", label: "Photo Déchargement" },
    { value: "FACTURE", label: "Facture" },
    { value: "SCELES", label: "Scelés" },
    { value: "AUTRE", label: "Autre" },
];

export function MissionDocuments({ missionId }: { missionId: string }) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const { toast } = useToast();

    const [selectedType, setSelectedType] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/operations/${missionId}/documents`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (missionId) {
            fetchDocuments();
        }
    }, [missionId]);

    const handleUpload = async () => {
        if (!file || !selectedType) {
            toast({ title: "Erreur", description: "Veuillez sélectionner un fichier et un type de document", variant: "destructive" });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", selectedType);

        try {
            const res = await fetch(`/api/operations/${missionId}/documents`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                toast({ title: "Succès", description: "Document téléchargé avec succès" });
                setModalOpen(false);
                setFile(null);
                setSelectedType("");
                fetchDocuments();
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            toast({ title: "Erreur", description: "Échec du téléchargement", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <Loader2 className="h-6 w-6 animate-spin mx-auto" />;

    return (
        <div className="space-y-4">
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-dashed">
                        <Upload className="mr-2 h-4 w-4" /> Ajouter un Document
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter un document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Type de Document</Label>
                            <Select onValueChange={setSelectedType} value={selectedType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner le type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOCUMENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Fichier</Label>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </div>
                        <Button onClick={handleUpload} className="w-full" disabled={uploading}>
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Télécharger
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="space-y-2">
                {documents.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-4">Aucun document attaché.</p>
                ) : (
                    documents.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden">
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {DOCUMENT_TYPES.find(t => t.value === doc.type)?.label || doc.type}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{doc.filename}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a href={doc.url} target="_blank" rel="noreferrer">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </a>
                                    <a href={doc.url} download>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
