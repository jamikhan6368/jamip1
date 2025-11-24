import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const user = await getUserFromToken(auth);

  if (!user) return NextResponse.json({ error: "Unauthorized" });

  const planRes = await db.query(
    `SELECT * FROM plans 
     WHERE user_id=$1 AND is_active=true AND expires_at > now()`,
    [user.id]
  );

  if (planRes.rows.length === 0)
    return NextResponse.json({ active: false });

  return NextResponse.json({
    active: true,
    expires_at: planRes.rows[0].expires_at
  });
}
