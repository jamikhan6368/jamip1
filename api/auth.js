import { Pool } from 'pg';
import automationCode from '../lib/automation.js';

// Connect to Neon DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // 1. Enable CORS (Allows your extension to talk to this server)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle Preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { googleToken, licenseKey, device } = req.query;

  if (!device) return res.status(400).json({ error: 'Missing Device ID' });

  try {
    const client = await pool.connect();
    let license = null;

    // --- A. GOOGLE LOGIN FLOW ---
    if (googleToken) {
        // Verify token with Google
        const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
        
        if (!googleRes.ok) {
            client.release();
            return res.status(403).json({ error: 'Invalid Google Token' });
        }
        
        const googleUser = await googleRes.json();
        const email = googleUser.email;

        // Check DB for this Email
        const result = await client.query('SELECT * FROM licenses WHERE email = $1', [email]);
        license = result.rows[0];

        if (!license) {
            client.release();
            return res.status(403).json({ error: 'No subscription found for ' + email });
        }
    } 
    
    // --- B. LICENSE KEY FLOW ---
    else if (licenseKey) {
        const result = await client.query('SELECT * FROM licenses WHERE license_key = $1', [licenseKey]);
        license = result.rows[0];
    }

    // --- C. SECURITY CHECKS ---
    if (!license) {
        client.release();
        return res.status(403).json({ error: 'Invalid License or Account' });
    }

    // 1. Check if Active
    if (!license.is_active) {
        client.release();
        return res.status(403).json({ error: 'License has been disabled.' });
    }

    // 2. Check Expiration
    if (new Date() > new Date(license.expires_at)) {
        client.release();
        return res.status(403).json({ error: 'Subscription Expired. Please renew.' });
    }

    // 3. Device Locking (The "Netflix" Rule)
    if (!license.device_id) {
        // First time use? Lock to this PC.
        await client.query('UPDATE licenses SET device_id = $1 WHERE key_id = $2', [device, license.key_id]);
    } else if (license.device_id !== device) {
        // Different PC? Block it.
        client.release();
        return res.status(403).json({ error: 'License is locked to another device. Contact support to reset.' });
    }

    client.release();
    
    // --- D. SUCCESS ---
    // Send the actual code to the user
    res.status(200).send(automationCode);

  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ error: 'Server Internal Error' });
  }
}
