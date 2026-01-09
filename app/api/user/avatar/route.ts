
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'votre-super-secret-jwt';

// Désactiver le parseur de corps par défaut de Next.js pour gérer le FormData manuellement si nécessaire,
// mais avec l'App Router, NextRequest.formData() fonctionne bien.

export async function POST(request: NextRequest) {
    try {
        // 1. Authentification
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        let decodedToken: any;
        try {
            decodedToken = jwt.verify(token, JWT_SECRET);
        } catch {
            return NextResponse.json(
                { error: 'Session invalide' },
                { status: 401 }
            );
        }

        const userId = decodedToken.userId;

        // 2. Gestion du fichier
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'Aucun fichier fourni' },
                { status: 400 }
            );
        }

        // Validation basique
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Le fichier doit être une image' },
                { status: 400 }
            );
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return NextResponse.json(
                { error: 'L\'image ne doit pas dépasser 5 Mo' },
                { status: 400 }
            );
        }

        // Préparer le dossier
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Chemin relatif pour l'accès web
        const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');

        // Créer le dossier s'il n'existe pas
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (err) {
            console.error('Erreur création dossier:', err);
        }

        // Nom du fichier unique
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `${userId}-${timestamp}.${extension}`;
        const filepath = path.join(uploadDir, filename);

        // Écrire le fichier
        await writeFile(filepath, buffer);

        const publicUrl = `/uploads/avatars/${filename}`;

        // 3. Mettre à jour l'utilisateur
        await prisma.user.update({
            where: { id: userId },
            data: { avatar: publicUrl },
        });

        return NextResponse.json({
            message: 'Avatar mis à jour avec succès',
            avatarUrl: publicUrl
        });

    } catch (error) {
        console.error('Erreur upload avatar:', error);
        return NextResponse.json(
            { error: 'Erreur lors du téléchargement de l\'image' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
