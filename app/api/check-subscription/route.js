import sql from "@/lib/db";
import { getActiveSubscription, ensureDevice } from "@/lib/subscription";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, deviceId, deviceName } = body;

    if (!userId || !deviceId) {
      return new Response(
        JSON.stringify({
          authorized: false,
          reason: "missing_user_or_device"
        }),
        { status: 400 }
      );
    }

    const deviceCheck = await ensureDevice(userId, deviceId, deviceName);
    if (!deviceCheck.ok) {
      return new Response(
        JSON.stringify({
          authorized: false,
          reason: deviceCheck.reason
        }),
        { status: 200 }
      );
    }

    const sub = await getActiveSubscription(userId);
    if (!sub) {
      return new Response(
        JSON.stringify({
          authorized: false,
          reason: "no_active_subscription"
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        authorized: true,
        reason: "active",
        expires: sub.expiry_date
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("check-subscription error", err);
    return new Response(
      JSON.stringify({ authorized: false, reason: "server_error" }),
      { status: 500 }
    );
  }
}
