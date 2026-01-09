
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userPayload.userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || name.trim().length < 2) {
            return NextResponse.json({ error: 'Le nom doit contenir au moins 2 caractères' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userPayload.userId },
            data: { name: name.trim() },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Error updating user name:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
