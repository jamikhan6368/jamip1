// /api/auth/google/callback
import { google } from 'googleapis';
import jwt from "jsonwebtoken";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  const code = req.query.code;
  const redirect = req.query.redirect_uri;

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirect
  );

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
  const { data } = await oauth2Api.userinfo.get();

  const user = await sql`
    INSERT INTO users (google_id, email, name, avatar_url)
    VALUES (${data.id}, ${data.email}, ${data.name}, ${data.picture})
    ON CONFLICT (google_id) DO UPDATE
      SET email = ${data.email}, name = ${data.name}, avatar_url = ${data.picture}
    RETURNING *;
  `;

  const token = jwt.sign(
    { user_id: user.rows[0].id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  return res.redirect(
    `${redirect}#token=${token}&email=${data.email}`
  );
}

