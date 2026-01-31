import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { startOfMonth, subMonths, format, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function GET(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the driver associated with the current user
        const driver = await prisma.driver.findUnique({
            where: { userId: userPayload.userId },
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        // 1. Total Operations (Assigned to this driver)
        const totalOperations = await prisma.operation.count({
            where: {
                OR: [
                    { assignedDriverId: driver.id },
                    { assignedDrivers: { some: { driverId: driver.id } } }
                ]
            }
        });

        // 2. Active Operations
        const activeOperations = await prisma.operation.count({
            where: {
                AND: [
                    {
                        OR: [
                            { assignedDriverId: driver.id },
                            { assignedDrivers: { some: { driverId: driver.id } } }
                        ]
                    },
                    {
                        status: {
                            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
                        }
                    }
                ]
            }
        });

        // 3. Number of Clients (Distinct companies that are clients for these operations)
        const operations = await prisma.operation.findMany({
            where: {
                OR: [
                    { assignedDriverId: driver.id },
                    { assignedDrivers: { some: { driverId: driver.id } } }
                ]
            },
            select: {
                clientId: true,
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignedDrivers: {
                    where: { driverId: driver.id },
                    select: { assignedPrice: true, driverId: true }
                },
                operationDate: true,
                status: true
            }
        });

        const uniqueClientIds = new Set(operations.map(op => op.clientId).filter(Boolean));
        const totalClients = uniqueClientIds.size;

        // 4. Top 5 Clients
        const clientCounts: Record<string, { name: string, count: number }> = {};

        operations.forEach(op => {
            if (op.client && op.clientId) {
                if (!clientCounts[op.clientId]) {
                    clientCounts[op.clientId] = { name: op.client.name, count: 0 };
                }
                clientCounts[op.clientId].count++;
            }
        });

        const topClients = Object.values(clientCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const isInternal = userPayload.role === 'EMPLOYED_DRIVER';

        // Fetch bonuses and expenses if internal
        let bonuses: any[] = [];
        let approvedExpenses: any[] = [];
        if (isInternal) {
            [bonuses, approvedExpenses] = await Promise.all([
                prisma.driverBonus.findMany({
                    where: { driverId: driver.id }
                }),
                prisma.driverExpense.findMany({
                    where: {
                        driverId: driver.id,
                        status: { in: ['APPROVED', 'PAID'] }
                    }
                })
            ]);
        }

        // 5. Earnings Graph (Last 6 months)
        const earningsByMonth: Record<string, number> = {};
        const months: string[] = [];

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthKey = format(date, 'yyyy-MM');
            earningsByMonth[monthKey] = 0;
            months.push(monthKey);

            // Add Base Salary for internal drivers
            if (isInternal && driver.baseSalary) {
                earningsByMonth[monthKey] += driver.baseSalary;
            }
        }

        operations.forEach(op => {
            if (['DELIVERED'].includes(op.status)) {
                const date = new Date(op.operationDate);
                const monthKey = format(date, 'yyyy-MM');

                if (earningsByMonth[monthKey] !== undefined) {
                    let amount = 0;
                    if (op.assignedDrivers && op.assignedDrivers.length > 0) {
                        amount = op.assignedDrivers[0].assignedPrice || 0;
                    }
                    earningsByMonth[monthKey] += amount;
                }
            }
        });

        // Add Bonuses and Expenses to graph
        if (isInternal) {
            bonuses.forEach(bonus => {
                const date = new Date(bonus.date);
                const monthKey = format(date, 'yyyy-MM');
                if (earningsByMonth[monthKey] !== undefined) {
                    earningsByMonth[monthKey] += bonus.amount;
                }
            });
            approvedExpenses.forEach(expense => {
                const date = new Date(expense.date);
                const monthKey = format(date, 'yyyy-MM');
                if (earningsByMonth[monthKey] !== undefined) {
                    earningsByMonth[monthKey] += expense.amount;
                }
            });
        }

        // Calculate current month's breakdown for internal drivers
        const currentMonthKey = format(new Date(), 'yyyy-MM');
        let currentMonthBreakdown = null;

        if (isInternal) {
            const monthCommissions = operations.filter(op => {
                if (!['DELIVERED', 'COMPLETED', 'TERMINE'].includes(op.status)) return false;
                const d = new Date(op.operationDate);
                return format(d, 'yyyy-MM') === currentMonthKey;
            }).reduce((sum, op) => {
                const driverAssignment = op.assignedDrivers.find(ad => ad.driverId === driver.id);
                return sum + (driverAssignment?.assignedPrice || 0);
            }, 0);

            const monthBonuses = bonuses.filter(b => {
                const d = new Date(b.date);
                return format(d, 'yyyy-MM') === currentMonthKey;
            }).reduce((sum, b) => sum + b.amount, 0);

            const monthExpenses = approvedExpenses.filter(e => {
                const d = new Date(e.date);
                return format(d, 'yyyy-MM') === currentMonthKey;
            }).reduce((sum, e) => sum + e.amount, 0);

            currentMonthBreakdown = {
                baseSalary: driver.baseSalary || 0,
                commissions: monthCommissions,
                bonuses: monthBonuses,
                expenses: monthExpenses,
                total: (driver.baseSalary || 0) + monthCommissions + monthBonuses + monthExpenses
            };
        }

        const revenueTrend = months.map(key => {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
                label: format(date, 'MMM', { locale: fr }),
                revenue: earningsByMonth[key]
            };
        });

        return NextResponse.json({
            isInternal,
            totalOperations,
            activeOperations,
            totalClients,
            topClients: isInternal ? [] : topClients,
            revenueTrend,
            currentMonthBreakdown,
            driver
        });

    } catch (error: any) {
        console.error('Error fetching driver dashboard stats:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
