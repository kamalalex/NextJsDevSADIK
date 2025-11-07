import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ;

// Routes protégées par rôle
const roleRoutes = {
  '/admin': ['SUPER_ADMIN', 'SUPER_ASSISTANT', 'SUPER_COMMERCIAL', 'SUPER_FINANCE'],
  '/company': ['COMPANY_ADMIN', 'COMPANY_OPERATOR'],
  '/client': ['CLIENT_ADMIN', 'CLIENT_LOGISTICS'],
  '/driver': ['INDEPENDENT_DRIVER'],
};

// Export par défaut
export default function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Routes publiques - permettre l'accès
  if (pathname === '/login' || pathname === '/') {
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const redirectUrl = getDashboardUrl(decoded.role);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      } catch (error) {
        // Token invalide, supprimer le cookie et rester sur la page
        const response = NextResponse.next();
        response.cookies.delete('auth-token');
        return response;
      }
    }
    return NextResponse.next();
  }

  // Vérifier l'authentification pour les routes protégées
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Vérifier les permissions basées sur le rôle
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(decoded.role)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        break;
      }
    }

    // Ajouter les informations utilisateur aux headers pour les API routes
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-role', decoded.role);
      requestHeaders.set('x-company-id', decoded.companyId || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Token verification failed:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'SUPER_ASSISTANT':
    case 'SUPER_COMMERCIAL':
    case 'SUPER_FINANCE':
      return '/admin/dashboard';
    case 'COMPANY_ADMIN':
    case 'COMPANY_OPERATOR':
      return '/company/dashboard';
    case 'CLIENT_ADMIN':
    case 'CLIENT_LOGISTICS':
      return '/client/dashboard';
    case 'INDEPENDENT_DRIVER':
      return '/driver/dashboard';
    default:
      return '/dashboard';
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};