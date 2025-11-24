// /api/auth/google/start
import { google } from 'googleapis';

export default async function handler(req, res) {
  const redirect = req.query.redirect_uri;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirect
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["profile", "email"]
  });

  return res.redirect(url);
}

