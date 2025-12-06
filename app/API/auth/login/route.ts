import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'votre-super-secret-jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Tentative de connexion pour:', email);
    console.log('📡 DATABASE_URL existe:', !!process.env.DATABASE_URL);

    // Validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    // Chercher l'utilisateur
    console.log('🔍 Recherche utilisateur dans MongoDB...');
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    console.log('👤 Utilisateur trouvé:', user ? user.email : 'AUCUN');

    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({
        error: 'Votre compte est en attente de validation par un administrateur.'
      }, { status: 403 });
    }

    // Vérifier le mot de passe
    console.log('🔑 Comparaison mot de passe...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('✅ Mot de passe valide:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    // Générer le token
    const tokenData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      name: user.name
    };

    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '24h' });

    const response = NextResponse.json({
      message: 'Connexion réussie',
      user: { ...user, password: undefined },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    console.log('🎉 Connexion réussie pour:', user.email);
    return response;

  } catch (error) {
    console.error('❌ ERREUR Login:', error);
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}