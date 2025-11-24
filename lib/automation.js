// lib/automation.js - V143: FIXED SYNTAX & FULL APP

module.exports = `
(() => {
  // Prevent double loading
  if (window.runwayProLoaded) return;
  window.runwayProLoaded = true;
  console.log("Runway Pro: App Loaded");

  const STATE = {
      isRunning: false,
      stopRequested: false,
      isPaused: false,
      theme: localStorage.getItem('rw_theme') || 'dark',
      targets: ['assets', 'search', 'image', 'prompt', 'remove']
  };

  // --- CSS STYLES ---
  const css = \`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    #runway-pro-root { position: fixed; top: 50%; right: 20px; transform: translateY(-50%); z-index: 2147483647; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: flex-end; }
    #runway-pro-toggle { width: 60px; height: 60px; border-radius: 50%; background: #0f172a; border: 1px solid #334155; color: #d946ef; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.5); margin-bottom: 10px; transition: 0.2s; pointer-events: auto; }
    #runway-pro-toggle:hover { transform: scale(1.1); border-color: #38bdf8; }
    #runway-pro-panel { width: 500px; background: rgba(15, 23, 42, 0.98); backdrop-filter: blur(16px); border: 1px solid #334155; border-radius: 16px; display: none; flex-direction: column; box-shadow: 0 30px 80px rgba(0,0,0,0.9); pointer-events: auto; max-height: 90vh; overflow-y: auto; padding: 25px; color: #e2e8f0; }
    #runway-pro-panel.show { display: flex; }
    .app-shell { display: flex; flex-direction: column; gap: 15px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 10px; }
    .brand-title { font-size: 18px; font-weight: 800; background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .panel { background: rgba(255,255,255,0.03); border: 1px solid #334155; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 10px; }
    .section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 5px; }
    .main-input, .styled-select { width: 100%; background: #020617; border: 1px solid #334155; color: white; padding: 10px; border-radius: 8px; font-size: 12px; margin-bottom: 5px; outline: none; box-sizing: border-box; }
    .btn-primary { background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; width: 100%; padding: 12px; font-size: 13px; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; margin-top: 10px; }
    .train-grid { display: grid; grid-template-columns: 1fr; gap: 6px; }
    .train-row { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 8px; border-radius: 6px; border: 1px solid #334155; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; margin-right: 8px; display: inline-block; }
    .status-dot.active { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
    .btn-mini { padding: 4px 10px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 4px; font-size: 10px; cursor: pointer; margin-left: 5px; }
    .status-banner { background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); color: #22d3ee; padding: 10px; border-radius: 8px; text-align: center; font-size: 11px; margin-top: 10px; }
    .rf-progress-bg { width: 100%; height: 4px; background: #1e293b; border-radius: 2px; margin-top: 10px; overflow: hidden; }
    .rf-progress-fill { width: 0%; height: 100%; background: #22c55e; transition: width 0.3s; }
    .close-btn { cursor: pointer; padding: 5px; }
    #runway-status-pill { position: fixed; bottom: 30px; right: 100px; z-index: 2147483648; background: #0f172a; border: 1px solid #334155; padding: 8px 16px; border-radius: 50px; color: white; font-size: 12px; font-weight: 600; box-shadow: 0 5px 15px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 8px; transform: translateY(20px); opacity: 0; transition: all 0.3s ease; pointer-events: none; }
    #runway-status-pill.visible { transform: translateY(0); opacity: 1; }
    .pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; box-shadow: 0 0 6px rgba(148, 163, 184, 0.5); }
    .pill-dot.pulse { animation: pillPulse 1.5s infinite; }
    @keyframes pillPulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  \`;

  // --- HTML ---
  const html = \`
    <div class="app-shell">
      <div class="header">
        <div><div class="brand-title">Runway Pro</div><div style="font-size:10px; color:#94a3b8;">Automation Suite</div></div>
        <div id="close-panel" class="close-btn">✕</div>
      </div>

      <div class="panel">
        <div class="section-label">RUN AUTOMATION</div>
        <select id="folderSelect" class="main-input"><option>Loading...</option></select>
        <input type="file" id="csvFile" accept=".csv" class="main-input" />
        <div style="display:flex; gap:10px;">
            <select id="delayPreset" class="main-input" style="flex:1;"><option value="5-8">5-8s Delay</option><option value="8-11">8-11s Delay</option></select>
            <select id="promptStyle" class="main-input" style="flex:1;"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
        </div>
        <button id="startAutoBtn" class="btn-primary">🚀 Start Batch</button>
        <div class="status-banner"><span id="statusBox">Ready.</span></div>
        <div class="rf-progress-bg"><div class="rf-progress-fill" id="rf-progress"></div></div>
        <div style="text-align:center; margin-top:10px;">
            <button id="resetMemoryBtn" style="background:none; border:none; color:#64748b; text-decoration:underline; cursor:pointer; font-size:11px;">Reset Training</button>
        </div>
      </div>

      <div class="panel">
        <div class="section-label">ROBOT TRAINING</div>
        <div class="train-grid">
            \${['assets','search','image','prompt','remove'].map(t => \`
                <div class="train-row">
                    <div class="row-left"><span class="status-dot" id="dot-\${t}"></span> <span style="font-size:12px; font-weight:500;">\${t.toUpperCase()}</span></div>
                    <div>
                       <button class="btn-mini btn-train" data-target="\${t}">Train</button>
                       <button class="btn-mini btn-test" data-target="\${t}">Test</button>
                    </div>
                </div>
            \`).join('')}
        </div>
      </div>
    </div>
  \`;

  // --- CREATE UI ---
  function createFloatingUI() {
      if (document.getElementById("runway-pro-root")) return;

      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);

      const root = document.createElement("div");
      root.id = "runway-pro-root";

      const toggle = document.createElement("div");
      toggle.id = "runway-pro-toggle";
      toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 6-2.5-2.5a2.12 2.12 0 1 0-3 3L16 9"/><path d="m16 9 3 3"/><path d="M14.5 7.5 4 18l3 3 10.5-10.5"/><path d="m19 12-7-7"/></svg>';
      toggle.onclick = () => document.getElementById("runway-pro-panel").classList.toggle("show");

      const panel = document.createElement("div");
      panel.id = "runway-pro-panel";
      panel.innerHTML = html;

      root.appendChild(toggle);
      root.appendChild(panel);
      document.body.appendChild(root);

      // Bind Events
      document.getElementById('close-panel').onclick = () => {
          document.getElementById('runway-pro-panel').classList.remove('show');
          document.getElementById('runway-pro-toggle').style.display = 'flex';
      };

      ['assets','search','image','prompt','remove'].forEach(t => {
          const b = document.querySelector('.btn-train[data-target="'+t+'"]');
          if(b) b.onclick = () => startTraining(t);
          const b2 = document.querySelector('.btn-test[data-target="'+t+'"]');
          if(b2) b2.onclick = () => testTarget(t);
      });
      
      document.getElementById('startAutoBtn').onclick = handleStart;
      document.getElementById('resetMemoryBtn').onclick = resetTraining;

      loadFolders();
      checkCalibration();
  }

  // --- LOGIC HELPERS ---
  function updateStatus(msg, color) {
      const el = document.getElementById('statusBox');
      if(el) { el.innerText = msg; if(color) el.style.color = color; }
  }

  function checkCalibration() {
      chrome.storage.local.get(['rw_selectors'], (res) => {
          const s = res.rw_selectors || {};
          STATE.targets.forEach(t => {
              const dot = document.getElementById('dot-'+t);
              if(dot) s[t] ? dot.classList.add('active') : dot.classList.remove('active');
          });
      });
  }

  function startTraining(target) {
      document.getElementById('runway-pro-panel').classList.remove('show');
      const banner = document.createElement('div');
      Object.assign(banner.style, { position:'fixed', top:'0', left:'0', width:'100%', padding:'20px', background:'#d946ef', color:'white', textAlign:'center', zIndex:'9999999', fontWeight:'bold' });
      banner.innerText = "CLICK ON [" + target.toUpperCase() + "]";
      document.body.appendChild(banner);

      const handler = (e) => {
          e.preventDefault(); e.stopPropagation();
          const coord = "COORD:" + e.clientX + "," + e.clientY;
          chrome.storage.local.get(['rw_selectors'], (res) => {
              const s = res.rw_selectors || {}; s[target] = coord;
              chrome.storage.local.set({rw_selectors: s}, () => {
                  banner.remove();
                  document.getElementById('runway-pro-panel').classList.add('show');
                  checkCalibration();
              });
          });
          document.removeEventListener('click', handler, true);
      };
      document.addEventListener('click', handler, true);
  }

  function testTarget(target) {
      chrome.storage.local.get(['rw_selectors'], (res) => {
          const val = (res.rw_selectors || {})[target];
          if(!val) return alert("Train first!");
          performClick(val, 1000, target==='image');
      });
  }

  function resetTraining() {
      if(confirm("Reset?")) chrome.storage.local.set({rw_selectors: {}}, checkCalibration);
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function performClick(targetData, timeout = 3000, isDoubleClick = false) {
      let el = null, x = 0, y = 0;
      if (typeof targetData === 'string' && targetData.startsWith("COORD:")) {
          const parts = targetData.split(":")[1].split(",");
          x = parseInt(parts[0]); y = parseInt(parts[1]);
          el = document.elementFromPoint(x, y);
      }
      if (!el) return false;
      const oldOutline = el.style.outline;
      el.style.outline = "2px solid #d946ef"; await sleep(150);
      const trigger = (c) => {
          const o = { bubbles:true, cancelable:true, view:window, buttons:1, clientX:x, clientY:y, detail:c };
          el.dispatchEvent(new MouseEvent('mousedown', o)); el.dispatchEvent(new MouseEvent('mouseup', o)); el.click();
      };
      trigger(1);
      if(isDoubleClick) { await sleep(50); trigger(2); }
      setTimeout(() => el.style.outline = oldOutline, 200);
      return true;
  }

  function getAuth() {
      let token = localStorage.getItem("RW_USER_TOKEN");
      if (!token) { const m = document.cookie.match(/RW_USER_TOKEN=([^;]+)/); if (m) token = m[1]; }
      return { token, teamId: localStorage.getItem("TEAM_ID") || "2493493" };
  }
  
  function normalizeName(name) { return name ? name.toLowerCase().replace(/\\.(jpg|jpeg|png|webp|mp4|mov)$/i, '').trim() : ""; }

  function parseCSV(text) {
    const rows = []; let currentRow = []; let currentCell = ''; let insideQuote = false;
    text = text.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n');
    for (let i = 0; i < text.length; i++) {
        const char = text[i], nextChar = text[i+1];
        if (insideQuote) { if (char === '"' && nextChar === '"') { currentCell += '"'; i++; } else if (char === '"') insideQuote = false; else currentCell += char; }
        else { if (char === '"') insideQuote = true; else if (char === ',') { currentRow.push(currentCell.trim()); currentCell = ''; } else if (char === '\\n') { currentRow.push(currentCell.trim()); if(currentRow.length>0) rows.push(currentRow); currentRow=[]; currentCell=''; } else currentCell += char; }
    }
    if (currentCell || currentRow.length > 0) { currentRow.push(currentCell.trim()); rows.push(currentRow); }
    const data = []; let startIdx = (rows.length > 0 && rows[0][0].toLowerCase().includes("filename")) ? 1 : 0;
    for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i]; if (row.length < 2) continue;
        data.push({ originalName: row[0], cleanName: normalizeName(row[0]), low: row[1]||"", medium: row[2]||"", high: row[3]||"" });
    }
    return data;
  }

  async function getAssetsInFolder(folderId) {
      const { token, teamId } = getAuth();
      const allAssets = []; let cursor = null;
      updateStatus("Fetching Assets...", "#38bdf8");
      do {
          let url = "https://api.runwayml.com/v2/assets?limit=500&asTeamId="+teamId+"&privateInTeam=true&parentAssetGroupId="+folderId+"&mediaTypes%5B%5D=image";
          if(cursor) url += "&cursor="+cursor;
          const res = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
          const json = await res.json();
          allAssets.push(...(json.assets || []));
          cursor = json.nextCursor;
      } while(cursor);
      return allAssets;
  }

  async function loadFolders() {
      const sel = document.getElementById('folderSelect');
      const { token, teamId } = getAuth();
      if (!token) return sel.innerHTML = '<option>Not Logged In</option>';
      try {
          const res = await fetch("https://api.runwayml.com/v1/asset_groups?privateInTeam=true&asTeamId="+teamId, { headers: { "Authorization": "Bearer " + token } });
          const json = await res.json();
          sel.innerHTML = '';
          (json.assetGroups || []).forEach(g => { const opt = document.createElement('option'); opt.value = g.id; opt.textContent = g.name; sel.appendChild(opt); });
      } catch(e) { sel.innerHTML = '<option>Error</option>'; }
  }

  async function handleStart() {
      const folderId = document.getElementById('folderSelect').value;
      const fileInput = document.getElementById('csvFile');
      const styleKey = document.getElementById('promptStyle').value;
      if(!folderId || !fileInput.files[0]) return alert("Please select a Folder and Upload a CSV.");
      
      const res = await chrome.storage.local.get(['rw_selectors']);
      const s = res.rw_selectors || {};
      if(!s.assets || !s.search || !s.prompt) return alert("Please Train Assets, Search, and Prompt first.");

      STATE.stopRequested = false;
      document.getElementById('startAutoBtn').style.display = 'none';

      try {
          const text = await fileInput.files[0].text();
          const csvRows = parseCSV(text);
          const assets = await getAssetsInFolder(folderId);
          if(assets.length === 0) throw new Error("Folder empty.");
          
          updateStatus("Matching...", "#fbbf24");
          const queue = [];
          csvRows.forEach(row => {
              const match = assets.find(a => normalizeName(a.name).includes(row.cleanName) || row.cleanName.includes(normalizeName(a.name)));
              if(match) queue.push({ assetName: match.name, cleanName: row.cleanName, prompt: row[styleKey] || row.medium || row.low || "" });
          });
          if(queue.length === 0) throw new Error("No matches found.");
          
          const rangeVal = document.getElementById('delayPreset').value;
          const [min, max] = rangeVal.split("-").map(Number);
          await runQueue(queue, {min, max}, s);

      } catch(e) { updateStatus("Error: " + e.message, "#ef4444"); } 
      finally { document.getElementById('startAutoBtn').style.display = 'block'; }
  }

  async function runQueue(queue, randomDelay, selectors) {
      for (let i = 0; i < queue.length; i++) {
          if (STATE.stopRequested) break;
          while(STATE.isPaused) { updateStatus("PAUSED", "#fbbf24"); await sleep(1000); }

          const item = queue[i];
          updateStatus("Job "+(i+1)+"/"+queue.length+": "+item.cleanName, "#38bdf8");
          document.getElementById('rf-progress-fill').style.width = ((i+1)/queue.length)*100+"%";
          
          // Queue Wait
          while(document.body.innerText.includes("Queued") || document.body.innerText.includes("Generating...")) {
              if (STATE.stopRequested) break;
              updateStatus("Queue Busy...", "#fbbf24");
              await sleep(2000);
          }

          // Remove
          if(i > 0 && selectors.remove) {
              await performClick(selectors.remove, 1500);
              await sleep(2000);
          }

          // Assets
          await performClick(selectors.assets, 1000); await sleep(3000);

          // Search
          if(await performClick(selectors.search, 1000)) {
             const el = document.activeElement;
             el.focus(); document.execCommand('selectAll'); document.execCommand('delete');
             document.execCommand('insertText', false, item.cleanName);
             await sleep(3500);
          }

          // Image
          if(!await performClick(selectors.image, 1000)) {
             // Grid fallback
             let grid = document.querySelector('div[data-testid="asset-grid-item"]');
             if(grid) { grid.click(); await sleep(50); grid.click(); }
          }
          await sleep(2000);

          // Prompt
          if(await performClick(selectors.prompt, 1000)) {
             document.execCommand('selectAll'); document.execCommand('delete');
             document.execCommand('insertText', false, item.prompt.replace(/^"|"$/g, ''));
             await sleep(2000);
          }

          // Generate
          const btns = Array.from(document.querySelectorAll('button'));
          const genBtn = btns.find(b => b.innerText.trim().toLowerCase().startsWith('generate'));
          if(genBtn) genBtn.click();
          
          // Cooldown
          const waitTime = Math.floor(Math.random() * (randomDelay.max - randomDelay.min + 1) + randomDelay.min);
          for(let s=waitTime; s>0; s--) { if(STATE.stopRequested) break; updateStatus("Cooldown: "+s+"s", "#fbbf24"); await sleep(1000); }
      }
      updateStatus(STATE.stopRequested ? "Stopped." : "Batch Complete!", STATE.stopRequested ? "#ef4444" : "#22c55e");
  }

  // Auto-Open
  setTimeout(() => {
      createFloatingUI();
      document.getElementById('runway-pro-panel').classList.add('show');
      document.getElementById('runway-pro-toggle').style.display = 'none';
  }, 500);

})();
\`;
