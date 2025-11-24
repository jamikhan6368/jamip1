// /api/device-lock.js
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  
  const auth = req.headers.authorization?.replace("Bearer ", "");
  if (!auth) return res.status(401).json({ error: "No token" });

  let payload;
  try { payload = jwt.verify(auth, process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: "Token invalid" }); }

  const { device_fingerprint } = req.body;
  const device_hash = crypto.createHash("sha256").update(device_fingerprint).digest("hex");

  const existing = await sql`
    SELECT * FROM devices WHERE user_id = ${payload.user_id};
  `;

  if (existing.rows.length === 0) {
    await sql`
      INSERT INTO devices (user_id, device_hash)
      VALUES (${payload.user_id}, ${device_hash});
    `;
    return res.json({ ok: true });
  }

  if (existing.rows[0].device_hash !== device_hash)
    return res.json({ ok: false, error: "Account used on another device" });

  return res.json({ ok: true });
}

