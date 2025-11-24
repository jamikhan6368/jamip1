import { Pool } from 'pg';
import automationCode from '../lib/automation.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. Extract Parameters
  const { googleToken, device, transactionId, method } = req.method === 'POST' ? req.body : req.query;

  if (!device) return res.status(400).json({ error: 'Missing Device ID' });
  if (!googleToken) return res.status(400).json({ error: 'Missing Google Token' });

  try {
    // 3. VERIFY ACCESS TOKEN (The Fix)
    // We use fetch() because 'ya29...' tokens cannot be verified with verifyIdToken()
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    
    if (!googleRes.ok) {
        console.error("Google Auth Failed:", await googleRes.text());
        return res.status(403).json({ error: 'Invalid or Expired Google Token' });
    }
    
    const googleUser = await googleRes.json();
    const email = googleUser.email;

    if (!email) return res.status(403).json({ error: 'No email found in token' });

    // 4. DATABASE CHECK
    const client = await pool.connect();
    let result = await client.query('SELECT * FROM licenses WHERE email = $1', [email]);
    let license = result.rows[0];

    // 5. AUTO-CREATE USER (If new)
    if (!license) {
        console.log("Creating new user:", email);
        const newRow = await client.query(
            `INSERT INTO licenses (email, role, is_active, expires_at, device_id) 
             VALUES ($1, 'user', FALSE, NOW(), $2) 
             RETURNING *`,
            [email, device]
        );
        license = newRow.rows[0];
    }

    // 6. HANDLE PAYMENT SUBMISSION
    if (req.method === 'POST' && transactionId) {
        await client.query(
            'UPDATE licenses SET transaction_id = $1, payment_method = $2, device_id = $3 WHERE email = $4',
            [transactionId, method, device, email]
        );
        client.release();
        return res.status(200).json({ success: true });
    }

    client.release();

    // 7. STATUS CHECKS
    if (!license.is_active) {
        if (license.transaction_id) return res.status(403).json({ error: 'PENDING_APPROVAL' });
        return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
    }

    if (new Date() > new Date(license.expires_at)) {
        return res.status(402).json({ error: 'EXPIRED' });
    }

    if (license.device_id && license.device_id !== device) {
        return res.status(403).json({ error: 'LOCKED_TO_OTHER_DEVICE' });
    }

    // 8. SUCCESS - Return the App Code
    res.status(200).send(automationCode);

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: 'Server Error' });
  }
}
