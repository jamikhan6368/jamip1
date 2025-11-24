import '@/app/globals.css';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 text-white">

      {/* SIDEBAR */}
      <div className="w-64 p-6 bg-black/20 backdrop-blur-xl border-r border-white/10">
        <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
        <nav className="space-y-4">
          <Link href="/admin/dashboard" className="block hover:text-pink-300">Dashboard</Link>
          <Link href="/admin/users" className="block hover:text-pink-300">Users</Link>
          <Link href="/admin/payments" className="block hover:text-pink-300">Payments</Link>
          <Link href="/admin/plans" className="block hover:text-pink-300">Plans</Link>
          <Link href="/admin/devices" className="block hover:text-pink-300">Devices</Link>
        </nav>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 p-10">{children}</div>

    </div>
  );
}
