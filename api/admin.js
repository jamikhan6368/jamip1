import { Pool } from 'pg';
import { OAuth2Client } from 'google-auth-library';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// YOUR WEB CLIENT ID
const CLIENT_ID = "1078904057208-m653sh6blj9ae4icq54l3cgljljkm61u.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS'); // Added PUT
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No Token' });
  const token = authHeader.split(' ')[1];

  try {
    // Verify Admin
    const ticket = await client.verifyIdToken({ idToken: token, audience: CLIENT_ID });
    const email = ticket.getPayload().email;
    const db = await pool.connect();
    
    // Check Admin Role
    const adminCheck = await db.query('SELECT role FROM licenses WHERE email = $1', [email]);
    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
        db.release();
        return res.status(403).json({ error: 'Not Admin' });
    }

    // --- GET USERS ---
    if (req.method === 'GET') {
        // Get Pending first, then active
        const result = await db.query('SELECT * FROM licenses ORDER BY is_active ASC, created_at DESC');
        db.release();
        return res.status(200).json(result.rows);
    }

    // --- APPROVE USER (PUT) ---
    if (req.method === 'PUT') {
        const { id, action } = req.body; // action = 'approve'
        if(action === 'approve') {
            // Set Active = TRUE and add 30 Days
            await db.query(
                "UPDATE licenses SET is_active = TRUE, expires_at = NOW() + INTERVAL '30 days' WHERE key_id = $1",
                [id]
            );
        }
        db.release();
        return res.status(200).json({ success: true });
    }

    // --- DELETE USER ---
    if (req.method === 'DELETE') {
        const { id } = req.query;
        await db.query('DELETE FROM licenses WHERE key_id = $1', [id]);
        db.release();
        return res.status(200).json({ success: true });
    }

    // --- CREATE USER (Manual) ---
    if (req.method === 'POST') {
        const { type, value, days } = req.body;
        let q = type === 'email' 
            ? `INSERT INTO licenses (email, expires_at, role, is_active) VALUES ($1, NOW() + INTERVAL '${days} days', 'user', TRUE)`
            : `INSERT INTO licenses (license_key, expires_at, role, is_active) VALUES ($1, NOW() + INTERVAL '${days} days', 'user', TRUE)`;
        await db.query(q, [value]);
        db.release();
        return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
