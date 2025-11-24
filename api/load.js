import { Pool } from 'pg';
import automationCode from '../lib/automation.js';
import loginCode from '../lib/login.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { googleToken, device, transactionId } = req.method === 'POST' ? req.body : req.query;

  // 1. NO TOKEN -> SHOW LOGIN
  if (!googleToken) {
      return res.send(loginCode.replace("INITIAL_STATE", "login"));
  }

  try {
    // 2. VERIFY TOKEN
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    if (!googleRes.ok) return res.send(loginCode.replace("INITIAL_STATE", "login").replace("ERROR_MSG", "Session Expired"));
    
    const gUser = await googleRes.json();
    const client = await pool.connect();
    
    // 3. GET USER
    let result = await client.query('SELECT * FROM licenses WHERE email = $1', [gUser.email]);
    let license = result.rows[0];

    // Auto Create
    if (!license) {
        const newRow = await client.query(`INSERT INTO licenses (email, role, is_active, expires_at, device_id) VALUES ($1, 'user', FALSE, NOW(), $2) RETURNING *`, [gUser.email, device]);
        license = newRow.rows[0];
    }

    // Payment Submission
    if (req.method === 'POST' && transactionId) {
        await client.query('UPDATE licenses SET transaction_id = $1, device_id = $2 WHERE email = $3', [transactionId, device, gUser.email]);
        client.release();
        return res.send(loginCode.replace("INITIAL_STATE", "pending"));
    }

    client.release();

    // 4. DECIDE RESPONSE
    if (!license.is_active) {
        if (license.transaction_id) return res.send(loginCode.replace("INITIAL_STATE", "pending"));
        return res.send(loginCode.replace("INITIAL_STATE", "payment"));
    }

    if (license.device_id && license.device_id !== device) {
         // Auto update device for ease of use
         await pool.query('UPDATE licenses SET device_id = $1 WHERE email = $2', [device, gUser.email]);
    }

    // 5. SEND REAL APP
    res.send(automationCode);

  } catch (error) {
    res.send(loginCode.replace("INITIAL_STATE", "login").replace("ERROR_MSG", "Server Error"));
  }
}
