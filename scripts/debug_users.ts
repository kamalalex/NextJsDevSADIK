
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Users ---');
    const users = await prisma.user.findMany();
    users.forEach(u => {
        console.log(`User: ${u.name} (ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, CompanyID: ${u.companyId})`);
    });

    console.log('\n--- Checking All Expenses ---');
    const expenses = await prisma.driverExpense.findMany({
        include: {
            driver: true
        }
    });
    expenses.forEach(e => {
        console.log(`Expense: ${e.type}, Amount: ${e.amount}, Status: ${e.status}, Driver: ${e.driver.name} (ID: ${e.driver.id})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
