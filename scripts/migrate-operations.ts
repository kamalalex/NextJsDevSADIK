import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const client = new MongoClient(url);

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');

    const db = client.db();
    const operationsCollection = db.collection('operations');

    const operations = await operationsCollection.find({}).toArray();
    console.log(`Found ${operations.length} operations to migrate`);

    for (const op of operations) {
      console.log(`Migrating operation ${op._id}...`);

      // 1. Map Status
      let newStatus = 'PENDING';
      const oldStatus = op.status;
      
      switch (oldStatus) {
        case 'EN_ATTENTE': newStatus = 'PENDING'; break;
        case 'CONFIRMEE': newStatus = 'CONFIRMED'; break;
        case 'EN_ROUTE_CHARGEMENT':
        case 'POSITION_CHARGEMENT':
        case 'CHARGE':
        case 'EN_ROUTE_DESTINATION':
        case 'POSITION_DECHARGEMENT':
        case 'DECHARGE':
          newStatus = 'IN_PROGRESS'; break;
        case 'TERMINEE': newStatus = 'DELIVERED'; break;
        case 'ANNULEE': newStatus = 'CANCELLED'; break;
        default: newStatus = 'PENDING';
      }

      // 2. Map Loading/Unloading Points
      const newLoadingPoints = (op.loadingPoints || []).map((addr: string) => ({
        address: addr,
        date: op.operationDate, // Default to operation date
        contact: '',
      }));

      const newUnloadingPoints = (op.unloadingPoints || []).map((addr: string) => ({
        address: addr,
        date: op.operationDate, // Default to operation date
        contact: '',
      }));

      // 3. Update Document
      await operationsCollection.updateOne(
        { _id: op._id },
        {
          $set: {
            status: newStatus,
            loadingPoints: newLoadingPoints,
            unloadingPoints: newUnloadingPoints,
            priority: 'MEDIUM', // Default
            paymentStatus: 'PENDING', // Default
            isSubcontracted: false,
            // Remove old fields if needed, or keep them? 
            // Prisma will ignore unknown fields, but good to clean up.
            // Let's keep them for safety for now, or unset them.
            // We will unset the old specific status fields if they conflict, but here we just overwrite 'status'.
          },
          $unset: {
            // Remove fields that are definitely gone or renamed if we want to clean up
            // managedOperations is on User, not Operation.
          }
        }
      );
    }

    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

main();
