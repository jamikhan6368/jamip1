"use client";

import { useEffect } from "react";

export default function AdminLogin() {
  const handleLogin = () => {
    const url =
      "/api/auth/google?redirect_uri=" +
      encodeURIComponent(window.location.origin + "/admin/login/callback");
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-700 text-white">
      <div className="p-10 rounded-xl bg-black/30 backdrop-blur-xl border border-white/10">
        <h1 className="text-3xl font-bold mb-6">Admin Login</h1>
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-pink-600 hover:bg-pink-500 rounded-lg font-semibold"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}
