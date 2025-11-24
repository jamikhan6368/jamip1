// /api/payment/manual-verify.js
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  // ONLY YOU CALL THIS ENDPOINT
  const { user_id } = req.body;

  await sql`
    UPDATE payments SET status='approved'
    WHERE user_id=${user_id} AND status='pending';
  `;

  await sql`
    INSERT INTO plans (user_id, is_active, expires_at)
    VALUES (${user_id}, true, now() + interval '30 days');
  `;

  return res.json({ ok: true });
}

