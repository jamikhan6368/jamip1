// lib/automation.js - V126: SYNTAX SAFE VERSION

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

#runway-pro-root {
    position: fixed; top: 50%; right: 20px; transform: translateY(-50%);
    z-index: 2147483647; font-family: 'Inter', sans-serif;
    display: flex; flex-direction: column; align-items: flex-end;
    --bg-panel: #0b0b0f; --bg-input: #131316; --border-color: #27272a;
    --text-main: #e2e8f0; --text-muted: #94a3b8; --accent-cyan: #06b6d4;
    --accent-pink: #d946ef; --radius-lg: 12px;
    --gradient-title: linear-gradient(90deg, #38bdf8, #818cf8);
    --gradient-primary: linear-gradient(135deg, #9d4edd, #ff007f);
}
#runway-pro-root.light-mode {
    --bg-panel: #f8fafc; --bg-input: #e2e8f0; --border-color: #cbd5e1;
    --text-main: #0f172a; --text-muted: #64748b;
    --accent-cyan: #0891b2; --accent-pink: #c026d3;
}

#runway-pro-toggle {
    position: fixed; bottom: 30px; right: 30px;
    width: 60px; height: 60px; border-radius: 50%; 
    background: var(--bg-panel); border: 1px solid var(--border-color);
    color: var(--accent-pink); display: flex; align-items: center; justify-content: center; 
    cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); 
    transition: 0.2s; pointer-events: auto; z-index: 2147483648;
}
#runway-pro-toggle:hover { transform: scale(1.1); border-color: var(--accent-cyan); }

#runway-pro-panel {
    width: 500px; background: var(--bg-panel); color: var(--text-main);
    border: 1px solid var(--border-color); border-radius: var(--radius-lg); 
    display: none; flex-direction: column; 
    box-shadow: 0 30px 80px rgba(0,0,0,0.9);
    pointer-events: auto; max-height: 90vh; overflow-y: auto;
}
#runway-pro-panel.show { display: flex; }

.app-shell { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; }
.brand-title { font-size: 18px; font-weight: 800; background: var(--gradient-title); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

.social-row { display: flex; gap: 6px; }
.social-btn { padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border-color); text-decoration: none; font-size: 10px; display:flex; align-items:center; gap:4px; }
.social-btn:hover { color: white; border-color: var(--accent-cyan); }
.control-icon { cursor: pointer; padding: 6px; font-size: 16px; color: var(--text-muted); line-height: 1; }
.control-icon:hover { color: var(--text-main); }

.panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.section-label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.1em; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 4px; }

.train-grid { display: flex; flex-direction: column; gap: 8px; }
.train-row { display: flex; justify-content: space-between; align-items: center; background: var(--bg-input); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); }
.train-row:hover { border-color: var(--accent-pink); }
.row-left { display: flex; gap: 10px; align-items: center; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; }
.status-dot.active { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
.label { font-size: 12px; font-weight: 500; }

.btn { border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer; }
.btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); }
.btn-outline:hover { color: white; border-color: white; }
.btn-primary { background: var(--gradient-primary); color: white; width: 100%; padding: 14px; font-size: 13px; font-weight: 700; margin-top: 10px; border:none; cursor:pointer; }

