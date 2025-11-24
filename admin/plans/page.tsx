import { db } from "@/lib/db";

export default async function PlansPage() {
  const plans = await db.query(
    "SELECT users.email, plans.* FROM plans JOIN users ON users.id = plans.user_id ORDER BY plans.id DESC"
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Plans</h1>

      <div className="bg-black/30 backdrop-blur-xl p-6 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3">User</th>
              <th>Active</th>
              <th>Expires</th>
            </tr>
          </thead>
          <tbody>
            {plans.rows.map((p: any) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="py-3">{p.email}</td>
                <td>{String(p.is_active)}</td>
                <td>{p.expires_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
