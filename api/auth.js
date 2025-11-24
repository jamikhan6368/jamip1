import { Pool } from 'pg';
import automationCode from '../lib/automation.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // 1. CORS Headers (Allow extension to talk to server)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- A. SUBMIT PAYMENT (POST) ---
  if (req.method === 'POST') {
      const { googleToken, transactionId, method, device } = req.body;
      try {
          // Verify identity again
          const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
          const gUser = await gRes.json();
          if (!gUser.email) return res.status(400).json({ error: 'Invalid Token' });

          const client = await pool.connect();
          // Update existing user with TRX ID
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

  // --- B. LOGIN CHECK (GET) ---
  const { googleToken, device } = req.query;
  if (!googleToken) return res.status(400).json({ error: 'Missing Google Token' });

  try {
    const client = await pool.connect();
    
    // 1. Verify Google Token
    const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    const gUser = await gRes.json();
    
    if (!gUser.email) { 
        client.release(); 
        return res.status(403).json({ error: 'Invalid Google Token' }); 
    }

    // 2. Check Database for User
    let result = await client.query('SELECT * FROM licenses WHERE email = $1', [gUser.email]);
    let license = result.rows[0];

    // 3. *** AUTO-CREATE USER IF MISSING ***
    if (!license) {
        console.log("Creating new user:", gUser.email);
        
        const newEntry = await client.query(
            `INSERT INTO licenses (email, role, is_active, expires_at, device_id) 
             VALUES ($1, 'user', FALSE, NOW(), $2) 
             RETURNING *`,
            [gUser.email, device || 'unknown']
        );
        license = newEntry.rows[0];
    }

    client.release();

    // 4. Status Checks
    
    // If user exists but is NOT active (Needs Payment or Approval)
    if (!license.is_active) {
        if (license.transaction_id) {
            // They paid, waiting for Admin
            return res.status(403).json({ error: 'PENDING_APPROVAL' });
        } else {
            // They haven't paid yet
            return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
        }
    }

    // If user is active, check Expiration
    if (new Date() > new Date(license.expires_at)) {
        return res.status(402).json({ error: 'EXPIRED' });
    }

    // Device Lock Check
    if (license.device_id && license.device_id !== device) {
        return res.status(403).json({ error: 'LOCKED_TO_OTHER_DEVICE' });
    }

    // 5. SUCCESS - Send the Automation Code
    res.status(200).send(automationCode);

  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
}
