import { Pool } from 'pg';
import automationCode from '../lib/automation.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { googleToken, device, transactionId, method } = req.method === 'POST' ? req.body : req.query;

  if (!device) return res.status(400).json({ error: 'Missing Device ID' });
  if (!googleToken) return res.status(400).json({ error: 'Missing Token' });

  try {
    // 1. VERIFY ACCESS TOKEN (Fetch Method)
    // We query Google directly. This supports the 'ya29...' tokens.
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    
    if (!googleRes.ok) {
        // If this fails, the token is expired or invalid
        return res.status(403).json({ error: 'Google Token Expired. Please Login Again.' });
    }
    
    const googleUser = await googleRes.json();
    const email = googleUser.email;

    if (!email) return res.status(403).json({ error: 'No email found in token' });

    // 2. DATABASE CHECK
    const client = await pool.connect();
    let result = await client.query('SELECT * FROM licenses WHERE email = $1', [email]);
    let license = result.rows[0];

    // 3. AUTO-CREATE USER
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

    // 4. HANDLE PAYMENT
    if (req.method === 'POST' && transactionId) {
        await client.query(
            'UPDATE licenses SET transaction_id = $1, payment_method = $2, device_id = $3 WHERE email = $4',
            [transactionId, method, device, email]
        );
        client.release();
        return res.status(200).json({ success: true });
    }

    // 5. UPDATE DEVICE ID (Roaming Support)
    if (license.device_id !== device) {
        await client.query('UPDATE licenses SET device_id = $1 WHERE email = $2', [device, email]);
    }

    client.release();

    // 6. STATUS CHECKS
    if (!license.is_active) {
        if (license.transaction_id) return res.status(403).json({ error: 'PENDING_APPROVAL' });
        return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
    }

    if (new Date() > new Date(license.expires_at)) {
        return res.status(402).json({ error: 'EXPIRED' });
    }

    // 7. SUCCESS
    res.status(200).send(automationCode);

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: 'Server Internal Error' });
  }
}
