
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || user.role !== 'COMPANY_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sadicCode } = await request.json();

        if (!sadicCode) {
            return NextResponse.json({ error: 'Code système requis' }, { status: 400 });
        }

        // 1. Find the target company by code
        const targetCompany = await prisma.company.findUnique({
            where: { sadicCode }
        });

        if (!targetCompany) {
            return NextResponse.json({ error: 'Aucune entreprise trouvée avec ce code' }, { status: 404 });
        }

        // 2. Prevent self-linking
        if (targetCompany.id === user.companyId) {
            return NextResponse.json({ error: 'Vous ne pouvez pas vous lier à vous-même' }, { status: 400 });
        }

        // 3. Check if already linked as a subcontractor
        const existingLink = await prisma.subcontractor.findFirst({
            where: {
                transportCompanyId: user.companyId!,
                linkedCompanyId: targetCompany.id
            }
        });

        if (existingLink) {
            return NextResponse.json({ error: 'Cette entreprise est déjà liée en tant que sous-traitant' }, { status: 400 });
        }

        // 4. Create the Subcontractor entry
        const newSubcontractor = await prisma.subcontractor.create({
            data: {
                name: targetCompany.contactPerson || targetCompany.name,
                companyName: targetCompany.name,
                phone: targetCompany.phone || '',
                email: targetCompany.email || '',
                address: targetCompany.address || '',
                companyId: targetCompany.ice || '', // Use ICE as the default ID if available
                paymentWithInvoice: true,
                transportCompanyId: user.companyId!,
                linkedCompanyId: targetCompany.id
            }
        });

        return NextResponse.json(newSubcontractor);

    } catch (error) {
        console.error('Error linking subcontractor:', error);
        return NextResponse.json({ error: 'Erreur lors du lien' }, { status: 500 });
    }
}
