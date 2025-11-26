// app/api/admin/payment/reject/route.js
import sql from "../../../../lib/db";

function isAdmin(req) {
  const header = req.headers.get("x-admin-secret") || "";
  return header === process.env.ADMIN_SECRET;
}

export async function POST(req) {
  if (!isAdmin(req)) {
    return new Response(
      JSON.stringify({ ok: false, error: "forbidden" }),
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { paymentId, reason } = body;

    if (!paymentId) {
      return new Response(
        JSON.stringify({ ok: false, error: "paymentId_required" }),
        { status: 400 }
      );
    }

    await sql`
      UPDATE payments
      SET status = 'rejected',
          admin_note = ${reason || null},
          updated_at = NOW()
      WHERE id = ${paymentId}
    `;

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("admin/payment/reject error", err);
    return new Response(
      JSON.stringify({ ok: false, error: "server_error" }),
      { status: 500 }
    );
  }
}
