import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
  companyType?: string;
}

export function verifyAuth(request: NextRequest): AuthUser | null {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
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