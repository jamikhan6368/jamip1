import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const user = await getUserFromToken(auth);

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { device_fingerprint } = await req.json();
  const hash = crypto.createHash("sha256").update(device_fingerprint).digest("hex");

  const exists = await db.query(
    `SELECT * FROM devices WHERE user_id=$1`,
    [user.id]
  );

  if (exists.rows.length === 0) {
    // First device → register
    await db.query(
      `INSERT INTO devices (user_id, device_hash) VALUES ($1, $2)`,
      [user.id, hash]
    );
    return NextResponse.json({ ok: true });
  }

  if (exists.rows[0].device_hash !== hash)
    return NextResponse.json({ ok: false, error: "Account already used on another device" });

  return NextResponse.json({ ok: true });
}
