// pages/api/checkLicense.js

export default function handler(req, res) {
  const key = req.headers["x-runway-key"];

  // Simple check — replace with DB check later
  if (key !== "MY_SECRET_MASTER_KEY") {
    return res.status(401).json({
      ok: false,
      allowed: false,
      message: "Invalid license key."
    });
  }

  return res.status(200).json({
    ok: true,
    allowed: true,
    message: "Valid license."
  });
}
