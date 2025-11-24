import { db } from "@/lib/db";

export default async function UsersPage() {
  const users = await db.query("SELECT * FROM users ORDER BY id DESC");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Users</h1>

      <div className="bg-black/30 backdrop-blur-xl p-6 rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3">ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Avatar</th>
            </tr>
          </thead>
          <tbody>
            {users.rows.map((u: any) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="py-3">{u.id}</td>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td>
                  <img src={u.avatar_url} className="w-10 h-10 rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
