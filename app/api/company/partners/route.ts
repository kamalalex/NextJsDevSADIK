
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
                OR: [
                    { transportCompanyId: user.companyId },
                    { linkedCompanyId: user.companyId }
                ],
                status: 'ACTIVE'
            },
            include: {
                linkedCompany: {
                    select: {
                        id: true,
                        name: true,
                        sadicCode: true,
                        type: true,
                        phone: true,
                        email: true
                    }
                },
                transportCompany: {
                    select: {
                        id: true,
                        name: true,
                        sadicCode: true,
                        type: true,
                        phone: true,
                        email: true
                    }
                }
            }
        });

        // Map results to a unified structure
        const formattedPartners = partners.map(p => {
            const isTransport = p.transportCompanyId === user.companyId;
            const partnerCompany = isTransport ? p.linkedCompany : p.transportCompany;

            return {
                id: p.id,
                name: partnerCompany?.name, // Use contact person or company name
                companyName: partnerCompany?.name,
                phone: partnerCompany?.phone,
                email: partnerCompany?.email,
                address: '',
                status: p.status,
                linkedCompany: partnerCompany, // Keep structure for frontend compatibility
                // For client dashboard compatibility
                transportCompany: partnerCompany
            };
        });

        return NextResponse.json(formattedPartners);

        return NextResponse.json(partners);

    } catch (error) {
        console.error('Error fetching partners:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
