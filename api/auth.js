import { Pool } from 'pg';
import automationCode from '../lib/automation.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { googleToken, device, transactionId, method } = req.method === 'POST' ? req.body : req.query;

  if (!device) return res.status(400).json({ error: 'Missing Device ID' });
  if (!googleToken) return res.status(400).json({ error: 'Missing Token' });

  try {
    // 1. VERIFY IDENTITY
    const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    if (!gRes.ok) return res.status(403).json({ error: 'Invalid Token' });
    const user = await gRes.json();
    
    const client = await pool.connect();
    
    // 2. GET / CREATE USER
    let result = await client.query('SELECT * FROM licenses WHERE email = $1', [user.email]);
    let license = result.rows[0];

    if (!license) {
        // Create new INACTIVE user
        const newRow = await client.query(
            `INSERT INTO licenses (email, role, is_active, expires_at, device_id) 
             VALUES ($1, 'user', FALSE, NOW(), $2) RETURNING *`,
            [user.email, device]
        );
        license = newRow.rows[0];
    }

    // 3. HANDLE PAYMENT SUBMISSION
    if (req.method === 'POST' && transactionId) {
        await client.query(
            'UPDATE licenses SET transaction_id = $1, payment_method = $2 WHERE email = $3',
            [transactionId, method, user.email]
        );
        client.release();
        return res.status(200).json({ success: true });
    }

    client.release();

    // 4. DECISION LOGIC
    // A. If Pending Approval
    if (!license.is_active && license.transaction_id) {
        return res.status(403).json({ error: 'PENDING_APPROVAL' });
    }
    
    // B. If Unpaid (Inactive)
    if (!license.is_active) {
        return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
    }

    // C. If Expired
    if (new Date() > new Date(license.expires_at)) {
        return res.status(402).json({ error: 'EXPIRED' });
    }

    // D. If Locked to another PC
    if (license.device_id && license.device_id !== device) {
        // Auto-update device ID for Pro users (Roaming)
        await pool.query('UPDATE licenses SET device_id = $1 WHERE email = $2', [device, user.email]);
    }

    // E. SUCCESS -> SEND THE APP
    res.status(200).send(automationCode);

  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
}
