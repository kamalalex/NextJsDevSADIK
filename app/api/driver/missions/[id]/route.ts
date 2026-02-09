import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET - Fetch single mission details for the logged-in driver including tracking history
export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const authUser = verifyAuth(request);

        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is a driver
        if (authUser.role !== 'INDEPENDENT_DRIVER' && authUser.role !== 'EMPLOYED_DRIVER') {
            return NextResponse.json({ error: 'Forbidden: Access restricted to drivers' }, { status: 403 });
        }

        const { id } = await params;

        // Find the Driver record associated with this User
        const driver = await prisma.driver.findUnique({
            where: { userId: authUser.userId },
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const operation = await prisma.operation.findUnique({
            where: { id },
            include: {
                assignedVehicle: {
                    select: {
                        plateNumber: true,
                        vehicleType: true,
                        brand: true
                    }
                },
                client: {
                    select: {
                        name: true,
                        phone: true
                    }
                },
                transportCompany: {
                    select: {
                        name: true,
                        phone: true
                    }
                },
                documents: true,
                trackingUpdates: {
                    orderBy: { createdAt: 'desc' }
                },
                assignedDrivers: {
                    where: {
                        driverId: driver.id
                    },
                    select: {
                        status: true,
                        assignedPrice: true
                    }
                }
            }
        });

        if (!operation) {
            return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
        }

        // Verify assignment access
        const isDirectlyAssigned = operation.assignedDriverId === driver.id;
        const isAssignedViaRelation = operation.assignedDrivers.length > 0;

        if (!isDirectlyAssigned && !isAssignedViaRelation) {
            return NextResponse.json({ error: 'Forbidden: Not assigned to this mission' }, { status: 403 });
        }

        // Restriction: Driver cannot view details if mission is completed (DELIVERED or CANCELLED)
        if (operation.status === 'DELIVERED' || operation.status === 'CANCELLED') {
            return NextResponse.json({ error: 'Mission terminée. Accès aux détails restreint.' }, { status: 403 });
        }

        return NextResponse.json(operation);

    } catch (error: any) {
        console.error('Error fetching driver mission details:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
