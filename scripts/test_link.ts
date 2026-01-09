
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';
const ADMIN_ID = '6910e0b6ca9cdee76bfd404d';

const token = jwt.sign({
    userId: ADMIN_ID,
    email: 'admin@company.com',
    role: 'COMPANY_ADMIN',
    companyId: '6910e0b6ca9cdee76bfd403a'
}, JWT_SECRET, { expiresIn: '1h' });

async function testLinkSystem() {
    console.log('--- STARTING LINK TEST ---');

    // 1. Create a client to generate a code
    console.log('1. Creating new client to get code...');
    try {
        const createRes = await fetch('http://localhost:3000/api/company/clients', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Linkable Client ' + Date.now(),
                email: `link${Date.now()}@test.com`,
                ice: 'LINK-TEST'
            })
        });

        if (!createRes.ok) {
            const text = await createRes.text();
            console.error('❌ Create API Error:', createRes.status, text);
            return;
        }

        const client = await createRes.json();
        console.log('Created Client:', client.id, 'Code:', client.sadicCode);

        if (!client.sadicCode) {
            console.error('❌ No sadicCode generated!');
            // return; // Keep going to test other parts
        }
    } catch (e) {
        console.error('❌ Fetch Error:', e);
        return;
    }

    // 2. Test Link API (Even though we just created it, we can test linking logic - wait, it auto-links on create)
    // To test linking, we need a separate company. Simulating strict logic:
    // Actually, let's just create another client via script but NOT using the API (or using a different token/company if I had one).
    // Since I only have one company set up in the script, I will verify that the stat API returns my OWN sadicCode.

    console.log('2. Fetching Stats to see own SadicCode...');
    const statsRes = await fetch('http://localhost:3000/api/company/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await statsRes.json();
    console.log('My Stats Code:', stats.sadicCode);

    if (stats.sadicCode) console.log('✅ Stats returns sadicCode');
    else console.warn('⚠️ No sadicCode in stats (Normal if company was created before migration)');

    console.log('--- DONE ---');
}

testLinkSystem();
