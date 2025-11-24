// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Runway Prompt Studio",
  description: "Smart automation for Runway Gen-4 prompts and batches."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 text-white">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl">
              Runway Prompt Studio
            </Link>

            <nav className="space-x-4 text-sm">
              <Link href="/dashboard" className="hover:text-pink-300">Dashboard</Link>
              <Link href="/billing" className="hover:text-pink-300">Billing</Link>
              <Link href="/profile" className="hover:text-pink-300">Profile</Link>
              <Link href="/admin" className="hover:text-pink-300">Admin</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
