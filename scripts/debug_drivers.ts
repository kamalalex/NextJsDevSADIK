
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';
// Using a known Admin ID or assuming one from env/constants if needed.
// Ideally usage: npx tsx scripts/debug_drivers.ts
// For now, mocking token for a known user.
const ADMIN_ID = '6910e0b6ca9cdee76bfd404d'; // Transport Admin

const token = jwt.sign({
    userId: ADMIN_ID,
    email: 'admin@company.com',
    role: 'COMPANY_ADMIN',
    companyId: '6910e0b6ca9cdee76bfd403a' // Assuming this is valid
}, JWT_SECRET, { expiresIn: '1h' });

const BASE_URL = 'http://localhost:3000/api/company/drivers';

async function debugDrivers() {
    console.log('--- Fetching Drivers ---');

    try {
        const response = await fetch(BASE_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error('❌ Failed:', await response.text());
            return;
        }

        const drivers: any = await response.json();
        console.log(`✅ Found ${drivers.length} drivers.`);

        drivers.forEach((d: any, i: number) => {
            console.log(`[${i}] ${d.name} | Source: ${d.source} | Company: ${d.displayCompanyName}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

debugDrivers();
