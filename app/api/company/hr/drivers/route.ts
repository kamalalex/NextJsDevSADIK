
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const userPayload = verifyAuth(request);
        if (!userPayload || !['COMPANY_ADMIN', 'COMPANY_OPERATOR'].includes(userPayload.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = userPayload.companyId;
        if (!companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        // Get current month date range
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        // Fetch employed drivers
        const drivers = await prisma.driver.findMany({
            where: {
                companyId: companyId,
                isIndependent: false
            },
            select: {
                id: true,
                name: true,
                email: true,
                baseSalary: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        avatar: true
                    }
                },
                assignments: {
                    where: {
                        createdAt: {
                            gte: start,
                            lte: end
                        },
                        status: 'TERMINE'
                    },
                    select: {
                        assignedPrice: true
                    }
                },
                bonuses: {
                    where: {
                        date: {
                            gte: start,
                            lte: end
                        }
                    }
                },
                expenses: {
                    where: {
                        date: {
                            gte: start,
                            lte: end
                        }
                    }
                }
            }
        });

        // Process data
        const driversData = drivers.map(driver => {
            const commissions = driver.assignments.reduce((sum, a) => sum + (a.assignedPrice || 0), 0);
            const bonuses = driver.bonuses.reduce((sum, b) => sum + b.amount, 0);
            const approvedExpenses = driver.expenses
                .filter(e => e.status === 'APPROVED')
                .reduce((sum, e) => sum + e.amount, 0);

            const pendingExpensesCount = driver.expenses.filter(e => e.status === 'PENDING').length;

            const totalSalary = (driver.baseSalary || 0) + commissions + bonuses;

            return {
                id: driver.id,
                name: driver.name,
                email: driver.email,
                avatar: driver.user?.avatar,
                baseSalary: driver.baseSalary || 0,
                commissions,
                bonuses,
                approvedExpenses,
                pendingExpensesCount,
                totalSalary
            };
        });

        // Summary stats
        const totalPayroll = driversData.reduce((sum, d) => sum + d.totalSalary, 0);
        const totalPendingExpenses = driversData.reduce((sum, d) => sum + d.pendingExpensesCount, 0);

        return NextResponse.json({
            drivers: driversData,
            stats: {
                totalDrivers: drivers.length,
                totalPayroll,
                totalPendingExpenses
            }
        });

    } catch (error: any) {
        console.error('Error fetching HR drivers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
