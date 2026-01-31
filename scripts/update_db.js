
const { execSync } = require('child_process');
require('dotenv').config();

try {
    console.log('Running prisma db push...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    console.log('Running prisma generate...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('Database updated successfully.');
} catch (error) {
    console.error('Error updating database:', error.message);
    process.exit(1);
}
