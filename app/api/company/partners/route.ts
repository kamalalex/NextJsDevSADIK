
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET: Lister mes partenaires (entreprises que j'ai ajoutées)
export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const partners = await prisma.subcontractor.findMany({
            where: {
                transportCompanyId: user.companyId,
                status: 'ACTIVE'
            },
            include: {
                linkedCompany: {
                    select: {
                        id: true,
                        name: true,
                        sadicCode: true,
                        type: true
                    }
                }
            }
        });

        return NextResponse.json(partners);

    } catch (error) {
        console.error('Error fetching partners:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
