import { Pool } from 'pg';
import { OAuth2Client } from 'google-auth-library';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// YOUR WEB CLIENT ID (Keep this correct!)
const CLIENT_ID = "1078904057208-m653sh6blj9ae4icq54l3cgljljkm61u.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No Token Provided' });

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify Google Identity
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    const db = await pool.connect();

    // 2. DATABASE CHECK: Is this user an Admin?
    const adminCheck = await db.query('SELECT role FROM licenses WHERE email = $1', [email]);
    const user = adminCheck.rows[0];

    if (!user || user.role !== 'admin') {
        db.release();
        return res.status(403).json({ error: 'Access Denied. You are not an Admin in the database.' });
    }

    // --- IF WE GET HERE, YOU ARE ADMIN ---

    // A. GET ALL USERS
    if (req.method === 'GET') {
        const result = await db.query('SELECT * FROM licenses ORDER BY created_at DESC');
        db.release();
        return res.status(200).json(result.rows);
    }

    // B. CREATE NEW LICENSE
    if (req.method === 'POST') {
        const { type, value, days } = req.body; 
        let query = '';
        let params = [];

        if (type === 'email') {
            query = `INSERT INTO licenses (email, expires_at, role) VALUES ($1, NOW() + INTERVAL '${days} days', 'user') RETURNING *`;
            params = [value];
        } else {
            query = `INSERT INTO licenses (license_key, expires_at, role) VALUES ($1, NOW() + INTERVAL '${days} days', 'user') RETURNING *`;
            params = [value];
        }

        try {
            const result = await db.query(query, params);
            db.release();
            return res.status(200).json(result.rows[0]);
        } catch(err) {
            db.release();
            return res.status(400).json({ error: 'User already exists.' });
        }
    }

    // C. DELETE USER
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
