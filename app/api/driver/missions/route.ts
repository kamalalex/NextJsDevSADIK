import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status'); // 'CURRENT' or 'COMPLETED'

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: userPayload.userId },
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        let statusCondition = {};

        if (statusFilter === 'CURRENT') {
            statusCondition = {
                in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
            };
        } else if (statusFilter === 'COMPLETED') {
            statusCondition = {
                in: ['DELIVERED', 'CANCELLED']
            };
        }

        const operations = await prisma.operation.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { assignedDriverId: driver.id },
                            { assignedDrivers: { some: { driverId: driver.id } } }
                        ]
                    },
                    statusFilter ? { status: statusCondition } : {}
                ]
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true
                    }
                },
                documents: true,
                trackingUpdates: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                assignedVehicle: {
                    select: {
                        plateNumber: true,
                        model: true
                    }
                }
            },
            orderBy: {
                operationDate: 'desc'
            }
        });

        return NextResponse.json(operations);

    } catch (error) {
        console.error('Error fetching driver missions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
