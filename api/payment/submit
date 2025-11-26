import sql from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, method, transactionId, amount } = body;

    if (!userId || !method || !transactionId || !amount) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing_fields" }),
        { status: 400 }
      );
    }

    if (!["pakistan", "binance"].includes(method)) {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_method" }),
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO payments (user_id, method, transaction_id, amount, status)
      VALUES (${userId}, ${method}, ${transactionId}, ${amount}, 'pending')
      RETURNING *
    `;

    return new Response(JSON.stringify({ ok: true, payment: rows[0] }), {
      status: 200
    });
  } catch (err) {
    console.error("payment/submit error", err);
    return new Response(
      JSON.stringify({ ok: false, error: "server_error" }),
      { status: 500 }
    );
  }
}
