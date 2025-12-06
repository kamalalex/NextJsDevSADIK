import { NextResponse } from 'next/server';
import { PrismaClient, UserRole, CompanyType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            email,
            password,
            type,
            // Common Company fields
            companyName,
            ice,
            address,
            contactPerson,
            phone,
            // Driver fields
            name,
            cin,
            license,
            professionalCard,
        } = body;

        // Basic validation
        if (!email || !password || !type) {
            return NextResponse.json(
                { message: 'Champs obligatoires manquants' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'Cet email est déjà utilisé' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            let userRole: UserRole;
            let newCompany = null;
            let newDriver = null;

            // Determine Role
            if (type === 'SHIPPER') {
                userRole = 'CLIENT_ADMIN';
            } else if (type === 'TRANSPORT_COMPANY') {
                userRole = 'COMPANY_ADMIN';
            } else if (type === 'INDEPENDENT_DRIVER') {
                userRole = 'INDEPENDENT_DRIVER';
            } else {
                throw new Error('Type de compte invalide');
            }

            // 1. Create User (Inactive by default)
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: type === 'INDEPENDENT_DRIVER' ? name : contactPerson,
                    role: userRole,
                    phone,
                    isActive: false, // Requires Admin Validation
                },
            });

            // 2. Create Associated Entity
            if (type === 'SHIPPER' || type === 'TRANSPORT_COMPANY') {
                const companyType = type === 'SHIPPER' ? 'CLIENT_COMPANY' : 'TRANSPORT_COMPANY';

                // Check if company name exists (optional, but good practice)
                const existingCompany = await tx.company.findUnique({
                    where: { name: companyName }
                });

                if (existingCompany) {
                    throw new Error('Une entreprise avec ce nom existe déjà');
                }

                newCompany = await tx.company.create({
                    data: {
                        name: companyName,
                        type: companyType,
                        address,
                        phone,
                        email,
                        ice,
                        contactPerson,
                        isActive: false, // Company also inactive? Or just user? Let's make company inactive too.
                        users: {
                            connect: { id: user.id },
                        },
                    },
                });

                // Update user with companyId
                await tx.user.update({
                    where: { id: user.id },
                    data: { companyId: newCompany.id },
                });

            } else if (type === 'INDEPENDENT_DRIVER') {
                newDriver = await tx.driver.create({
                    data: {
                        name,
                        email,
                        phone,
                        license,
                        cin,
                        professionalCard,
                        isIndependent: true,
                        status: 'INACTIVE', // Wait for validation
                        userId: user.id,
                    },
                });
            }

            return { user, newCompany, newDriver };
        });

        return NextResponse.json(
            {
                message: 'Inscription réussie. Votre compte est en attente de validation par un administrateur.',
                userId: result.user.id,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: error.message || 'Une erreur est survenue lors de l\'inscription' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
