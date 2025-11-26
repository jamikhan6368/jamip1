import { parseCSV, buildQueue } from "@/lib/queue";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, csvText, assets, styleKey, delayPreset } = body;

    if (!userId || !csvText || !Array.isArray(assets)) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing_fields" }),
        { status: 400 }
      );
    }

    const rows = parseCSV(csvText);
    const queue = buildQueue(rows, assets, styleKey || "low");

    if (queue.length === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "no_matches",
          details: { csv: rows.length, assets: assets.length }
        }),
        { status: 200 }
      );
    }

    let min = 5;
    let max = 8;
    if (delayPreset && delayPreset.includes("-")) {
      const parts = delayPreset.split("-").map((x) => parseInt(x, 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        min = parts[0];
        max = parts[1];
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        queue,
        randomDelay: { min, max }
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("prepare-queue error", err);
    return new Response(
      JSON.stringify({ ok: false, error: "server_error" }),
      { status: 500 }
    );
  }
}
