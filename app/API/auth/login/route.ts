import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET ;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation basique
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Identifiants invalides ou compte désactivé' },
        { status: 401 }
      );
    }

    // Vérifier si la compagnie est active (si applicable)
    if (user.companyId && user.company && !user.company.isActive) {
      return NextResponse.json(
        { error: 'Votre compagnie est désactivée' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Données pour le token JWT
    const tokenData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyType: user.company?.type,
    };

    // Générer le token JWT
    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '24h' });

    // Retourner la réponse sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: 'Connexion réussie',
      user: userWithoutPassword,
    });

    // Définir le cookie HTTP-only
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 heures
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}