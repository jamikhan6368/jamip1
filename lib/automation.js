// lib/automation.js - V146: SYNTAX PROOF VERSION

const clientCode = () => {
    // --- PREVENT DOUBLE LOAD ---
    if (window.runwayProLoaded) return;
    window.runwayProLoaded = true;
    console.log("Runway Pro: App Loaded Successfully");

    // --- CONFIG ---
    const API_BASE = "https://jamip1.vercel.app/api";
    const QR_PAK = "https://i.imgur.com/YourPakQR.png";
    const QR_INT = "https://i.imgur.com/YourBinanceQR.png";

    const STATE = {
        isRunning: false,
        stopRequested: false,
        isPaused: false,
        theme: localStorage.getItem('rw_theme') || 'dark',
        targets: ['assets', 'search', 'image', 'prompt', 'remove']
    };

    // --- CSS & HTML ---
    // We use standard strings here to avoid syntax errors
    const CSS_STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        #runway-pro-root { position: fixed; top: 50%; right: 20px; transform: translateY(-50%); z-index: 2147483647; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: flex-end; --bg-panel: #0b0b0f; --bg-input: #131316; --border-color: #27272a; --text-main: #e2e8f0; --text-muted: #94a3b8; --accent-cyan: #06b6d4; --accent-pink: #d946ef; --radius-lg: 12px; --gradient-title: linear-gradient(90deg, #38bdf8, #818cf8); --gradient-primary: linear-gradient(135deg, #0ea5e9, #3b82f6); }
        #runway-pro-root.light-mode { --bg-panel: #f8fafc; --bg-input: #e2e8f0; --border-color: #cbd5e1; --text-main: #0f172a; --text-muted: #64748b; --accent-cyan: #0891b2; --accent-pink: #c026d3; }
        #runway-pro-toggle { width: 60px; height: 60px; border-radius: 50%; background: var(--bg-panel); border: 1px solid var(--border-color); color: var(--accent-pink); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: 0.2s; pointer-events: auto; }
        #runway-pro-toggle:hover { transform: scale(1.1); border-color: var(--accent-cyan); }
        #runway-pro-panel { width: 500px; background: var(--bg-panel); color: var(--text-main); border: 1px solid var(--border-color); border-radius: var(--radius-lg); display: none; flex-direction: column; box-shadow: 0 30px 80px rgba(0,0,0,0.9); pointer-events: auto; max-height: 90vh; overflow-y: auto; padding: 25px; }
        #runway-pro-panel.show { display: flex; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
        .brand-title { font-size: 18px; font-weight: 800; background: var(--gradient-title); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .panel { background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
        .section-label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.1em; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 5px; }
        .main-input, .styled-select { width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); padding: 10px; border-radius: 8px; outline: none; font-size: 12px; margin-bottom: 5px; }
        .btn-primary { background: var(--gradient-primary); color: white; width: 100%; padding: 12px; font-size: 13px; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; margin-top: 10px; }
        .train-grid { display: grid; grid-template-columns: 1fr; gap: 6px; }
        .train-row { display: flex; justify-content: space-between; align-items: center; background: var(--bg-input); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; margin-right: 8px; display: inline-block; }
        .status-dot.active { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .btn-mini { padding: 4px 10px; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border-color); border-radius: 4px; font-size: 10px; cursor: pointer; margin-left: 5px; }
        .rf-progress-bg { width: 100%; height: 4px; background: var(--bg-input); border-radius: 2px; margin-top: 10px; overflow: hidden; }
        .rf-progress-fill { width: 0%; height: 100%; background: #22c55e; transition: width 0.3s; }
        .social-row { display: flex; gap: 6px; }
        .social-btn { padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border-color); text-decoration: none; font-size: 10px; }
        #runway-status-pill { position: fixed; bottom: 30px; right: 100px; z-index: 2147483648; background: var(--bg-panel); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 50px; color: var(--text-main); font-size: 12px; font-weight: 600; box-shadow: 0 5px 15px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 8px; transform: translateY(20px); opacity: 0; transition: all 0.3s ease; pointer-events: none; }
        #runway-status-pill.visible { transform: translateY(0); opacity: 1; }
        .pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; box-shadow: 0 0 6px rgba(148, 163, 184, 0.5); }
        .pill-dot.pulse { animation: pillPulse 1.5s infinite; }
        @keyframes pillPulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    `;

    const HTML_TEMPLATE = `
      <div class="app-shell">
        <div class="header">
          <div><div class="brand-title">Runway Pro</div><div style="font-size:10px; color:#94a3b8;">Automation Suite</div></div>
          <div style="display:flex; gap:10px; align-items:center;">
             <div class="social-row">
                <a href="#" class="social-btn">YT</a>
                <a href="#" class="social-btn">WA</a>
             </div>
             <div id="btn-theme" style="cursor:pointer; font-size:16px;">☀️</div>
             <div id="close-panel" style="cursor:pointer; font-size:18px; color:#94a3b8;">✕</div>
          </div>
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
          <div style="display:flex; gap:8px; margin-top:8px;">
             <button id="pauseAutoBtn" class="btn-mini" style="flex:1; padding:8px;">Pause</button>
             <button id="stopAutoBtn" class="btn-mini" style="flex:1; padding:8px; color:#ef4444; border:1px solid #ef4444;">Stop</button>
          </div>
          <div class="status-banner"><span id="statusBox">Ready.</span></div>
          <div class="rf-progress-bg"><div class="rf-progress-fill" id="rf-progress"></div></div>
          <div style="text-align:center; margin-top:10px;">
              <button id="resetMemoryBtn" style="background:none; border:none; color:#64748b; text-decoration:underline; cursor:pointer; font-size:11px;">Reset Training</button>
          </div>
        </div>

        <div class="panel">
          <div class="section-label">ROBOT TRAINING</div>
          <div class="train-grid" id="train-container">
              </div>
        </div>
      </div>
    `;

    // --- MAIN FUNCTION ---
    function createFloatingUI() {
        if (document.getElementById("runway-pro-root")) return;

        const styleTag = document.createElement("style");
        styleTag.textContent = CSS_STYLES;
        document.head.appendChild(styleTag);

        const root = document.createElement("div");
        root.id = "runway-pro-root";
        if (STATE.theme === 'light') root.classList.add('light-mode');

        const toggle = document.createElement("div");
        toggle.id = "runway-pro-toggle";
        toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 6-2.5-2.5a2.12 2.12 0 1 0-3 3L16 9"/><path d="m16 9 3 3"/><path d="M14.5 7.5 4 18l3 3 10.5-10.5"/><path d="m19 12-7-7"/></svg>';
        toggle.onclick = () => document.getElementById("runway-pro-panel").classList.toggle("show");

        const panel = document.createElement("div");
        panel.id = "runway-pro-panel";
        panel.innerHTML = HTML_TEMPLATE;

        root.appendChild(toggle);
        root.appendChild(panel);
        document.body.appendChild(root);
        
        // Status Pill
        const pill = document.createElement("div");
        pill.id = "runway-status-pill";
        pill.innerHTML = '<div id="pill-dot" class="pill-dot"></div><span id="pill-text">Ready</span>';
        document.body.appendChild(pill);

        // Inject Training Rows
        const trainBox = document.getElementById('train-container');
        ['assets','search','image','prompt','remove'].forEach(t => {
            const row = document.createElement('div');
            row.className = 'train-row';
            row.innerHTML = `
                <div class="row-left"><span class="status-dot" id="dot-${t}"></span> <span style="font-size:12px; font-weight:500;">${t.toUpperCase()}</span></div>
                <div>
                   <button class="btn-mini btn-train">Train</button>
                   <button class="btn-mini btn-test">Test</button>
                </div>`;
            // Bind clicks manually to avoid string escaping issues
            row.querySelector('.btn-train').onclick = () => startTraining(t);
            row.querySelector('.btn-test').onclick = () => testTarget(t);
            trainBox.appendChild(row);
        });

        // Bind Global Events
        document.getElementById('close-panel').onclick = closePanel;
        document.getElementById('startAutoBtn').onclick = handleStart;
        document.getElementById('stopAutoBtn').onclick = () => { STATE.stopRequested = true; updateStatus("Stopping...", "#ef4444"); };
        document.getElementById('pauseAutoBtn').onclick = togglePause;
        document.getElementById('resetMemoryBtn').onclick = resetTraining;
        document.getElementById('theme-btn').onclick = () => {
             const r = document.getElementById('runway-pro-root');
             r.classList.toggle('light-mode');
             STATE.theme = r.classList.contains('light-mode') ? 'light' : 'dark';
             localStorage.setItem('rw_theme', STATE.theme);
             document.getElementById('theme-btn').innerText = STATE.theme === 'light' ? '🌙' : '☀️';
        };

        loadFolders();
        checkCalibration();
    }

    // --- HELPERS ---
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

    function getAuthHeader() {
        let token = localStorage.getItem("RW_USER_TOKEN");
        if (!token) { const m = document.cookie.match(/RW_USER_TOKEN=([^;]+)/); if (m) token = m[1]; }
        return token;
    }

    function normalizeName(name) { return name ? name.toLowerCase().replace(/\.(jpg|jpeg|png|webp|mp4|mov)$/i, '').trim() : ""; }

    function parseCSV(text) {
        const rows = []; const lines = text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(",");
            if(parts.length > 1) {
                 rows.push({ cleanName: normalizeName(parts[0]), prompt: parts[1].replace(/^"|"$/g, '') });
            }
        }
        return rows;
    }

    async function getAssetsInFolder(folderId) {
        const token = getAuthHeader();
        const teamId = localStorage.getItem("TEAM_ID") || "2493493";
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
        const token = getAuthHeader();
        const teamId = localStorage.getItem("TEAM_ID") || "2493493";
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
        if(!folderId || !fileInput.files[0]) return alert("Select Folder & CSV");
        
        const res = await chrome.storage.local.get(['rw_selectors']);
        const s = res.rw_selectors || {};
        if(!s.assets || !s.search || !s.prompt) return alert("Train Assets, Search, Prompt");

        STATE.stopRequested = false; STATE.isPaused = false;
        document.getElementById('startAutoBtn').style.display = 'none';

        try {
            const text = await fileInput.files[0].text();
            const csvRows = parseCSV(text);
            const assets = await getAssetsInFolder(folderId);
            if(assets.length === 0) throw new Error("Folder empty");
            
            updateStatus("Matching...", "#fbbf24");
            const queue = [];
            csvRows.forEach(row => {
                const match = assets.find(a => normalizeName(a.name).includes(row.cleanName) || row.cleanName.includes(normalizeName(a.name)));
                if(match) queue.push({ assetName: match.name, cleanName: row.cleanName, prompt: row.prompt });
            });
            
            if(queue.length === 0) throw new Error("No matches found");
            
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
            document.getElementById('rf-progress-fill').style.width = ((i+1)/queue.length)*100+"%";
            
            while(document.body.innerText.includes("Queued") || document.body.innerText.includes("Generating...")) {
                if(STATE.stopRequested) break; updateStatus("Queue Busy...", "#fbbf24"); await sleep(2000);
            }
            
            if(i > 0 && selectors.remove) { await performClick(selectors.remove, 1500); await sleep(2000); }
            
            await performClick(selectors.assets, 1000); await sleep(3000);

            if(await performClick(selectors.search, 1000)) {
               const el = document.activeElement;
               el.focus(); document.execCommand('selectAll'); document.execCommand('delete');
               document.execCommand('insertText', false, item.cleanName);
               await sleep(3500);
            }
            
            if(!await performClick(selectors.image, 1000)) {
               let grid = document.querySelector('div[data-testid="asset-grid-item"]');
               if(grid) { grid.click(); await sleep(50); grid.click(); }
            }
            await sleep(2000);

            if(await performClick(selectors.prompt, 1000)) {
               document.execCommand('selectAll'); document.execCommand('delete');
               document.execCommand('insertText', false, item.prompt);
               await sleep(2000);
            }

            const btns = Array.from(document.querySelectorAll('button'));
            const genBtn = btns.find(b => b.innerText.trim().toLowerCase().startsWith('generate'));
            if(genBtn) genBtn.click();
            
            const waitTime = Math.floor(Math.random() * (randomDelay.max - randomDelay.min + 1) + randomDelay.min);
            for(let s=waitTime; s>0; s--) { if(STATE.stopRequested) break; updateStatus("Cooldown: "+s+"s", "#fbbf24"); await sleep(1000); }
        }
        updateStatus(STATE.stopRequested ? "Stopped" : "Complete", "#22c55e");
    }

    // START
    setTimeout(() => {
        createFloatingUI();
        openPanel();
    }, 500);
};

// Export as a string to be Eval'd
module.exports = "(" + clientCode.toString() + ")()";
