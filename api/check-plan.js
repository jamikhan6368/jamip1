// /api/check-plan.js
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const tok = req.headers.authorization?.replace("Bearer ", "");
  if (!tok) return res.status(401).end();

  let payload;
  try { payload = jwt.verify(tok, process.env.JWT_SECRET); }
  catch { return res.status(401).end(); }

  const plan = await sql`
    SELECT * FROM plans 
    WHERE user_id = ${payload.user_id}
      AND is_active = true
      AND expires_at > now();
  `;

  return res.json({
    active: plan.rows.length > 0,
    expires_at: plan.rows.length ? plan.rows[0].expires_at : null
  });
}

