// pages/api/buildQueue.js

// ------- CONFIG: motion + camera presets -------

const MOTION_PRESETS = [
  {
    level: "Low",
    range: "0.1-0.3",
    cameraOptions: [
      "subtle dolly in",
      "gentle dolly zoom",
      "very slow push in",
      "soft tilt up",
      "slow slide to the right"
    ]
  },
  {
    level: "Medium",
    range: "0.4-0.6",
    cameraOptions: [
      "steady orbit around the subject",
      "smooth pan to the right",
      "medium dolly in toward the subject",
      "tracking shot following the subject",
      "medium height crane move down"
    ]
  },
  {
    level: "High",
    range: "0.7-1.0",
    cameraOptions: [
      "fast pan following the subject",
      "dynamic orbit that speeds up slightly",
      "aggressive dolly in toward the subject",
      "whip pan between key actions",
      "rapid tracking move through the scene"
    ]
  }
];

// random helper
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// safe text (چاہو تو یہاں special chars remove کر سکتے ہو)
function sanitizeText(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ایک row کے لیے تین prompts بناؤ
function buildPromptsForRow(row) {
  const cleanName = sanitizeText(row.cleanName);
  const description = sanitizeText(row.description);
  const style = sanitizeText(row.style);

  const baseDesc =
    description ||
    "A detailed cinematic shot of the main subject in the scene";

  const extraStyle = style ? `, ${style}` : "";

  const jobs = [];

  for (const preset of MOTION_PRESETS) {
    const cameraMove = pickRandom(preset.cameraOptions);

    // تمہاری requirement کے قریب structure:
    // Motion Strength Camera Movement Prompt ...
    const prompt =
      `Motion Strength ${preset.level} ` +
      `Camera Movement ${cameraMove} ` +
      `${baseDesc}${extraStyle} ` +
      `smooth continuous motion, motion strength ${preset.range}`;

    jobs.push({
      cleanName,
      motionLevel: preset.level,
      motionRange: preset.range,
      cameraMovement: cameraMove,
      prompt
    });
  }

  return jobs;
}

// simple CSV parser (comma-separated, no quotes handling)
// اگر تم quoted CSV use کرتے ہو تو proper parser لگا سکتے ہو
function parseCSV(csvText) {
  if (!csvText || typeof csvText !== "string") return [];

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const header = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase());

  const idxClean = header.indexOf("cleanname");
  const idxDesc = header.indexOf("description");
  const idxStyle = header.indexOf("style");

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const cleanName = idxClean >= 0 ? cols[idxClean] || "" : "";
    const description = idxDesc >= 0 ? cols[idxDesc] || "" : "";
    const style = idxStyle >= 0 ? cols[idxStyle] || "" : "";

    if (cleanName) {
      rows.push({ cleanName, description, style });
    }
  }

  return rows;
}

// -------------- MAIN API HANDLER ----------------

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Only POST allowed" });
  }

  try {
    const { csvText, folderId, settings } = req.body || {};

    console.log("============================================");
    console.log("   /api/buildQueue HIT");
    console.log("   CSV length:", csvText ? csvText.length : 0);
    console.log("   Folder ID:", folderId || "none");
    console.log("   Settings:", settings || {});
    console.log("============================================");

    const baseRows = parseCSV(csvText);
    const fullQueue = [];

    if (baseRows.length > 0) {
      for (const row of baseRows) {
        const jobs = buildPromptsForRow(row);
        fullQueue.push(...jobs);
      }
    }

    // اگر CSV نہیں آیا تو demo queue
    if (fullQueue.length === 0) {
      const demoRow = {
        cleanName: "demo_image",
        description:
          "A calm forest scene with a single deer near a stream, cinematic lighting",
        style: "soft atmospheric look"
      };
      fullQueue.push(...buildPromptsForRow(demoRow));
    }

    return res.status(200).json({
      ok: true,
      total: fullQueue.length,
      queue: fullQueue,
      folderId: folderId || null,
      settings: settings || {}
    });
  } catch (err) {
    console.error("buildQueue error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server Error: " + err.message
    });
  }
}
