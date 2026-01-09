import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { OperationStatus, DriverAssignmentStatus } from '@prisma/client';

// PATCH - Update mission status by driver
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = verifyAuth(request);

        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (authUser.role !== 'INDEPENDENT_DRIVER' && authUser.role !== 'EMPLOYED_DRIVER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: operationId } = await params;

        const body = await request.json();
        const { action, location } = body;
        // action: 'ACCEPT', 'REJECT', 'START', 'ARRIVED_LOADING', 'LOADED', 'ARRIVED_UNLOADING', 'DELIVERED'

        const driver = await prisma.driver.findUnique({
            where: { userId: authUser.userId },
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const operation = await prisma.operation.findUnique({
            where: { id: operationId },
            include: {
                assignedDrivers: {
                    where: { driverId: driver.id }
                }
            }
        });

        if (!operation) {
            return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
        }

        // Verify assignment
        const isDirectlyAssigned = operation.assignedDriverId === driver.id;
        const assignmentRecord = operation.assignedDrivers[0];

        if (!isDirectlyAssigned && !assignmentRecord) {
            return NextResponse.json({ error: 'Not assigned to this operation' }, { status: 403 });
        }

        // State Machine Logic
        let updateData: any = {};
        let assignmentUpdateData: any = {};

        switch (action) {
            case 'ACCEPT':
                if (assignmentRecord) {
                    assignmentUpdateData.status = 'CONFIRME';
                }
                if (operation.status === 'PENDING') {
                    updateData.status = 'CONFIRMED'; // Or keep it pending until admin confirms?
                    // Let's assume Driver accept -> Confirmed for now if simplified
                }
                break;

            case 'REJECT':
                if (assignmentRecord) {
                    assignmentUpdateData.status = 'ANNULE'; // Or REJETE if enum existed
                }
                // Remove direct assignment if any?
                if (isDirectlyAssigned) {
                    updateData.assignedDriverId = null;
                }
                break;

            case 'START':
                updateData.status = 'IN_PROGRESS';
                updateData.startedAt = new Date();
                if (assignmentRecord) {
                    assignmentUpdateData.status = 'EN_COURS';
                }
                break;

            case 'ARRIVED_LOADING':
                // Log this in tracking updates?
                break;

            case 'LOADED':
                // Maybe status stays IN_PROGRESS but we note it?
                // Or if we had granular status. For now, just tracking update.
                break;

            case 'DELIVERED':
                updateData.status = 'DELIVERED';
                updateData.deliveredAt = new Date();
                if (assignmentRecord) {
                    assignmentUpdateData.status = 'TERMINE';
                }
                break;

            case 'UPDATE':
                // Just a tracking update, no status change
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Transaction to update op, assignment, and tracking
        await prisma.$transaction(async (tx) => {
            if (Object.keys(updateData).length > 0) {
                await tx.operation.update({
                    where: { id: operationId },
                    data: updateData
                });
            }

            if (assignmentRecord && Object.keys(assignmentUpdateData).length > 0) {
                await tx.driverAssignment.update({
                    where: { id: assignmentRecord.id },
                    data: assignmentUpdateData
                });
            }

            // Add Tracking Update
            if (location || action) {
                await tx.trackingUpdate.create({
                    data: {
                        operationId: operationId,
                        status: updateData.status || operation.status,
                        note: action === 'UPDATE' ? (body.note || 'Mise à jour') : `Driver Action: ${action}`,
                        location: location || null,
                        recordedBy: driver.name
                    }
                });
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error updating mission status:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
