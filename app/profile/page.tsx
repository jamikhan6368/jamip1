// app/profile/page.tsx
export default function ProfilePage() {
  // Later you can fetch user data from /api/me using cookies/JWT
  const emailPlaceholder = "Logged-in Google email (to wire later)";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="p-6 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl space-y-3">
        <div>
          <div className="text-sm text-pink-100/70">Email</div>
          <div className="font-semibold">{emailPlaceholder}</div>
        </div>
        <div>
          <div className="text-sm text-pink-100/70">Plan Status</div>
          <div className="text-xs text-pink-100/70">
            Shown on Dashboard via /api/check-plan.
          </div>
        </div>
        <div>
          <div className="text-sm text-pink-100/70">Device Lock</div>
          <div className="text-xs text-pink-100/70">
            Your account is locked to one device via the Chrome extension fingerprint.
          </div>
        </div>
      </div>
    </div>
  );
}
