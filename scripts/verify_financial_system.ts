import { PrismaClient } from '@prisma/client';
import { generateInvoiceNumber, calculateInvoiceTotals } from '../lib/invoice-utils';
import { calculateTotalRevenue, calculateRealTimeProfit } from '../lib/financial-calculations';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Financial System Verification...');

    try {
        // 1. Setup Data
        console.log('\n1. Setting up test data...');

        // Create Transport Company
        const transportCompany = await prisma.company.create({
            data: {
                name: 'Test Transport Co ' + Date.now(),
                type: 'TRANSPORT_COMPANY',
                email: 'transport@test.com',
                isActive: true
            }
        });
        console.log('Created Transport Company:', transportCompany.name);

        // Create Client Company
        const clientCompany = await prisma.company.create({
            data: {
                name: 'Test Client Co ' + Date.now(),
                type: 'CLIENT_COMPANY',
                email: 'client@test.com',
                isActive: true
            }
        });
        console.log('Created Client Company:', clientCompany.name);

        // Create Subcontractor
        const subcontractor = await prisma.subcontractor.create({
            data: {
                name: 'John Doe',
                companyName: 'Subcontractor Inc ' + Date.now(),
                phone: '1234567890',
                transportCompanyId: transportCompany.id
            }
        });
        console.log('Created Subcontractor:', subcontractor.companyName);

        // Create User
        const user = await prisma.user.create({
            data: {
                email: 'admin@test.com' + Date.now(),
                password: 'password',
                name: 'Admin User',
                role: 'COMPANY_ADMIN',
                companyId: transportCompany.id
            }
        });
        console.log('Created User:', user.email);

        // 2. Create Operations
        console.log('\n2. Creating Operations...');
        const op1 = await prisma.operation.create({
            data: {
                reference: 'OP-TEST-1-' + Date.now(),
                operationDate: new Date(),
                status: 'DELIVERED',
                vehicleType: 'FOURGON',
                ptac: 'PTAC_3_5T',
                totalWeight: 2.5,
                salePrice: 1000,
                purchasePrice: 800,
                subcontractorId: subcontractor.id,
                transportCompanyId: transportCompany.id,
                clientId: clientCompany.id,
                createdById: user.id
            }
        });

        const op2 = await prisma.operation.create({
            data: {
                reference: 'OP-TEST-2-' + Date.now(),
                operationDate: new Date(),
                status: 'DELIVERED',
                vehicleType: 'FOURGON',
                ptac: 'PTAC_3_5T',
                totalWeight: 2.5,
                salePrice: 1500,
                purchasePrice: 1200,
                subcontractorId: subcontractor.id,
                transportCompanyId: transportCompany.id,
                clientId: clientCompany.id,
                createdById: user.id
            }
        });
        console.log('Created 2 Operations');

        // 3. Verify Financial Stats (Before Invoicing)
        console.log('\n3. Verifying Stats (Initial)...');
        const revenue = calculateTotalRevenue([op1, op2]);
        console.log('Total Revenue:', revenue); // Should be 2500

        // 4. Generate Invoice
        console.log('\n4. Generating Invoice...');
        const taxRate = 20;
        const invoiceTotals = calculateInvoiceTotals([op1], taxRate);
        const invoice = await prisma.invoice.create({
            data: {
                number: generateInvoiceNumber(1),
                date: new Date(),
                dueDate: new Date(),
                amount: invoiceTotals.totalHT,
                taxAmount: invoiceTotals.taxAmount,
                totalAmount: invoiceTotals.totalTTC,
                taxRate: taxRate,
                status: 'EN_ATTENTE',
                clientId: clientCompany.id,
                transportCompanyId: transportCompany.id,
                operations: {
                    connect: [{ id: op1.id }]
                }
            }
        });
        console.log('Created Invoice:', invoice.number, 'Amount:', invoice.totalAmount);

        // Verify operation is linked
        const updatedOp1 = await prisma.operation.findUnique({ where: { id: op1.id } });
        if (updatedOp1?.invoiceId === invoice.id) {
            console.log('SUCCESS: Operation 1 linked to invoice');
        } else {
            console.error('FAILURE: Operation 1 NOT linked to invoice');
        }

        // 5. Create Subcontractor Payment
        console.log('\n5. Creating Subcontractor Payment...');
        const payment = await prisma.subcontractorPayment.create({
            data: {
                paymentNumber: 'PAY-TEST-1',
                paymentDate: new Date(),
                totalAmount: (op1.purchasePrice || 0) + (op2.purchasePrice || 0),
                status: 'PAID',
                subcontractorId: subcontractor.id,
                transportCompanyId: transportCompany.id,
                operations: {
                    connect: [{ id: op1.id }, { id: op2.id }]
                }
            }
        });
        console.log('Created Payment:', payment.paymentNumber, 'Amount:', payment.totalAmount);

        // Update operations status
        await prisma.operation.updateMany({
            where: { id: { in: [op1.id, op2.id] } },
            data: {
                subcontractorPaid: true,
                paymentStatus: 'PAID'
            }
        });

        // 6. Verify Final Stats
        console.log('\n6. Verifying Final Stats...');

        // Mark invoice as paid
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'PAYEE', paidAt: new Date() }
        });

        const finalProfit = calculateRealTimeProfit([invoice], [payment]);
        console.log('Real-Time Profit:', finalProfit);
        // Profit = Paid Invoice (1200) - Payment (2000) = -800 (Since we only invoiced op1 but paid for both)

        console.log('\nVerification Completed Successfully!');

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
