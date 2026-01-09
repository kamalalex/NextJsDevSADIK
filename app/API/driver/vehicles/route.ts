import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET - List vehicles for the driver
export async function GET(request: NextRequest) {
    try {
        const authUser = verifyAuth(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const driver = await prisma.driver.findUnique({
            where: { userId: authUser.userId }
        });

        if (!driver) return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });

        const vehicles = await prisma.vehicle.findMany({
            where: { driverId: driver.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Add a new vehicle
export async function POST(request: NextRequest) {
    try {
        const authUser = verifyAuth(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (authUser.role !== 'INDEPENDENT_DRIVER') {
            return NextResponse.json({ error: 'Only independent drivers can add vehicles' }, { status: 403 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: authUser.userId }
        });

        if (!driver) return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });

        const body = await request.json();
        const { plateNumber, model, brand, vehicleType, capacity } = body;

        // Basic validation
        if (!plateNumber || !vehicleType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Limit Check: Independent drivers can only have 1 vehicle
        const vehicleCount = await prisma.vehicle.count({
            where: { driverId: driver.id, status: 'ACTIVE' }
        });

        if (vehicleCount >= 1) {
            return NextResponse.json({ error: 'Limite atteinte: Vous ne pouvez ajouter qu\'un seul véhicule.' }, { status: 403 });
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                plateNumber,
                model: model || 'Unknown',
                brand,
                vehicleType,
                capacity: capacity || '0',
                driverId: driver.id,
                status: 'ACTIVE'
            }
        });

        return NextResponse.json(vehicle, { status: 201 });

    } catch (error: any) {
        console.error('Error creating vehicle:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Vehicle with this plate number already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update a vehicle
export async function PUT(request: NextRequest) {
    try {
        const authUser = verifyAuth(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const driver = await prisma.driver.findUnique({ where: { userId: authUser.userId } });
        if (!driver) return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });

        const body = await request.json();
        const { id, plateNumber, model, brand, vehicleType, capacity } = body;

        if (!id) return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });

        // Verify ownership
        const existingVehicle = await prisma.vehicle.findFirst({
            where: { id, driverId: driver.id }
        });

        if (!existingVehicle) return NextResponse.json({ error: 'Vehicle not found or not owned by you' }, { status: 404 });

        const updatedVehicle = await prisma.vehicle.update({
            where: { id },
            data: {
                plateNumber,
                model,
                brand,
                vehicleType,
                capacity
            }
        });

        return NextResponse.json(updatedVehicle);

    } catch (error: any) {
        console.error('Error updating vehicle:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete (or archive) a vehicle
export async function DELETE(request: NextRequest) {
    try {
        const authUser = verifyAuth(request);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const driver = await prisma.driver.findUnique({ where: { userId: authUser.userId } });
        if (!driver) return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });

        // Verify ownership
        const existingVehicle = await prisma.vehicle.findFirst({
            where: { id, driverId: driver.id }
        });

        if (!existingVehicle) return NextResponse.json({ error: 'Vehicle not found or not owned by you' }, { status: 404 });

        await prisma.vehicle.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error deleting vehicle:', error);
        if (error.code === 'P2003') { // FK constraint
            return NextResponse.json({ error: 'Ce véhicule est utilisé dans des opérations et ne peut pas être supprimé.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
