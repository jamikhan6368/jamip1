// /api/payment/binance-request.js
import jwt from "jsonwebtoken";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  const tok = req.headers.authorization?.replace("Bearer ", "");

  let payload;
  try { payload = jwt.verify(tok, process.env.JWT_SECRET); }
  catch { return res.status(401).end(); }

  await sql`
    INSERT INTO payments (user_id, amount, method)
    VALUES (${payload.user_id}, 10, 'binance-usdt');
  `;

  return res.json({
    qr: "YOUR_BINANCE_PAY_QR_URL",
    message: "Scan this QR using Binance Pay"
  });
}

