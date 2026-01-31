import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const missionId = params.id;
        const body = await request.json();
        const { step, note, lat, lng } = body;

        // Verify driver owns this mission
        const driver = await prisma.driver.findUnique({
            where: { userId: userPayload.userId },
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        const operation = await prisma.operation.findFirst({
            where: {
                id: missionId,
                OR: [
                    { assignedDriverId: driver.id },
                    { assignedDrivers: { some: { driverId: driver.id } } }
                ]
            }
        });

        if (!operation) {
            return NextResponse.json({ error: 'Mission not found or unauthorized' }, { status: 403 });
        }

        // Logic for each step to update Operation Status and create TrackingUpdate
        let newOperationStatus = undefined;
        let trackingNote = note || '';

        switch (step) {
            case 'HEADING_TO_PICKUP':
                newOperationStatus = 'IN_PROGRESS';
                trackingNote = '🚚 En route vers le point de chargement';
                break;
            case 'ARRIVED_PICKUP':
                trackingNote = '📍 Arrivé au point de chargement';
                break;
            case 'GOODS_LOADED':
                trackingNote = '📦 Marchandise chargée';
                break;
            case 'HEADING_TO_DELIVERY':
                trackingNote = '🚚 En route vers le point de livraison';
                break;
            case 'ARRIVED_DELIVERY':
                trackingNote = '📍 Arrivé au point de livraison';
                break;
            case 'DELIVERED':
                newOperationStatus = 'DELIVERED';
                trackingNote = '✅ Marchandise livrée - Mission terminée';
                break;
            default:
                // Generic update
                break;
        }

        // 1. Update Operation Status if it changes
        if (newOperationStatus) {
            await prisma.operation.update({
                where: { id: missionId },
                data: {
                    status: newOperationStatus as any,
                    // Update timestamps if relevant
                    startedAt: newOperationStatus === 'IN_PROGRESS' && !operation.startedAt ? new Date() : undefined,
                    deliveredAt: newOperationStatus === 'DELIVERED' ? new Date() : undefined
                }
            });
        }

        // 2. Create Tracking Update
        const locationJson = (lat && lng) ? { lat, lng } : undefined;

        await prisma.trackingUpdate.create({
            data: {
                operationId: missionId,
                status: (newOperationStatus || operation.status) as any,
                note: trackingNote,
                location: locationJson as any,
                recordedBy: userPayload.name || 'Chauffeur'
            }
        });

        // 3. Update Current Location on Operation (for real-time map)
        if (locationJson) {
            await prisma.operation.update({
                where: { id: missionId },
                data: {
                    currentLocation: {
                        lat,
                        lng,
                        address: 'En mouvement', // Could inverse geocode if needed
                        timestamp: new Date().toISOString()
                    }
                }
            });
        }

        return NextResponse.json({ success: true, status: newOperationStatus });

    } catch (error) {
        console.error('Error updating mission status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
