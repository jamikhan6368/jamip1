import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { googleToken, device, transactionId, method } = req.method === 'POST' ? req.body : req.query;

  if (!device) return res.status(400).json({ error: 'Missing Device ID' });
  if (!googleToken) return res.status(400).json({ error: 'Missing Token' });

  try {
    // 1. VERIFY GOOGLE TOKEN
    const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`);
    if (!gRes.ok) return res.status(403).json({ error: 'Google Token Expired. Login again.' });
    
    const gUser = await gRes.json();
    const email = gUser.email;

    const client = await pool.connect();
    
    // 2. CHECK DATABASE
    let result = await client.query('SELECT * FROM licenses WHERE email = $1', [email]);
    let license = result.rows[0];

    // 3. CREATE NEW USER (If missing)
    if (!license) {
        const newRow = await client.query(
            `INSERT INTO licenses (email, role, is_active, expires_at, device_id) 
             VALUES ($1, 'user', FALSE, NOW(), $2) RETURNING *`,
            [email, device]
        );
        license = newRow.rows[0];
    }

    // 4. HANDLE PAYMENT
    if (req.method === 'POST' && transactionId) {
        await client.query(
            'UPDATE licenses SET transaction_id = $1, payment_method = $2, device_id = $3 WHERE email = $4',
            [transactionId, method, device, email]
        );
        client.release();
        return res.status(200).json({ success: true });
    }

    // 5. DEVICE LOCK (Roaming Support)
    if (license.device_id !== device) {
        await client.query('UPDATE licenses SET device_id = $1 WHERE email = $2', [device, email]);
    }

    client.release();

    // 6. STATUS CHECKS
    if (!license.is_active) {
        if (license.transaction_id) return res.status(403).json({ error: 'PENDING_APPROVAL' });
        return res.status(402).json({ error: 'PAYMENT_REQUIRED' });
    }

    if (new Date() > new Date(license.expires_at)) {
        return res.status(402).json({ error: 'EXPIRED' });
    }

    // 7. SUCCESS
    res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
}
