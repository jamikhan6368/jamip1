import { Pool } from 'pg';
import automationCode from '../lib/automation.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon
});

export default async function handler(req, res) {
  // Enable CORS so your extension can talk to this server
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { key, device } = req.query;

  if (!key || !device) {
    return res.status(400).json({ error: 'Missing key or device ID' });
  }

  try {
    const client = await pool.connect();
    
    // 1. Find License
    const result = await client.query(
      'SELECT * FROM licenses WHERE license_key = $1',
      [key]
    );
    const license = result.rows[0];

    if (!license) {
      client.release();
      return res.status(403).json({ error: 'Invalid License Key' });
    }

    // 2. Check Expiration
    if (new Date() > new Date(license.expires_at)) {
      client.release();
      return res.status(403).json({ error: 'License Expired. Please renew.' });
    }

    // 3. Device Locking Logic
    if (license.device_id === null) {
      // First time use: Lock it to this device
      await client.query(
        'UPDATE licenses SET device_id = $1 WHERE license_key = $2',
        [device, key]
      );
    } else if (license.device_id !== device) {
      // Device mismatch: Block it
      client.release();
      return res.status(403).json({ error: 'License is locked to another device.' });
    }

    client.release();

    // 4. SUCCESS: Return the secret code
    // We send it as plain text so the extension can eval() it
    res.status(200).send(automationCode);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
}
