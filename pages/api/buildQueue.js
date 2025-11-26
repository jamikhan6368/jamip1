// pages/api/buildQueue.js

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { csvText, folderId, settings } = req.body || {};

    // TODO: yahan tum apna asli logic daaloge:
    // - CSV parse
    // - Runway folders/assets fetch
    // - prompts/motion/camera decide
    // Abhi hum demo ke liye dummy queue bana rahe hain:

    const queue = [
      {
        assetName: "demo_image_1.jpg",
        prompt: "A calm motion test prompt for image 1"
      },
      {
        assetName: "demo_image_2.jpg",
        prompt: "A medium motion test prompt for image 2"
      }
    ];

    return res.status(200).json({
      ok: true,
      queue,
      info: {
        folderId: folderId || null,
        total: queue.length,
        settings: settings || {}
      }
    });
  } catch (err) {
    console.error("buildQueue error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
