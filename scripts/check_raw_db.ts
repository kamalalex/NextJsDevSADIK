import { MongoClient } from 'mongodb';

async function main() {
    const uri = process.env.DATABASE_URL || '';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const operations = db.collection('operations');

        console.log('Fetching raw operation from MongoDB...\n');

        const op = await operations.findOne({ reference: /OP-1764434684916/ });

        if (op) {
            console.log('Raw operation document:');
            console.log(JSON.stringify(op, null, 2));

            console.log('\n\nChecking for invoiceId field:');
            console.log('Has invoiceId property:', 'invoiceId' in op);
            console.log('invoiceId value:', op.invoiceId);
            console.log('invoiceId === null:', op.invoiceId === null);
            console.log('invoiceId === undefined:', op.invoiceId === undefined);
        } else {
            console.log('Operation not found!');
        }
    } finally {
        await client.close();
    }
}

main().catch(console.error);
