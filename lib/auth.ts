// lib/auth.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
  name: string;
}

export function verifyAuth(request: NextRequest): AuthUser | null {
  // Essayer différents moyens de récupérer le token
  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('auth-token')?.value ||
    request.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    console.error('❌ Erreur vérification token:', error);
    return null;
  }
}

export function requireAuth(request: NextRequest): AuthUser {
  const user = verifyAuth(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

export function hasRole(user: AuthUser, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}

// Fonction utilitaire pour créer des tokens (si besoin)
export function createAuthToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });
}

// Fonction pour récupérer l'utilisateur depuis la base (si besoin)
export async function getUserFromToken(request: NextRequest) {
  const authUser = verifyAuth(request);
  if (!authUser) return null;

  // Implémentez la logique pour récupérer l'utilisateur depuis la base
  // const user = await prisma.user.findUnique({...});
  // return user;

  return authUser;
}