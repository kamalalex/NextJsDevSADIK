
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Lister les utilisateurs de l'entreprise
export async function GET(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload || !userPayload.companyId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: {
                companyId: userPayload.companyId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                avatar: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        return NextResponse.json(users);

    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST: Créer un nouvel utilisateur (Opérateur)
export async function POST(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);

        // Vérification des droits : Doit être ADMIN de l'entreprise
        if (!userPayload || !userPayload.companyId || userPayload.role !== 'COMPANY_ADMIN') {
            return NextResponse.json(
                { error: 'Seuls les administrateurs peuvent ajouter des utilisateurs' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Tous les champs sont requis' },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['COMPANY_ADMIN', 'COMPANY_OPERATOR'];
        const userRole = validRoles.includes(role) ? role : 'COMPANY_OPERATOR';

        // Vérifier si l'email existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Cet email est déjà utilisé' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: userRole,
                isActive: true, // Approuvé par défaut car créé par l'admin
                companyId: userPayload.companyId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            }
        });

        return NextResponse.json(newUser, { status: 201 });

    } catch (error) {
        console.error('Erreur création utilisateur:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
