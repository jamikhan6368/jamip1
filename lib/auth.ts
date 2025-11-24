import jwt from "jsonwebtoken";
import { db } from "./db";

export function signToken(payload: any) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}

export async function getUserFromToken(authHeader?: string) {
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  try {
    const data: any = verifyToken(token);

    const userRes = await db.query(
      `SELECT * FROM users WHERE id=$1`,
      [data.user_id]
    );

    return userRes.rows[0] ?? null;
  } catch {
    return null;
  }
}
