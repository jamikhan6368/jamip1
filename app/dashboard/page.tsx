// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";

type PlanStatus = {
  active: boolean;
  expires_at?: string | null;
};

export default function DashboardPage() {
  const [plan, setPlan] = useState<PlanStatus | null>(null);

  useEffect(() => {
    // For now, just call check-plan without auth – you’ll wire cookies / tokens later.
    fetch("/api/check-plan", { credentials: "include" })
      .then(r => r.json())
      .then(setPlan)
      .catch(() => setPlan({ active: false }));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <section className="p-6 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl">
        <h2 className="text-xl font-semibold mb-2">Plan Status</h2>
        {plan?.active ? (
          <p className="text-pink-200">
            Active – expires on:{" "}
            <span className="font-semibold">
              {plan.expires_at ? new Date(plan.expires_at).toLocaleString() : "unknown"}
            </span>
          </p>
        ) : (
          <p className="text-pink-200">
            No active plan. Go to{" "}
            <a href="/billing" className="underline">Billing</a> to activate 30-day access.
          </p>
        )}
      </section>

      <section className="p-6 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl space-y-3">
        <h2 className="text-xl font-semibold">Chrome Extension</h2>
        <p className="text-sm text-pink-100/80">
          Install the Runway Prompt Studio Chrome extension to automate Runway batches.
        </p>
        <a
          href="https://your-domain.com/extension/RunwayPromptStudio-extension.zip"
          className="inline-block px-5 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 font-semibold text-sm"
        >
          Download Extension
        </a>
        <ul className="text-xs text-pink-100/70 list-disc ml-6 mt-2 space-y-1">
          <li>Unzip and load it as an unpacked extension in Chrome.</li>
          <li>Login with the same Google account you used here.</li>
          <li>Activate your plan via PKR / Binance QR in Billing.</li>
        </ul>
      </section>
    </div>
  );
}
