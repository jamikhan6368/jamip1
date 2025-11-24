"use client";

import { useEffect, useState } from "react";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  
  useEffect(() => {
    fetch("/api/admin/payments") 
      .then(r => r.json())
      .then(setPayments);
  }, []);

  const approve = async (id: number, user_id: number) => {
    await fetch("/api/payment/manual-verify", {
      method: "POST",
      body: JSON.stringify({ user_id }),
    });
    location.reload();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Payments</h1>

      <div className="bg-black/30 backdrop-blur-xl p-6 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3">ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="py-3">{p.id}</td>
                <td>{p.user_id}</td>
                <td>{p.amount}</td>
                <td>{p.method}</td>
                <td>{p.status}</td>
                <td>
                  {p.status === "pending" && (
                    <button
                      onClick={() => approve(p.id, p.user_id)}
                      className="px-4 py-2 bg-pink-600 rounded-lg text-white"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
