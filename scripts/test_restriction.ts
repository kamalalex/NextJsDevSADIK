
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';
const OPERATION_ID = '694d94a296d9ad1d4a99b59f'; // Use the ID from previous test
const USER_ID = '692c6f9cf39a09044a3edd21'; // Driss

// Generate Token
const token = jwt.sign({
    userId: USER_ID,
    email: 'test@example.com',
    role: 'INDEPENDENT_DRIVER',
    name: 'Test Driver'
}, JWT_SECRET, { expiresIn: '1h' });

async function testAccessRestriction() {
    console.log('--- STARTING ACCESS RESTRICTION TEST ---');

    try {
        // 1. Set Status to DELIVERED (simulating completion)
        // We need an admin/company token or just use the driver token if they can update to delivered
        console.log('Setting status to DELIVERED...');
        const updateRes = await fetch(`http://localhost:3000/api/driver/missions/${OPERATION_ID}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'DELIVERED'
            })
        });

        console.log('Update Status:', updateRes.status);
        if (!updateRes.ok) {
            console.log('Failed to set DELIVERED (maybe already delivered or invalid transition)');
        }

        // 2. Try to Access Details
        console.log('Fetching Mission Details (Should fail)...');
        const getRes = await fetch(`http://localhost:3000/api/driver/missions/${OPERATION_ID}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Get Status:', getRes.status); // Expect 403
        if (getRes.status === 403) {
            console.log('✅ Access Restricted successfully (403 Forbidden)');
        } else {
            console.log('❌ Access NOT restricted. Status:', getRes.status);
            const data = await getRes.json();
            // console.log(data);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testAccessRestriction();
