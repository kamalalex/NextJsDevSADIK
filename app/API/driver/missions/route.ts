import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET - Fetch assigned missions for the logged-in driver
export async function GET(request: NextRequest) {
    try {
        const authUser = verifyAuth(request);

        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is a driver
        if (authUser.role !== 'INDEPENDENT_DRIVER' && authUser.role !== 'EMPLOYED_DRIVER') {
            return NextResponse.json({ error: 'Forbidden: Access restricted to drivers' }, { status: 403 });
        }

        // Find the Driver record associated with this User
        const driver = await prisma.driver.findUnique({
            where: { userId: authUser.userId },
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');

        // Build query to find operations
        // 1. Directly assigned via assignedDriverId
        // 2. Assigned via DriverAssignment (DriverAssignment table)

        // We want operations where:
        // (assignedDriverId == driver.id) OR (DriverAssignment.driverId == driver.id)

        // Note: Prisma doesn't easily support top-level OR between relation and fields in this specific way without careful construction,
        // but usually assignedDriverId is the "Main" driver.
        // However, for "Accept/Reject", we likely use DriverAssignment.

        // Let's fetch Operations where:
        const whereClause: any = {
            OR: [
                { assignedDriverId: driver.id },
                {
                    assignedDrivers: {
                        some: {
                            driverId: driver.id
                        }
                    }
                }
            ]
        };

        if (statusFilter) {
            // If filtering by mission status (e.g. pending acceptance vs active)
            // This maps to OperationStatus OR DriverAssignmentStatus depending on context.
            // For simplicity, let's filter the Operation.status
            whereClause.status = statusFilter;
        }

        const operations = await prisma.operation.findMany({
            where: whereClause,
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
                assignedDrivers: {
                    where: {
                        driverId: driver.id
                    },
                    select: {
                        status: true,
                        assignedPrice: true
                    }
                }
            },
            orderBy: {
                operationDate: 'asc' // Upcoming first
            }
        });

        return NextResponse.json(operations);

    } catch (error: any) {
        console.error('Error fetching driver missions:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
