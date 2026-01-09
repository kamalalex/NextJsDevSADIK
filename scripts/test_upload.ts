
import fetch from 'node-fetch';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';
const OPERATION_ID = '674c23ef34a810931584c6c1';
const USER_ID = '6910e0b6ca9cdee76bfd404d';

// Generate Token
const token = jwt.sign({
    userId: USER_ID,
    email: 'test@example.com',
    role: 'INDEPENDENT_DRIVER',
    name: 'Test Driver'
}, JWT_SECRET, { expiresIn: '1h' });

async function uploadDocument() {
    console.log('--- STARTING UPLOAD TEST ---');

    // Create a dummy file
    const filePath = path.join(__dirname, 'test-doc.txt');
    fs.writeFileSync(filePath, 'This is a test document content.');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('type', 'BON_LIVRAISON');

    try {
        const response = await fetch(`http://localhost:3000/api/operations/${OPERATION_ID}/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);

        if (response.ok) {
            console.log('✅ Upload Successful');
        } else {
            console.log('❌ Upload Failed');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        fs.unlinkSync(filePath);
    }
}

uploadDocument();
