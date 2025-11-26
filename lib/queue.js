// lib/queue.js

function normalizeName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|mp4|mov)$/i, "")
    .trim();
}

// Robust CSV parser (ported from your popup.js)
export function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuote = false;

  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuote) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        insideQuote = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  const data = [];
  let startIdx = 0;

  if (rows.length > 0 && rows[0][0].toLowerCase().includes("filename")) {
    startIdx = 1;
  }

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    data.push({
      originalName: row[0],
      cleanName: normalizeName(row[0]),
      low: row[1] || "",
      medium: row[2] || "",
      high: row[3] || ""
    });
  }

  return data;
}

/**
 * Build job queue from CSV rows + asset list
 * assets: [{ name: 'file1.png' }, ...]
 */
export function buildQueue(csvRows, assets, styleKey = "low") {
  const queue = [];

  for (const row of csvRows) {
    const match = assets.find((a) => {
      const assetNorm = normalizeName(a.name);
      return (
        assetNorm.includes(row.cleanName) || row.cleanName.includes(assetNorm)
      );
    });

    if (match) {
      let p = row[styleKey] || row.medium || row.low || row.high || "";
      queue.push({
        assetName: match.name,
        cleanName: row.cleanName,
        prompt: p
      });
    }
  }

  return queue;
}
