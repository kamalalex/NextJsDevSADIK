import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ 
    message: 'Déconnexion réussie' 
  });

  // Supprimer le cookie d'auth
  response.cookies.set({
    name: 'auth-token',
    value: '',
    path: '/',
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}