import { db } from "@/lib/db";

export default async function DevicesPage() {
  const devices = await db.query(
    "SELECT devices.*, users.email FROM devices JOIN users ON users.id = devices.user_id ORDER BY devices.id DESC"
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Devices</h1>

      <div className="bg-black/30 backdrop-blur-xl p-6 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3">User</th>
              <th>Device Hash</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {devices.rows.map((d: any) => (
              <tr key={d.id} className="border-b border-white/5">
                <td className="py-3">{d.email}</td>
                <td className="text-xs">{d.device_hash}</td>
                <td>{d.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
