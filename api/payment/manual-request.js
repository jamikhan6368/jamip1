// /api/payment/manual-request.js
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const tok = req.headers.authorization?.replace("Bearer ", "");

  let payload;
  try { payload = jwt.verify(tok, process.env.JWT_SECRET); }
  catch { return res.status(401).end(); }

  await sql`
    INSERT INTO payments (user_id, amount, method, status)
    VALUES (${payload.user_id}, 1000, 'manual-pkr', 'pending');
  `;

  return res.json({
    qr: "YOUR_MANUAL_QR_IMAGE_URL",
    message: "Send payment screenshot + TRX to admin"
  });
}