.main-input, .styled-select { width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); padding: 10px; border-radius: 8px; outline: none; font-size: 12px; }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 5px; }
.status-banner { background: var(--bg-input); border: 1px solid var(--border-color); color: var(--accent-cyan); padding: 10px; border-radius: 8px; text-align: center; font-size: 12px; margin-top: 10px; }
.rf-progress-bg { width: 100%; height: 4px; background: var(--bg-input); border-radius: 2px; margin-top: 10px; overflow: hidden; }
.rf-progress-fill { width: 0%; height: 100%; background: #22c55e; transition: width 0.3s; }

#runway-status-pill {
    position: fixed; bottom: 35px; right: 100px; z-index: 2147483648;
    background: var(--bg-panel); border: 1px solid var(--border-color);
    padding: 10px 20px; border-radius: 50px;
    color: var(--text-main); font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3); backdrop-filter: blur(10px);
    display: flex; align-items: center; gap: 8px;
    transform: translateY(20px); opacity: 0; transition: all 0.3s ease;
    pointer-events: none;
}
#runway-status-pill.visible { transform: translateY(0); opacity: 1; }
.pill-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; box-shadow: 0 0 6px rgba(148, 163, 184, 0.5); }
.pill-dot.pulse { animation: pillPulse 1.5s infinite; }
@keyframes pillPulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
`;

const html = \`
<div class="app-shell">
  <div class="header">
    <div><div class="brand-title">Runway Pro</div><div style="font-size:10px; color:#94a3b8;">Automation Suite</div></div>
    <div class="header-right">
       <div class="social-row">
          <a href="#" class="social-btn"><span style="color:#ef4444">▶</span> YT</a>
          <a href="#" class="social-btn"><span style="color:#22c55e">💬</span> WA</a>
       </div>
       <div class="control-icon" id="theme-btn" title="Theme">☀️</div>
       <div class="control-icon" id="min-btn" title="Minimize">_</div>
       <div class="control-icon" id="close-btn" title="Close">✕</div>
    </div>
  </div>

  <div class="panel">
    <div class="section-label">RUN AUTOMATION</div>
    <select id="folderSelect" class="main-input"><option>Loading...</option></select>
    <input type="file" id="csvFile" accept=".csv" class="main-input" style="padding:6px;" />
    <div class="settings-grid">
        <div><div style="font-size:11px; color:#94a3b8; margin-bottom:4px;">Delay</div><select id="delayPreset" class="styled-select"><option value="5-8">5-8s</option><option value="8-11">8-11s</option></select></div>
        <div><div style="font-size:11px; color:#94a3b8; margin-bottom:4px;">Style</div><select id="promptStyle" class="styled-select"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
    </div>
    <button id="startAutoBtn" class="btn-primary">🚀 Start Batch</button>
    <div style="display:flex; gap:8px; margin-top:8px;">
       <button id="pauseAutoBtn" class="btn btn-outline" style="flex:1;">Pause</button>
       <button id="stopAutoBtn" class="btn btn-outline" style="flex:1; border-color:#ef4444; color:#ef4444;">Stop</button>
    </div>
    <div class="status-banner"><span id="statusBox">Ready.</span></div>
    <div class="rf-progress-bg"><div class="rf-progress-fill" id="rf-progress"></div></div>
    <button id="resetMemoryBtn" style="display:block; margin:10px auto 0; background:none; border:none; color:#64748b; text-decoration:underline; cursor:pointer; font-size:11px;">Reset Training</button>
    <input type="hidden" id="time-assets" value="5"><input type="hidden" id="time-action" value="3">
  </div>

  <div class="panel">
    <div class="section-label">ROBOT TRAINING</div>
    <div class="train-grid">
        \${['assets','search','image','prompt','remove'].map(t => \`
            <div class="train-row">
                <div class="row-left"><div class="status-dot" id="dot-\${t}"></div><span class="label">\${t.charAt(0).toUpperCase() + t.slice(1)}</span></div>
                <div>
                   <button class="btn btn-outline btn-train" data-target="\${t}">Train</button>
                   <button class="btn btn-outline btn-test" data-target="\${t}">Test</button>
                </div>
            </div>
        \`).join('')}
    </div>
  </div>
</div>
\`;

module.exports = \`
(() => {
  if (window.runwayProLoaded) return;
  window.runwayProLoaded = true;
  console.log("Runway Pro: Code Injected Successfully");

  const STATE = { isRunning: false, stopRequested: false, isPaused: false, theme: 'dark' };

  function createFloatingUI() {
      if (document.getElementById("runway-pro-root")) return;
      
      const style = document.createElement("style");
      style.textContent = \`\${css}\`;
      document.head.appendChild(style);

      const root = document.createElement("div");
      root.id = "runway-pro-root";
      
      const toggle = document.createElement("div");
      toggle.id = "runway-pro-toggle";
      toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 6-2.5-2.5a2.12 2.12 0 1 0-3 3L16 9"/><path d="m16 9 3 3"/><path d="M14.5 7.5 4 18l3 3 10.5-10.5"/><path d="m19 12-7-7"/></svg>';
      toggle.onclick = () => document.getElementById("runway-pro-panel").classList.toggle("show");

      const panel = document.createElement("div");
      panel.id = "runway-pro-panel";
      panel.innerHTML = \`\${html}\`;

      root.appendChild(toggle);
      root.appendChild(panel);
      document.body.appendChild(root);
      
      // Pill
      const pill = document.createElement("div");
      pill.id = "runway-status-pill";
      pill.innerHTML = '<div id="pill-dot" class="pill-dot"></div><span id="pill-text">Ready</span>';
      document.body.appendChild(pill);

      // Bind Events
      document.getElementById('close-btn').onclick = () => document.getElementById('runway-pro-panel').classList.remove('show');
      document.getElementById('min-btn').onclick = () => {
         document.getElementById('runway-pro-panel').classList.remove('show');
         document.getElementById('runway-pro-toggle').style.display = 'flex';
      };
      document.getElementById('theme-btn').onclick = () => {
          const r = document.getElementById('runway-pro-root');
          r.classList.toggle('light-mode');
          const isLight = r.classList.contains('light-mode');
          document.getElementById('theme-btn').innerText = isLight ? '🌙' : '☀️';
      };

      ['assets','search','image','prompt','remove'].forEach(t => {
          const b = document.querySelector('.btn-train[data-target="'+t+'"]');
          if(b) b.onclick = () => startTraining(t);
          const b2 = document.querySelector('.btn-test[data-target="'+t+'"]');
          if(b2) b2.onclick = () => testTarget(t);
      });
      
      document.getElementById('startAutoBtn').onclick = handleStart;
      document.getElementById('stopAutoBtn').onclick = () => { STATE.stopRequested = true; updateStatus("Stopping...", "#ef4444"); };
      document.getElementById('pauseAutoBtn').onclick = togglePause;
      document.getElementById('resetMemoryBtn').onclick = resetTraining;

      loadFolders();
      checkCalibration();
  }

  // --- LOGIC ---
  function openPanel() { document.getElementById('runway-pro-panel').classList.add('show'); document.getElementById('runway-pro-toggle').style.display = 'none'; }
  function closePanel() { document.getElementById('runway-pro-panel').classList.remove('show'); document.getElementById('runway-pro-toggle').style.display = 'flex'; }

  function updateStatus(msg, color) {
      const el = document.getElementById('statusBox');
      if(el) { el.innerText = msg; if(color) el.style.color = color; }
      const pill = document.getElementById('runway-status-pill');
      if(pill) {
          document.getElementById('pill-text').textContent = msg;
          pill.classList.add('visible');
          const dot = document.getElementById('pill-dot');
          if(msg.includes("Generating")) dot.classList.add("pulse"); else dot.classList.remove("pulse");
      }
  }

  function togglePause() {
      STATE.isPaused = !STATE.isPaused;
      document.getElementById('pauseAutoBtn').textContent = STATE.isPaused ? "Resume" : "Pause";
      updateStatus(STATE.isPaused ? "PAUSED" : "Resuming...", "#fbbf24");
  }

  function checkCalibration() {
      chrome.storage.local.get(['rw_selectors'], (res) => {
          const s = res.rw_selectors || {};
          ['assets','search','image','prompt','remove'].forEach(t => {
              const dot = document.getElementById('dot-'+t);
              if(dot) s[t] ? dot.classList.add('active') : dot.classList.remove('active');
          });
      });
  }

  function startTraining(target) {
      closePanel();
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
                  openPanel();
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
      if(confirm("Reset?")) { chrome.storage.local.set({rw_selectors: {}}, checkCalibration); }
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
  
  function normalizeName(name) { return name ? name.toLowerCase().replace(/\.(jpg|jpeg|png|webp|mp4|mov)$/i, '').trim() : ""; }

  function parseCSV(text) {
    const rows = []; let currentRow = []; let currentCell = ''; let insideQuote = false;
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < text.length; i++) {
        const char = text[i], nextChar = text[i+1];
        if (insideQuote) { if (char === '"' && nextChar === '"') { currentCell += '"'; i++; } else if (char === '"') insideQuote = false; else currentCell += char; }
        else { if (char === '"') insideQuote = true; else if (char === ',') { currentRow.push(currentCell.trim()); currentCell = ''; } else if (char === '\n') { currentRow.push(currentCell.trim()); if(currentRow.length>0) rows.push(currentRow); currentRow=[]; currentCell=''; } else currentCell += char; }
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

      STATE.stopRequested = false; STATE.isPaused = false;
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
      finally { document.getElementById('startAutoBtn').style.display = 'block'; setTimeout(() => document.getElementById('runway-status-pill').classList.remove('visible'), 5000); }
  }

  async function runQueue(queue, randomDelay, selectors) {
      for (let i = 0; i < queue.length; i++) {
          if (STATE.stopRequested) break;
          while(STATE.isPaused) { updateStatus("PAUSED", "#fbbf24"); await sleep(1000); }
          const item = queue[i];
          updateStatus("Job "+(i+1)+"/"+queue.length+": "+item.cleanName, "#38bdf8");
          document.getElementById('rf-progress').style.width = ((i+1)/queue.length)*100+"%";
          
          while(document.body.innerText.includes("Queued") || document.body.innerText.includes("Generating...")) {
              if (STATE.stopRequested) break;
              updateStatus("Queue Busy...", "#fbbf24");
              await sleep(2000);
          }
          if(i > 0 && selectors.remove) {
              const clicks = parseInt(document.getElementById('clicks-remove')?.value || 1);
              await performClick(selectors.remove, 1500, clicks > 1);
              await sleep(2000);
          }
          if (STATE.stopRequested) break;
          updateStatus("Opening Assets...", "#94a3b8");
          const assetsClicks = parseInt(document.getElementById('clicks-assets')?.value || 1);
          if (!await performClick(selectors.assets, 1000, assetsClicks > 1)) return updateStatus("Assets Btn Missing", "#ef4444");
          await sleep(3000);
          if (STATE.stopRequested) break;
          updateStatus("Searching...", "#94a3b8");
          if (await performClick(selectors.search, 1000)) {
              const [x, y] = selectors.search.split(":")[1].split(",").map(Number);
              let el = document.elementFromPoint(x, y);
              if(el && el.tagName !== 'INPUT') el = el.querySelector('input') || el.closest('input');
              if(el) {
                  el.focus(); document.execCommand('selectAll'); document.execCommand('delete');
                  await sleep(50);
                  document.execCommand('insertText', false, item.cleanName);
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                  await sleep(3500); 
              }
          }
          updateStatus("Selecting Image...", "#38bdf8");
          let foundImg = false;
          const imgClicks = parseInt(document.getElementById('clicks-image')?.value || 2);
          if (selectors.image) foundImg = await performClick(selectors.image, 1000, imgClicks > 1);
          if (!foundImg) {
               let gridItem = document.querySelector('div[data-testid="asset-grid-item"]');
               if(gridItem) { gridItem.scrollIntoView({block:"center"}); gridItem.click(); await sleep(50); gridItem.click(); foundImg = true; }
          }
          if (!foundImg) { updateStatus("Img Not Found", "#ef4444"); continue; }
          await sleep(2000);
          updateStatus("Typing Prompt...", "#38bdf8");
          if (await performClick(selectors.prompt, 1000)) {
              const [x, y] = selectors.prompt.split(":")[1].split(",").map(Number);
              let el = document.elementFromPoint(x, y);
              if(el && el.tagName !== 'TEXTAREA') el = el.querySelector('textarea') || el.closest('textarea') || el;
              el.focus(); document.execCommand('selectAll'); document.execCommand('delete');
              document.execCommand('insertText', false, item.prompt.replace(/^"|"$/g, ''));
              await sleep(2000);
          }
          updateStatus("Generating...", "#22c55e");
          while(true) {
              if (STATE.stopRequested) break;
              const btns = Array.from(document.querySelectorAll('button'));
              const genBtn = btns.find(b => b.innerText.trim().toLowerCase().startsWith('generate'));
              if (!genBtn) { await sleep(2000); continue; }
              const isDisabled = genBtn.disabled || genBtn.hasAttribute('disabled') || window.getComputedStyle(genBtn).cursor === 'not-allowed';
              if (isDisabled) { updateStatus("Waiting for Button...", "#fbbf24"); await sleep(3000); }
              else { genBtn.click(); await sleep(2000); break; }
          }
          const waitTime = Math.floor(Math.random() * (randomDelay.max - randomDelay.min + 1) + randomDelay.min);
          for(let s=waitTime; s>0; s--) {
              if (STATE.stopRequested) break;
              updateStatus("Cooldown: "+s+"s", "#fbbf24");
              await sleep(1000);
          }
      }
      updateStatus(STATE.stopRequested ? "Stopped." : "Batch Complete!", STATE.stopRequested ? "#ef4444" : "#22c55e");
  }

  setTimeout(() => {
      createFloatingUI();
      document.getElementById('runway-pro-panel').classList.add('show');
      document.getElementById('runway-pro-toggle').style.display = 'none';
  }, 500);

})();
\`;
