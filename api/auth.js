import { Pool } from 'pg';
import automationCode from '../lib/automation.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { googleToken, device } = req.query;

  if (!device) return res.status(400).json({ error: 'Missing Device ID' });
  if (!googleToken) return res.status(400).json({ error: 'Missing Google Token' });

  try {
    const client = await pool.connect();

    // 1. Verify Google Token
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    if (!googleRes.ok) {
        client.release();
        return res.status(403).json({ error: 'Invalid Google Login' });
    }
    const googleUser = await googleRes.json();
    const email = googleUser.email;

    // 2. Check DB for Email
    const result = await client.query('SELECT * FROM licenses WHERE email = $1', [email]);
    const license = result.rows[0];

    if (!license) {
        client.release();
        return res.status(403).json({ error: 'No subscription found for ' + email });
    }

    // 3. Check Expiration
    if (new Date() > new Date(license.expires_at)) {
        client.release();
        return res.status(403).json({ error: 'Subscription Expired' });
    }

    // 4. Device Locking
    if (!license.device_id) {
        await client.query('UPDATE licenses SET device_id = $1 WHERE key_id = $2', [device, license.key_id]);
    } else if (license.device_id !== device) {
        client.release();
        return res.status(403).json({ error: 'Locked to another PC. Contact Admin.' });
    }

    client.release();
    
    // 5. Send Code
    res.status(200).send(automationCode);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
}
