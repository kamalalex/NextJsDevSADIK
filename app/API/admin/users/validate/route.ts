import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: { isActive: false },
            include: {
                company: true,
                driver: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: Request) {
    try {
        const { userId, action } = await request.json();

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (action === 'approve') {
            // Start transaction to update User and potentially Company/Driver
            await prisma.$transaction(async (tx) => {
                // 1. Activate User
                const user = await tx.user.update({
                    where: { id: userId },
                    data: { isActive: true },
                    include: { company: true, driver: true }
                });

                // 2. If Company, activate and set Trial
                if (user.companyId) {
                    const trialEnd = new Date();
                    trialEnd.setDate(trialEnd.getDate() + 14); // 14 days trial default

                    await tx.company.update({
                        where: { id: user.companyId },
                        data: {
                            isActive: true,
                            subscriptionStatus: 'TRIAL',
                            trialEndsAt: trialEnd
                        }
                    });
                }

                // 3. If Driver, activate
                if (user.driver) {
                    await tx.driver.update({
                        where: { id: user.driver.id },
                        data: { status: 'ACTIVE' }
                    });
                }
            });

            return NextResponse.json({ message: 'User approved successfully' });
        } else if (action === 'reject') {
            // Delete user and associated data? Or just mark as rejected?
            // For now, let's delete to keep it clean, assuming no other data is linked yet.
            // In a real system, you might want to soft delete or keep a record.

            const user = await prisma.user.findUnique({ where: { id: userId }, include: { company: true, driver: true } });

            if (user) {
                await prisma.$transaction(async (tx) => {
                    if (user.companyId) {
                        await tx.company.delete({ where: { id: user.companyId } });
                    }
                    if (user.driver) {
                        await tx.driver.delete({ where: { id: user.driver.id } });
                    }
                    await tx.user.delete({ where: { id: userId } });
                });
            }

            return NextResponse.json({ message: 'User rejected and deleted' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error processing user validation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
