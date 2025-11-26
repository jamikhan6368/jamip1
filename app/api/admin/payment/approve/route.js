import sql from "@/lib/db";
import { extendSubscription } from "@/lib/subscription";

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
    const { paymentId } = body;

    if (!paymentId) {
      return new Response(
        JSON.stringify({ ok: false, error: "paymentId_required" }),
        { status: 400 }
      );
    }

    const payments = await sql`
      SELECT * FROM payments WHERE id = ${paymentId}
    `;
    const payment = payments[0];

    if (!payment) {
      return new Response(
        JSON.stringify({ ok: false, error: "payment_not_found" }),
        { status: 404 }
      );
    }

    await sql`
      UPDATE payments
      SET status = 'approved',
          updated_at = NOW()
      WHERE id = ${paymentId}
    `;

    const sub = await extendSubscription(payment.user_id);

    return new Response(
      JSON.stringify({ ok: true, subscription: sub }),
      { status: 200 }
    );
  } catch (err) {
    console.error("admin/payment/approve error", err);
    return new Response(
      JSON.stringify({ ok: false, error: "server_error" }),
      { status: 500 }
    );
  }
}
