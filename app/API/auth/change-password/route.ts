
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'votre-super-secret-jwt';

interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

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

        let decodedToken: TokenPayload;
        try {
            decodedToken = jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch {
            return NextResponse.json(
                { error: 'Session invalide' },
                { status: 401 }
            );
        }

        const { oldPassword, newPassword } = await request.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Tous les champs sont requis' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
                { status: 400 }
            );
        }

        // 2. Récupérer l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: decodedToken.userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // 3. Vérifier l'ancien mot de passe
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Ancien mot de passe incorrect' },
                { status: 400 }
            );
        }

        // 4. Hasher et sauvegarder le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ message: 'Mot de passe modifié avec succès' });

    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
