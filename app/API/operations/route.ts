import { NextRequest, NextResponse } from 'next/server';
import { Prisma, OperationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET - Récupérer toutes les opérations de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const authUser = verifyAuth(request);

    if (!authUser) {
      return NextResponse.json({
        error: 'Non authentifié - Token manquant ou invalide'
      }, { status: 401 });
    }

    console.log('👤 Récupération opérations pour:', authUser.userId, authUser.role);

    // Récupérer les infos de l'utilisateur pour connaître son companyId
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, role: true, companyId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    let whereClause: any = {
      OR: [
        { createdById: authUser.userId }
      ]
    };

    if (user.companyId) {
      // Si c'est un client, il voit aussi les opérations où il est le client
      if (user.role === 'CLIENT_ADMIN' || user.role === 'CLIENT_LOGISTICS') {
        whereClause.OR.push({ clientId: user.companyId });
      }
      // Si c'est un transporteur, il voit aussi les opérations où il est le transporteur
      else if (user.role === 'COMPANY_ADMIN') {
        whereClause.OR.push({ transportCompanyId: user.companyId });
      }
    }

    // Récupérer les opérations
    const operations = await prisma.operation.findMany({
      where: whereClause,
      select: {
        id: true,
        reference: true,
        operationDate: true,
        loadingPoints: true,
        unloadingPoints: true,
        vehicleType: true,
        ptac: true,
        status: true,
        observations: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
        licensePlate: true,
        sealNumber: true,
        // Inclure les relations
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedDriver: {
          select: {
            id: true,
            name: true,
            phone: true,
            license: true
          }
        },
        assignedVehicle: {
          select: {
            id: true,
            plateNumber: true,
            vehicleType: true,
            ptac: true
          }
        },
        subcontractor: {
          select: {
            id: true,
            name: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(operations);

  } catch (error: any) {
    console.error('❌ Erreur API récupération opérations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des opérations' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle opération
export async function POST(request: NextRequest) {
  try {
    const authUser = verifyAuth(request);

    if (!authUser) {
      return NextResponse.json({
        error: 'Non authentifié - Token manquant ou invalide'
      }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 Données reçues par API:', body);

    // Validation des données requises
    if (!body.reference || !body.operationDate || !body.loadingPoints || !body.unloadingPoints || !body.vehicleType || !body.ptac) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe dans la base
    const userExists = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, role: true, companyId: true }
    });

    if (!userExists) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé en base de données' },
        { status: 404 }
      );
    }

    // Transform string[] points to Json[] structure if needed
    const opDate = new Date(body.operationDate);

    const transformPoints = (points: any[]) => {
      if (Array.isArray(points) && typeof points[0] === 'string') {
        return points.map(p => ({
          address: p,
          date: opDate,
          contact: ''
        }));
      }
      return points;
    };

    let clientId = null;
    let transportCompanyId = null;
    let status: OperationStatus = 'PENDING';
    let salePrice = 0;
    let assignedDriverId = null;
    let assignedVehicleId = null;
    let subcontractorId = null;
    let subcontractedByCompany = false;

    // Logic based on role
    if (userExists.role === 'CLIENT_ADMIN' || userExists.role === 'CLIENT_LOGISTICS') {
      clientId = userExists.companyId;
      // Auto-assign to first transport company
      const transportCompany = await prisma.company.findFirst({
        where: { type: 'TRANSPORT_COMPANY', isActive: true },
        select: { id: true }
      });
      transportCompanyId = transportCompany?.id || null;
    } else if (userExists.role === 'COMPANY_ADMIN' || userExists.role === 'COMPANY_OPERATOR') {
      // Created by transport company
      if (!body.clientId) {
        return NextResponse.json({ error: 'Le client est requis pour une création par le transporteur' }, { status: 400 });
      }
      clientId = body.clientId;
      transportCompanyId = userExists.companyId;
      status = 'CONFIRMED'; // Auto-confirm since created by transporter
      salePrice = body.salePrice || 0;

      if (body.subcontractorId) {
        subcontractorId = body.subcontractorId;
        subcontractedByCompany = true;
        // Allow assigning driver/vehicle from subcontractor
        assignedDriverId = body.assignedDriverId || null;
        assignedVehicleId = body.assignedVehicleId || null;
      } else {
        assignedDriverId = body.assignedDriverId || null;
        assignedVehicleId = body.assignedVehicleId || null;
        subcontractorId = null;
        subcontractedByCompany = false;
      }
    }

    // Créer l'opération en base
    const operation = await prisma.operation.create({
      data: {
        reference: body.reference,
        operationDate: opDate,
        loadingPoints: transformPoints(body.loadingPoints),
        unloadingPoints: transformPoints(body.unloadingPoints),
        vehicleType: body.vehicleType,
        ptac: body.ptac,
        totalWeight: body.totalWeight || 0,
        packaging: body.packaging || null,
        quantity: body.quantity || null,
        observations: body.observations || null,

        status: status,
        salePrice: salePrice,
        purchasePrice: body.purchasePrice || null,
        paymentStatus: 'PENDING',
        createdById: authUser.userId,
        clientId: clientId,
        transportCompanyId: transportCompanyId,
        assignedDriverId: assignedDriverId,
        assignedVehicleId: assignedVehicleId,
        subcontractorId: subcontractorId,
        subcontractedByCompany: subcontractedByCompany,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        client: { select: { id: true, name: true, email: true } },
        assignedDriver: { select: { name: true } },
        assignedVehicle: { select: { plateNumber: true } },
        subcontractor: { select: { name: true, companyName: true } }
      }
    });

    console.log('✅ Opération créée en base:', operation.id);

    return NextResponse.json({
      message: 'Opération créée avec succès',
      operation: operation
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erreur création opération:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Une demande avec cette référence existe déjà' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Erreur lors de la création de l\'opération' }, { status: 500 });
  }
}

// PUT - Mettre à jour une opération
export async function PUT(request: NextRequest) {
  try {
    const authUser = verifyAuth(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de l\'opération requis' }, { status: 400 });
    }

    const existingOperation = await prisma.operation.findFirst({
      where: { id: id, createdById: authUser.userId }
    });

    if (!existingOperation) {
      return NextResponse.json({ error: 'Opération non trouvée ou accès non autorisé' }, { status: 404 });
    }

    const allowedStatuses = ['PENDING', 'EN_ATTENTE'];
    if (!allowedStatuses.includes(existingOperation.status)) {
      return NextResponse.json({ error: 'Cette opération ne peut plus être modifiée car elle est déjà traitée' }, { status: 400 });
    }

    const updatedOperation = await prisma.operation.update({
      where: { id: id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        client: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json({
      message: 'Opération mise à jour avec succès',
      operation: updatedOperation
    });

  } catch (error: any) {
    console.error('❌ Erreur mise à jour opération:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'opération' }, { status: 500 });
  }
}