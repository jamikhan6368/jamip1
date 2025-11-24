import { Pool } from 'pg';
import { OAuth2Client } from 'google-auth-library';
import automationCode from '../lib/automation.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// WEB CLIENT ID
const CLIENT_ID = "1078904057208-m653sh6blj9ae4icq54l3cgljljkm61u.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. EXTRACT PARAMS
  const { googleToken, device, transactionId, method } = req.method === 'POST' ? req.body : req.query;

  if (!device) return res.status(400).json({ error: 'Missing Device ID' });
  if (!googleToken) return res.status(400).json({ error: 'Missing Token' });

  try {
    // 2. VERIFY GOOGLE TOKEN (ID TOKEN METHOD)
    let email = "";
    try {
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: CLIENT_ID,
        });
        email = ticket.getPayload().email;
    } catch (e) {
        console.error("Token Verify Failed:", e.message);
        return res.status(403).json({ error: 'Invalid Google Token' });
    }

    const db = await pool.connect();

    // 3. CHECK / CREATE USER
    let result = await db.query('SELECT * FROM licenses WHERE email = $1', [email]);
    let license = result.rows[0];

    if (!license) {
        // Auto-Create Pending User
        console.log("Creating new user:", email);
        const newRow = await db.query(
            `INSERT INTO licenses (email, role, is_active, expires_at, device_id) 
             VALUES ($1, 'user', FALSE, NOW(), $2) 
             RETURNING *`,
            [email, device]
        );
        license = newRow.rows[0];
    }

    // 4. HANDLE PAYMENT SUBMISSION (POST)
    if (req.method === 'POST' && transactionId) {
        await db.query(
            'UPDATE licenses SET transaction_id = $1, payment_method = $2, device_id = $3 WHERE email = $4',
            [transactionId, method, device, email]
        );
        db.release();
        return res.status(200).json({ success: true });
    }

    db.release();

    // 5. STATUS CHECKS (GET)
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

    // 6. SUCCESS
    res.status(200).send(automationCode);

  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ error: 'Server Error' });
  }
}
