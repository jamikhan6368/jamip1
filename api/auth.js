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

  // --- SUBMIT PAYMENT DETAILS (POST) ---
  if (req.method === 'POST') {
      const { googleToken, transactionId, method, device } = req.body;
      try {
          const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
          const gUser = await gRes.json();
          if (!gUser.email) return res.status(400).json({ error: 'Invalid Google Token' });

          const client = await pool.connect();
          // Update the existing user with payment details
          await client.query(
              'UPDATE licenses SET transaction_id = $1, payment_method = $2, device_id = $3 WHERE email = $4',
              [transactionId, method, device, gUser.email]
          );
          client.release();
          return res.status(200).json({ success: true });
      } catch (err) {
          return res.status(500).json({ error: err.message });
      }
  }

  // --- LOGIN / CHECK STATUS (GET) ---
  const { googleToken, device } = req.query;
  if (!googleToken) return res.status(400).json({ error: 'Missing Token' });

  try {
    const client = await pool.connect();
    
    // 1. Verify Google
    const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    const gUser = await gRes.json();
    
    if (!gUser.email) { 
        client.release(); 
        return res.status(403).json({ error: 'Invalid Google Token' }); 
    }

    // 2. Check DB
    let result = await client.query('SELECT * FROM licenses WHERE email = $1', [gUser.email]);
    let license = result.rows[0];

    // 3. AUTO-CREATE USER IF MISSING (The Fix)
    if (!license) {
        // Create a new "Pending" user immediately
        const newEntry = await client.query(
            `INSERT INTO licenses (email, role, is_active, expires_at, device_id) 
             VALUES ($1, 'user', FALSE, NOW(), $2) 
             RETURNING *`,
            [gUser.email, device]
        );
        license = newEntry.rows[0];
        console.log("New User Created:", gUser.email);
    }

    client.release();

    // 4. Status Checks
    if (!license.is_active) {
        // If they have a Transaction ID, they are waiting for approval
        if (license.transaction_id) {
            return res.status(403).json({ error: 'PENDING_APPROVAL' });
        }
        // If no transaction ID, they need to pay
        return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
    }

    // Check Expiry
    if (new Date() > new Date(license.expires_at)) {
        return res.status(402).json({ error: 'EXPIRED' });
    }

    // Device Lock
    if (license.device_id && license.device_id !== device) {
        return res.status(403).json({ error: 'LOCKED_TO_OTHER_DEVICE' });
    }

    // 5. Success - Send Code
    res.status(200).send(automationCode);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
}
