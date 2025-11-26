// lib/subscription.js
import sql from "./db";

const SUB_DAYS = parseInt(process.env.SUBSCRIPTION_DAYS || "30", 10);

/**
 * Get active subscription for a user
 */
export async function getActiveSubscription(userId) {
  const rows = await sql`
    SELECT * FROM subscriptions
    WHERE user_id = ${userId}
      AND status = 'active'
      AND expiry_date > NOW()
    ORDER BY expiry_date DESC
    LIMIT 1
  `;
  return rows[0] || null;
}

/**
 * Extend or create subscription by N days
 */
export async function extendSubscription(userId, days = SUB_DAYS) {
  const existing = await getActiveSubscription(userId);

  if (existing) {
    const rows = await sql`
      UPDATE subscriptions
      SET expiry_date = GREATEST(expiry_date, NOW()) + ${days} * INTERVAL '1 day'
      WHERE id = ${existing.id}
      RETURNING *
    `;
    return rows[0];
  } else {
    const rows = await sql`
      INSERT INTO subscriptions (user_id, status, expiry_date)
      VALUES (${userId}, 'active', NOW() + ${days} * INTERVAL '1 day')
      RETURNING *
    `;
    return rows[0];
  }
}

/**
 * Device binding: 1 user -> 1 device
 * Returns { ok: boolean, reason: string }
 */
export async function ensureDevice(userId, deviceId, deviceName = null) {
  if (!deviceId) {
    return { ok: false, reason: "device_id_missing" };
  }

  const existingDevice = (
    await sql`
      SELECT * FROM devices
      WHERE device_id = ${deviceId}
    `
  )[0];

  if (!existingDevice) {
    // user already has another device?
    const userDevices = await sql`
      SELECT * FROM devices
      WHERE user_id = ${userId}
    `;

    if (userDevices.length > 0) {
      return { ok: false, reason: "user_already_has_device" };
    }

    await sql`
      INSERT INTO devices (user_id, device_id, device_name)
      VALUES (${userId}, ${deviceId}, ${deviceName})
    `;

    return { ok: true, reason: "device_registered" };
  }

  if (existingDevice.user_id !== userId) {
    return { ok: false, reason: "device_bound_to_other_user" };
  }

  return { ok: true, reason: "device_ok" };
}
