import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            companyName,
            phone,
            email,
            address,
            companyId: subcontractorCompanyId, // RC/IF
            paymentWithInvoice,
            isIndependent // New flag
        } = body;

        const sadicCode = `SUB-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

        // Transaction to ensure both records are created or neither
        const result = await prisma.$transaction(async (tx) => {
            const subcontractor = await tx.subcontractor.create({
                data: {
                    name,
                    companyName,
                    phone,
                    email: email || null,
                    address: address || null,
                    companyId: subcontractorCompanyId || null,
                    paymentWithInvoice: !!paymentWithInvoice,
                    transportCompanyId: user.companyId!,
                    sadicCode
                }
            });

            // If Independent, create a Driver account linked to this subcontractor
            if (isIndependent) {
                // Check if user already exists
                let existingUser = null;
                if (email) {
                    existingUser = await tx.user.findUnique({ where: { email } });
                }

                let userId = existingUser?.id;

                if (!existingUser && email) {
                    const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash('123456', 10)); // Default password
                    const newUser = await tx.user.create({
                        data: {
                            email,
                            password: hashedPassword,
                            name: name || companyName,
                            role: 'INDEPENDENT_DRIVER',
                            phone: phone
                        }
                    });
                    userId = newUser.id;
                }

                await tx.driver.create({
                    data: {
                        name: name || companyName,
                        phone: phone,
                        email: email,
                        license: 'PENDING', // Placeholder
                        status: 'ACTIVE',
                        isIndependent: true,
                        subcontractorId: subcontractor.id,
                        userId: userId
                    }
                });
            }

            return subcontractor;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating subcontractor:', error);
        return NextResponse.json(
            { error: 'Error creating subcontractor' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = verifyAuth(request);
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const subcontractors = await prisma.subcontractor.findMany({
            where: {
                transportCompanyId: user.companyId,
                status: 'ACTIVE'
            },
            include: {
                vehicles: true,
                drivers: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(subcontractors);
    } catch (error) {
        console.error('Error fetching subcontractors:', error);
        return NextResponse.json(
            { error: 'Error fetching subcontractors' },
            { status: 500 }
        );
    }
}
