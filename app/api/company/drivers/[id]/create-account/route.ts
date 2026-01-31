import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload || !userPayload.companyId) { // Must be a company user
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const driverId = params.id;

        // 1. Fetch the driver and ensure they belong to the requesting company
        const driver = await prisma.driver.findFirst({
            where: {
                id: driverId,
                companyId: userPayload.companyId, // Security check
            },
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver not found found or access denied.' }, { status: 404 });
        }

        if (driver.userId) {
            return NextResponse.json({ error: 'This driver already has an account.' }, { status: 400 });
        }

        if (!driver.email) {
            return NextResponse.json({ error: 'Driver must have an email address to create an account.' }, { status: 400 });
        }

        // 2. Check if a user with this email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: driver.email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
        }

        // 3. Create the User account
        const defaultPassword = await bcrypt.hash('123456', 10); // Default password

        // Use a transaction to ensure both User creation and Driver update happen
        await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: driver.email!.toLowerCase().trim(),
                    password: defaultPassword,
                    name: driver.name,
                    role: 'EMPLOYED_DRIVER', // Role for company drivers
                    companyId: userPayload.companyId,
                    phone: driver.phone,
                },
            });

            // 4. Link the Driver to the new User
            await tx.driver.update({
                where: { id: driverId },
                data: {
                    userId: newUser.id,
                },
            });
        });

        return NextResponse.json({ success: true, message: 'Driver account created successfully.' });

    } catch (error) {
        console.error('Error creating driver account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
