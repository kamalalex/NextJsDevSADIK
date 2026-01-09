
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';
const OPERATION_ID = '694d94a296d9ad1d4a99b59f';
const USER_ID = '692c6f9cf39a09044a3edd21';

// Generate Token
const token = jwt.sign({
    userId: USER_ID,
    email: 'test@example.com',
    role: 'INDEPENDENT_DRIVER',
    name: 'Test Driver'
}, JWT_SECRET, { expiresIn: '1h' });

async function testTrackingUpdate() {
    console.log('--- STARTING TRACKING TEST ---');

    try {
        // 1. Send Update
        console.log('Sending UPDATE...');
        const updateRes = await fetch(`http://localhost:3000/api/driver/missions/${OPERATION_ID}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'UPDATE',
                note: 'Test Note: Traffic Jam'
            })
        });

        console.log('Update Status:', updateRes.status);
        if (!updateRes.ok) {
            const err = await updateRes.json();
            console.log(err);
            return;
        }

        // 2. Verify Timeline
        console.log('Fetching Mission Details...');
        const getRes = await fetch(`http://localhost:3000/api/driver/missions/${OPERATION_ID}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const mission = await getRes.json();

        const updates = mission.trackingUpdates;
        console.log('Tracking Updates Found:', updates.length);

        const latestInfo = updates[0];
        console.log('Latest Update:', latestInfo);

        if (latestInfo && latestInfo.note === 'Test Note: Traffic Jam') {
            console.log('✅ Tracking Update Verified');
        } else {
            console.log('❌ Tracking Link Failed');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testTrackingUpdate();
