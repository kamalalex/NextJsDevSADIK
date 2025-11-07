import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, hasRole } from '../../../lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    
    // Logique métier basée sur le rôle
    let demands;
    
    if (hasRole(user, ['SUPER_ADMIN', 'SUPER_ASSISTANT'])) {
      // Voir toutes les demandes
      demands = await prisma.demand.findMany({
        include: { user: true, company: true },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.companyId) {
      // Voir les demandes de sa compagnie
      demands = await prisma.demand.findMany({
        where: { companyId: user.companyId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Voir ses propres demandes
      demands = await prisma.demand.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(demands);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    console.error('Error fetching demands:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des demandes' },
      { status: 500 }
    );
  }
}