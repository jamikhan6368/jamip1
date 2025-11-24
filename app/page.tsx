// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl md:text-5xl font-extrabold">
        Runway Prompt Studio
      </h1>
      <p className="max-w-2xl text-pink-100/90">
        Automate your Runway Gen-4 batches with smart CSV matching, prompt
        presets, and one-click runs from a Chrome extension – backed by your
        own server, billing, and admin control.
      </p>

      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 font-semibold"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/billing"
          className="px-6 py-3 rounded-lg border border-white/30 hover:border-pink-300"
        >
          Manage Billing
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-10">
        <FeatureCard
          title="CSV → Assets Matching"
          description="Upload CSV with prompts, auto-match file names to Runway assets via the extension."
        />
        <FeatureCard
          title="Motion & Camera Presets"
          description="Low / Medium / High motion and camera moves selected per image."
        />
        <FeatureCard
          title="Server-side Plans & Limits"
          description="30-day subscriptions, PKR + Binance QR, device-locked per user."
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-pink-100/80">{description}</p>
    </div>
  );
}
