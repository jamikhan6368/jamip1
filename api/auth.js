import { Pool } from 'pg';
import { OAuth2Client } from 'google-auth-library';
import automationCode from '../lib/automation.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// YOUR WEB CLIENT ID
const CLIENT_ID = "1078904057208-m653sh6blj9ae4icq54l3cgljljkm61u.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { googleToken, device, transactionId, method } = req.method === 'POST' ? req.body : req.query;

  if (!device) return res.status(400).json({ error: 'Missing Device ID' });
  if (!googleToken) return res.status(400).json({ error: 'Missing Token' });

  try {
    let email = null;

    // --- 1. TRY VERIFYING AS ID TOKEN (JWT) ---
    try {
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: CLIENT_ID,
        });
        email = ticket.getPayload().email;
    } catch (e) {
        // --- 2. IF FAILED, TRY VERIFYING AS ACCESS TOKEN ---
        try {
            const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
            if (gRes.ok) {
                const gUser = await gRes.json();
                email = gUser.email;
            }
        } catch (err2) {
            console.error("Access Token Check Failed");
        }
    }

    if (!email) return res.status(403).json({ error: 'Invalid Google Token' });

    // --- 3. DATABASE LOGIC ---
    const db = await pool.connect();
    let result = await db.query('SELECT * FROM licenses WHERE email = $1', [email]);
    let license = result.rows[0];

    // Auto-Create User
    if (!license) {
        const newRow = await db.query(
            `INSERT INTO licenses (email, role, is_active, expires_at, device_id) 
             VALUES ($1, 'user', FALSE, NOW(), $2) 
             RETURNING *`,
            [email, device]
        );
        license = newRow.rows[0];
    }

    // Handle Payment
    if (req.method === 'POST' && transactionId) {
        await db.query(
            'UPDATE licenses SET transaction_id = $1, payment_method = $2, device_id = $3 WHERE email = $4',
            [transactionId, method, device, email]
        );
        db.release();
        return res.status(200).json({ success: true });
    }

    // Update Device ID (Roaming)
    if (license.device_id !== device) {
        await db.query('UPDATE licenses SET device_id = $1 WHERE email = $2', [device, email]);
    }

    db.release();

    // Status Checks
    if (!license.is_active) {
        if (license.transaction_id) return res.status(403).json({ error: 'PENDING_APPROVAL' });
        return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
    }

    if (new Date() > new Date(license.expires_at)) {
        return res.status(402).json({ error: 'EXPIRED' });
    }

    // Success
    res.status(200).send(automationCode);

  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ error: 'Server Error' });
  }
}
