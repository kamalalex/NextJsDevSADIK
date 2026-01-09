import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET - Fetch driver profile
export async function GET(request: NextRequest) {
    try {
        const authUser = verifyAuth(request);

        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (authUser.role !== 'INDEPENDENT_DRIVER' && authUser.role !== 'EMPLOYED_DRIVER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: authUser.userId },
            include: {
                vehicles: true, // Show owned vehicles
                user: {
                    select: {
                        email: true,
                        avatar: true
                    }
                },
                company: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        // Auto-generate SADIC code if missing for Independent Drivers
        if (driver.isIndependent && !driver.sadicCode) {
            const generatedCode = `DRV-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

            const updatedDriver = await prisma.driver.update({
                where: { id: driver.id },
                data: { sadicCode: generatedCode },
                include: {
                    vehicles: true,
                    user: { select: { email: true, avatar: true } },
                    company: { select: { name: true, phone: true } }
                }
            });
            return NextResponse.json(updatedDriver);
        }

        return NextResponse.json(driver);

    } catch (error: any) {
        console.error('Error fetching driver profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update driver profile (Independent only mostly)
export async function PUT(request: NextRequest) {
    try {
        const authUser = verifyAuth(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Only allow updating certain fields
        const allowedUpdates = ['phone', 'license', 'professionalCard', 'name', 'cin', 'licenseCategory'];

        const updateData: any = {};
        for (const key of allowedUpdates) {
            if (body[key] !== undefined) updateData[key] = body[key];
        }

        const driver = await prisma.driver.update({
            where: { userId: authUser.userId },
            data: updateData
        });

        return NextResponse.json(driver);

    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
