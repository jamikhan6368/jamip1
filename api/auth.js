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

  // --- SUBMIT PAYMENT (POST) ---
  if (req.method === 'POST') {
      const { googleToken, transactionId, method, device } = req.body;
      
      try {
          // Verify Google Token
          const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
          const gUser = await gRes.json();
          if (!gUser.email) return res.status(400).json({ error: 'Invalid Google Token' });

          const client = await pool.connect();
          
          // Check if already exists
          const check = await client.query('SELECT * FROM licenses WHERE email = $1', [gUser.email]);
          if (check.rows.length > 0) {
              // If exists but inactive, update TRX
              await client.query(
                  'UPDATE licenses SET transaction_id = $1, payment_method = $2 WHERE email = $3',
                  [transactionId, method, gUser.email]
              );
          } else {
              // Create new PENDING account (is_active = FALSE)
              // Expiration set to NOW (so it's expired until approved)
              await client.query(
                  `INSERT INTO licenses (email, device_id, transaction_id, payment_method, is_active, expires_at) 
                   VALUES ($1, $2, $3, $4, FALSE, NOW())`,
                  [gUser.email, device, transactionId, method]
              );
          }
          client.release();
          return res.status(200).json({ success: true });

      } catch (err) {
          return res.status(500).json({ error: err.message });
      }
  }

  // --- LOGIN CHECK (GET) ---
  const { googleToken, device } = req.query;
  if (!device || !googleToken) return res.status(400).json({ error: 'Missing Data' });

  try {
    const client = await pool.connect();
    
    // Verify Google
    const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    const gUser = await gRes.json();
    if (!gUser.email) { client.release(); return res.status(403).json({ error: 'Invalid Google Token' }); }

    // Check DB
    const result = await client.query('SELECT * FROM licenses WHERE email = $1', [gUser.email]);
    const license = result.rows[0];
    client.release();

    if (!license) {
        // User needs to pay
        return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
    }

    if (!license.is_active) {
        // User paid, waiting for you
        return res.status(403).json({ error: 'PENDING_APPROVAL', msg: 'Payment under review. Please wait.' });
    }

    // Check Expiry
    if (new Date() > new Date(license.expires_at)) {
        return res.status(402).json({ error: 'EXPIRED' });
    }

    // Device Lock
    if (license.device_id && license.device_id !== device) {
        return res.status(403).json({ error: 'LOCKED_TO_OTHER_DEVICE' });
    }

    // Success
    res.status(200).send(automationCode);

  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
}
