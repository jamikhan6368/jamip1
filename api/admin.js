import { Pool } from 'pg';
import { OAuth2Client } from 'google-auth-library';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Use the Web Client ID you just created in Step 1
const CLIENT_ID = "1078904057208-m653sh6blj9ae4icq54l3cgljljkm61u.apps.googleusercontent.com"; 
const client = new OAuth2Client(CLIENT_ID);

export default async function handler(req, res) {
  // Standard headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // 1. Verify Admin Identity via Google
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    // 2. Check if this is YOU
    if (email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Access Denied: You are not the Admin.' });
    }

    const db = await pool.connect();

    // --- GET: List All Users ---
    if (req.method === 'GET') {
        const result = await db.query('SELECT * FROM licenses ORDER BY created_at DESC');
        db.release();
        return res.status(200).json(result.rows);
    }

    // --- POST: Create New License ---
    if (req.method === 'POST') {
        const { type, value, days } = req.body; 
        // type = 'key' or 'email'
        
        let query = '';
        let params = [];

        if (type === 'email') {
            // Add authorized email (Google Login User)
            query = `INSERT INTO licenses (email, expires_at) VALUES ($1, NOW() + INTERVAL '${days} days') RETURNING *`;
            params = [value];
        } else {
            // Create License Key
            query = `INSERT INTO licenses (license_key, expires_at) VALUES ($1, NOW() + INTERVAL '${days} days') RETURNING *`;
            params = [value];
        }

        try {
            const result = await db.query(query, params);
            db.release();
            return res.status(200).json(result.rows[0]);
        } catch(err) {
            db.release();
            return res.status(400).json({ error: 'Duplicate entry or Database Error' });
        }
    }

    // --- DELETE: Remove/Ban User ---
    if (req.method === 'DELETE') {
        const { id } = req.query;
        await db.query('DELETE FROM licenses WHERE key_id = $1', [id]);
        db.release();
        return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server Error' });
  }
}
