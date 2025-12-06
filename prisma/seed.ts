import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed...')

  // Créer les compagnies
  const transportCompany = await prisma.company.upsert({
    where: { name: 'Transport Express' },
    update: {},
    create: {
      name: 'Transport Express',
      type: 'TRANSPORT_COMPANY',
      email: 'contact@transport-express.com',
      phone: '+212 5 22 33 44 55',
      address: 'Casablanca, Maroc',
      isActive: true
    }
  })

  const clientCompany = await prisma.company.upsert({
    where: { name: 'Entreprise Client' },
    update: {},
    create: {
      name: 'Entreprise Client',
      type: 'CLIENT_COMPANY',
      email: 'contact@entreprise-client.com',
      phone: '+212 5 66 77 88 99',
      address: 'Marrakech, Maroc',
      isActive: true
    }
  })

  // Hasher les mots de passe
  const hashedAdminPassword = await bcrypt.hash('admin123', 12)
  const hashedClientPassword = await bcrypt.hash('client123', 12)
  const hashedTransportPassword = await bcrypt.hash('transport123', 12)
  const hashedDriverPassword = await bcrypt.hash('driver123', 12)

  // Créer les utilisateurs
  await prisma.user.upsert({
    where: { email: 'admin@transport.com' },
    update: {},
    create: {
      email: 'admin@transport.com',
      password: hashedAdminPassword,
      name: 'Super Administrateur',
      role: 'SUPER_ADMIN',
      isActive: true
    }
  })

  await prisma.user.upsert({
    where: { email: 'client@entreprise.com' },
    update: {},
    create: {
      email: 'client@entreprise.com',
      password: hashedClientPassword,
      name: 'Responsable Client',
      role: 'CLIENT_ADMIN',
      companyId: clientCompany.id,
      isActive: true
    }
  })

  await prisma.user.upsert({
    where: { email: 'transport@company.com' },
    update: {},
    create: {
      email: 'transport@company.com',
      password: hashedTransportPassword,
      name: 'Manager Transport',
      role: 'COMPANY_ADMIN',
      companyId: transportCompany.id,
      isActive: true
    }
  })

  await prisma.user.upsert({
    where: { email: 'chauffeur@independant.com' },
    update: {},
    create: {
      email: 'chauffeur@independant.com',
      password: hashedDriverPassword,
      name: 'Jean Dupont',
      role: 'INDEPENDENT_DRIVER',
      phone: '+212 6 11 22 33 44',
      isActive: true
    }
  })

  console.log('✅ Seed terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })