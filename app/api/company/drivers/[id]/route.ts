import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const {
            name,
            email,
            phone,
            license,
            status,
            cin,
            licenseDate,
            documents,
            subcontractorId,
            idCardFront,
            idCardBack,
            licenseFront,
            licenseBack,
            licenseCategory
        } = body;

        const existingDriver = await prisma.driver.findFirst({
            where: {
                id,
                OR: [
                    { companyId: user.companyId },
                    { subcontractor: { transportCompanyId: user.companyId } }
                ]
            }
        });

        if (!existingDriver) {
            return NextResponse.json({ error: 'Chauffeur non trouvé' }, { status: 404 });
        }

        if (email && email !== existingDriver.email) {
            const emailExists = await prisma.driver.findFirst({
                where: { email }
            });
            if (emailExists) {
                return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
            }
        }

        const data: any = {
            name,
            email,
            phone,
            license,
            status,
            cin,
            licenseDate: licenseDate ? new Date(licenseDate) : null,
            documents: documents || [],
            idCardFront,
            idCardBack,
            licenseFront,
            licenseBack,
            licenseCategory
        };

        if (subcontractorId) {
            data.subcontractorId = subcontractorId;
            data.companyId = null;
        } else {
            data.companyId = user.companyId;
            data.subcontractorId = null;
        }

        const updatedDriver = await prisma.driver.update({
            where: { id },
            data
        });

        return NextResponse.json(updatedDriver);
    } catch (error) {
        console.error('Error updating driver:', error);
        return NextResponse.json({ error: 'Error updating driver' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const existingDriver = await prisma.driver.findFirst({
            where: {
                id,
                OR: [
                    { companyId: user.companyId },
                    { subcontractor: { transportCompanyId: user.companyId } }
                ]
            }
        });

        if (!existingDriver) {
            return NextResponse.json({ error: 'Chauffeur non trouvé' }, { status: 404 });
        }

        const operationsCount = await prisma.operation.count({
            where: { assignedDriverId: id }
        });

        if (operationsCount > 0) {
            return NextResponse.json(
                { error: 'Impossible de supprimer ce chauffeur car il est lié à des opérations existantes.' },
                { status: 400 }
            );
        }

        await prisma.driver.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Chauffeur supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        return NextResponse.json({ error: 'Error deleting driver' }, { status: 500 });
    }
}
