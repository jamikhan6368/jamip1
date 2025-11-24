// app/billing/page.tsx
"use client";

import { useState } from "react";

type PaymentResponse = {
  qr: string;
  message: string;
};

export default function BillingPage() {
  const [manual, setManual] = useState<PaymentResponse | null>(null);
  const [binance, setBinance] = useState<PaymentResponse | null>(null);
  const [loadingType, setLoadingType] = useState<"manual" | "binance" | null>(null);

  const startManual = async () => {
    setLoadingType("manual");
    const res = await fetch("/api/payment/manual-request", {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    setManual(data);
    setLoadingType(null);
  };

  const startBinance = async () => {
    setLoadingType("binance");
    const res = await fetch("/api/payment/binance-request", {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    setBinance(data);
    setLoadingType(null);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Billing</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* PKR Card */}
        <div className="p-6 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-2">Pakistan Plan</h2>
          <p className="text-sm text-pink-100/80 mb-4">
            1000 PKR – 30 days access. Payment via your PKR QR (Easypaisa/JazzCash/bank, manual verify).
          </p>
          <button
            onClick={startManual}
            disabled={loadingType === "manual"}
            className="px-5 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 font-semibold text-sm"
          >
            {loadingType === "manual" ? "Generating QR..." : "Get PKR QR"}
          </button>

          {manual && (
            <div className="mt-4 space-y-2">
              <img
                src={manual.qr}
                alt="PKR QR"
                className="w-40 h-40 border border-white/20 rounded-lg"
              />
              <p className="text-xs text-pink-100/80">{manual.message}</p>
            </div>
          )}
        </div>

        {/* Binance Card */}
        <div className="p-6 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-2">International Plan</h2>
          <p className="text-sm text-pink-100/80 mb-4">
            10 USD – 30 days access. Payment via Binance QR.
          </p>
          <button
            onClick={startBinance}
            disabled={loadingType === "binance"}
            className="px-5 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 font-semibold text-sm"
          >
            {loadingType === "binance" ? "Generating QR..." : "Get Binance QR"}
          </button>

          {binance && (
            <div className="mt-4 space-y-2">
              <img
                src={binance.qr}
                alt="Binance QR"
                className="w-40 h-40 border border-white/20 rounded-lg"
              />
              <p className="text-xs text-pink-100/80">{binance.message}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-pink-100/70">
        After you pay, the admin approves your payment in the panel. Once approved, your plan becomes
        active and the Chrome extension can start automation.
      </p>
    </div>
  );
}
