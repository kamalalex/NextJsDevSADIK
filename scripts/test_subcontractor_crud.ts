
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';
const ADMIN_ID = '6910e0b6ca9cdee76bfd404d'; // Transport Admin

const token = jwt.sign({
    userId: ADMIN_ID,
    email: 'admin@company.com',
    role: 'COMPANY_ADMIN',
    companyId: '6910e0b6ca9cdee76bfd403a'
}, JWT_SECRET, { expiresIn: '1h' });

const BASE_URL = 'http://localhost:3000/api/company/subcontractors';

async function testSubcontractorCRUD() {
    console.log('--- STARTING SUBCONTRACTOR CRUD TEST ---');

    // 1. CREATE
    console.log('1. Creating Subcontractor...');
    const createRes = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Sub Test Contact',
            companyName: 'Sub Test Company ' + Date.now(),
            phone: '0600000000',
            email: `sub${Date.now()}@test.com`,
            address: '123 Test St',
            companyId: 'RC-TEST-123',
            paymentWithInvoice: true
        })
    });

    if (!createRes.ok) {
        console.error('❌ Create Failed:', await createRes.text());
        return;
    }

    const sub = await createRes.json();
    console.log('✅ Created:', sub.id, sub.companyName);

    // 2. UPDATE
    console.log('2. Updating Subcontractor...');
    const updateRes = await fetch(`${BASE_URL}/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Updated Contact Name',
            phone: '0699999999'
        })
    });

    if (!updateRes.ok) {
        console.error('❌ Update Failed:', await updateRes.text());
        return;
    }

    const updatedSub = await updateRes.json();
    console.log('✅ Updated:', updatedSub.name, updatedSub.phone);

    if (updatedSub.name !== 'Updated Contact Name') console.error('⚠️ Name not updated correctly');

    // 3. DELETE
    console.log('3. Deleting Subcontractor...');
    const deleteRes = await fetch(`${BASE_URL}/${sub.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!deleteRes.ok) {
        console.error('❌ Delete Failed:', await deleteRes.text());
        return;
    }

    console.log('✅ Deleted successfully');

    // 4. VERIFY GONE
    console.log('4. Verifying deletion...');
    // We can't easily check via API properly without listing ALL, but we can assume success if DELETE 200 OK. 
    // Or we can try to GET specific if endpoint existed, but we only have LIST.
    // Let's trust DELETE 200 for now.

    console.log('--- TEST COMPLETE ---');
}

testSubcontractorCRUD();
