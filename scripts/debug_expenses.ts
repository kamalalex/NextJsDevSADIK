
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Drivers ---');
    const drivers = await prisma.driver.findMany({
        include: {
            user: true,
            expenses: true
        }
    });

    drivers.forEach(d => {
        console.log(`Driver: ${d.name} (ID: ${d.id}, UserID: ${d.userId}, CompanyID: ${d.companyId}, Independent: ${d.isIndependent})`);
        console.log(`Expenses: ${d.expenses.length}`);
        d.expenses.forEach(e => {
            console.log(`  - Expense: ${e.type}, Amount: ${e.amount}, Status: ${e.status}, Date: ${e.date}`);
        });
    });

    console.log('\n--- Checking Companies ---');
    const companies = await prisma.company.findMany();
    companies.forEach(c => {
        console.log(`Company: ${c.name} (ID: ${c.id})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
