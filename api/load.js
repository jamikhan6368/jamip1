import { Pool } from 'pg';
import automationCode from '../lib/automation.js';
import loginCode from '../lib/login.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // Allow Extension to talk to Server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { googleToken, device, transactionId } = req.method === 'POST' ? req.body : req.query;

  // --- 1. IF NO TOKEN -> SEND LOGIN SCREEN ---
  if (!googleToken) {
      return res.send(loginCode.replace("INITIAL_STATE", "login"));
  }

  try {
    // --- 2. VERIFY USER ---
    // We check Google to see who owns this token
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    
    if (!googleRes.ok) {
        // Token invalid? Send Login Screen with Error
        return res.send(loginCode.replace("INITIAL_STATE", "login").replace("ERROR_MSG", "Session Expired. Login again."));
    }
    
    const gUser = await googleRes.json();
    const client = await pool.connect();
    
    // Check DB
    let result = await client.query('SELECT * FROM licenses WHERE email = $1', [gUser.email]);
    let license = result.rows[0];

    // Auto-Create User if missing
    if (!license) {
        const newRow = await client.query(
            `INSERT INTO licenses (email, role, is_active, expires_at, device_id) 
             VALUES ($1, 'user', FALSE, NOW(), $2) RETURNING *`, 
            [gUser.email, device]
        );
        license = newRow.rows[0];
    }

    // Handle Payment Submission
    if (req.method === 'POST' && transactionId) {
        await client.query(
            'UPDATE licenses SET transaction_id = $1, device_id = $2 WHERE email = $3', 
            [transactionId, device, gUser.email]
        );
        client.release();
        return res.send(loginCode.replace("INITIAL_STATE", "pending"));
    }

    client.release();

    // --- 3. DECIDE WHAT TO SEND ---
    
    // A. Locked / Unpaid -> Send Payment Screen
    if (!license.is_active) {
        if (license.transaction_id) return res.send(loginCode.replace("INITIAL_STATE", "pending"));
        return res.send(loginCode.replace("INITIAL_STATE", "payment"));
    }

    // B. Paid & Valid -> Send Automation App
    res.send(automationCode);

  } catch (error) {
    console.error(error);
    res.send(loginCode.replace("INITIAL_STATE", "login").replace("ERROR_MSG", "Server Error"));
  }
}
