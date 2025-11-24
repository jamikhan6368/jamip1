// lib/automation.js - V140: MASTER APP (Login + Payment + Dashboard + Automation)

module.exports = `
(() => {
  // Prevent double loading
  if (window.runwayProLoaded) return;
  window.runwayProLoaded = true;

  console.log("Runway Pro: Master App Loaded");

  const API_BASE = "https://jamip1.vercel.app/api"; 
  const QR_PAK = "https://i.imgur.com/YourPakQR.png"; 
  const QR_INT = "https://i.imgur.com/YourBinanceQR.png";

  // --- 1. STATE MANAGEMENT ---
  const STATE = {
      isRunning: false,
      stopRequested: false,
      isPaused: false,
      theme: localStorage.getItem('rw_theme') || 'dark',
      targets: ['assets', 'search', 'image', 'prompt', 'remove'],
      authStatus: 'checking' // 'login', 'payment', 'pending', 'active'
  };

  // --- 2. CSS STYLES ---
  function injectStyles() {
      const style = document.createElement("style");
      style.textContent = \`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        #runway-pro-root {
            position: fixed; top: 50%; right: 20px; transform: translateY(-50%);
            z-index: 2147483647; font-family: 'Inter', sans-serif;
            display: flex; flex-direction: column; align-items: flex-end;
            --bg: #050816; --bg-panel: #0b0b0f; --bg-input: #131316;
            --border-color: #27272a; --text-main: #e2e8f0; --text-muted: #94a3b8;
            --accent-cyan: #06b6d4; --accent-pink: #d946ef;
            --gradient-title: linear-gradient(90deg, #38bdf8, #818cf8);
            --gradient-primary: linear-gradient(135deg, #0ea5e9, #3b82f6);
            --radius-lg: 12px;
        }
        #runway-pro-root.light-mode {
            --bg: #ffffff; --bg-panel: #f8fafc; --bg-input: #e2e8f0;
            --border-color: #cbd5e1; --text-main: #0f172a; --text-muted: #64748b;
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
            padding: 25px;
        }
        #runway-pro-panel.show { display: flex; }

        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .brand-title { font-size: 20px; font-weight: 800; background: var(--gradient-title); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .brand-subtitle { font-size: 11px; color: var(--text-muted); }
        
        .panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; margin-bottom:15px; }
        .section-label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.1em; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 4px; }

        .btn-primary { background: var(--gradient-primary); color: white; width: 100%; padding: 14px; font-size: 13px; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; margin-top: 10px; }
        .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; }
        .btn-gold { background: linear-gradient(135deg, #fbbf24, #d97706); color: #0f172a; width: 100%; padding: 14px; border-radius: 8px; font-weight: 700; border:none; cursor:pointer; margin-top:10px; }

        .main-input { width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); padding: 12px; border-radius: 8px; outline: none; font-size: 13px; margin-bottom: 10px; box-sizing: border-box; }
        .main-input:focus { border-color: var(--accent-cyan); }

        .tab-group { display: flex; gap: 10px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; background: var(--bg-input); text-align: center; border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--text-muted); border: 1px solid var(--border-color); }
        .tab.active { background: rgba(56, 189, 248, 0.1); border-color: var(--accent-cyan); color: var(--accent-cyan); font-weight: bold; }
        .qr-box { background: white; padding: 10px; border-radius: 10px; width: 150px; margin: 10px auto; }
        .qr-img { width: 100%; height: auto; }

        .train-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
        .train-row { display: flex; justify-content: space-between; align-items: center; background: var(--bg-input); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); }
        .row-left { display: flex; gap: 10px; align-items: center; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; }
        .status-dot.active { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
      \`;
      document.head.appendChild(style);
  }

  // =================================================
  // 3. RENDER FUNCTIONS
  // =================================================
  
  function renderLogin(errorMsg = "") {
      const panel = document.getElementById("runway-pro-panel");
      panel.innerHTML = \`
          <div class="header">
             <div class="brand-title">Runway Pro 🔒</div>
             <div onclick="document.getElementById('runway-pro-panel').classList.remove('show')" style="cursor:pointer; padding:5px;">✕</div>
          </div>
          <div style="text-align:center; padding: 40px 0;">
              <div style="font-size:40px; margin-bottom:15px;">👋</div>
              <p style="color:var(--text-muted); font-size:14px;">Please sign in to access the automation suite.</p>
          </div>
          <button id="rw-login-btn" class="btn-primary">Sign in with Google</button>
          <div style="color:#ef4444; font-size:12px; text-align:center; margin-top:15px;">\${errorMsg}</div>
      \`;
      document.getElementById("rw-login-btn").onclick = handleGoogleLogin;
  }

  function renderPayment() {
      const panel = document.getElementById("runway-pro-panel");
      panel.innerHTML = \`
          <div class="header">
             <div class="brand-title">Unlock Access 🔓</div>
             <div onclick="document.getElementById('runway-pro-panel').classList.remove('show')" style="cursor:pointer; padding:5px;">✕</div>
          </div>
          
          <div class="tab-group">
              <div id="tab-pak" class="tab active">🇵🇰 Pakistan</div>
              <div id="tab-intl" class="tab">🌍 Global</div>
          </div>

          <div class="panel" style="text-align:center;">
              <h3 id="price-tag" style="margin:0; color:#fbbf24;">1,000 PKR</h3>
              <p style="font-size:11px; color:var(--text-muted); margin:5px 0;">30 Days Access</p>
              <div class="qr-box"><img id="qr-img" src="\${QR_PAK}" class="qr-img"></div>
              <p id="pay-instruct" style="font-size:11px; color:var(--text-muted);">Scan with JazzCash / EasyPaisa</p>
          </div>

          <input id="rw-trx" class="main-input" placeholder="Enter Transaction ID (TRX)">
          <button id="rw-pay-btn" class="btn-gold">Verify Payment</button>
          <div style="text-align:center; margin-top:15px;">
            <button id="rw-logout" class="btn-outline">Logout</button>
          </div>
      \`;

      let method = 'local';
      document.getElementById('tab-pak').onclick = (e) => { 
          method='local'; 
          document.getElementById('qr-img').src = QR_PAK; 
          document.getElementById('price-tag').innerText = "1,000 PKR";
          document.getElementById('pay-instruct').innerText = "Scan with JazzCash / EasyPaisa";
          document.getElementById('tab-pak').classList.add('active'); document.getElementById('tab-intl').classList.remove('active');
      };
      document.getElementById('tab-intl').onclick = (e) => { 
          method='intl'; 
          document.getElementById('qr-img').src = QR_INT; 
          document.getElementById('price-tag').innerText = "$10 USD";
          document.getElementById('pay-instruct').innerText = "Scan with Binance / USDT";
          document.getElementById('tab-intl').classList.add('active'); document.getElementById('tab-pak').classList.remove('active');
      };

      document.getElementById('rw-pay-btn').onclick = () => submitPayment(method);
      document.getElementById('rw-logout').onclick = logout;
  }

  function renderPending() {
      const panel = document.getElementById("runway-pro-panel");
      panel.innerHTML = \`
          <div class="header">
             <div class="brand-title">Pending Approval ⏳</div>
             <div onclick="document.getElementById('runway-pro-panel').classList.remove('show')" style="cursor:pointer; padding:5px;">✕</div>
          </div>
          <div style="text-align:center; padding: 40px 0;">
              <p style="color:var(--text-muted); font-size:14px;">We are verifying your payment.<br>This usually takes 15-30 mins.</p>
              <button id="rw-check-btn" class="btn-primary">Refresh Status</button>
              <button id="rw-logout" class="btn-outline" style="margin-top:20px;">Logout</button>
          </div>
      \`;
      document.getElementById('rw-check-btn').onclick = () => checkAuth(localStorage.getItem('rw_auth_token'));
      document.getElementById('rw-logout').onclick = logout;
  }

  function renderDashboard() {
      const panel = document.getElementById("runway-pro-panel");
      panel.innerHTML = \`
        <div class="header">
          <div><div class="brand-title">Runway Pro</div><div style="font-size:10px; color:#94a3b8;">Automation Active</div></div>
          <div style="display:flex; gap:10px;">
             <div class="control-icon" id="theme-btn">\${STATE.theme==='dark'?'☀️':'🌙'}</div>
             <div onclick="document.getElementById('runway-pro-panel').classList.remove('show')" style="cursor:pointer; padding:5px; font-size:18px;">✕</div>
          </div>
        </div>

        <div class="panel">
            <div class="section-label">RUN AUTOMATION</div>
            <select id="folderSelect" class="main-input"><option>Loading Folders...</option></select>
            <input type="file" id="csvFile" accept=".csv" class="main-input" />
            <div style="display:flex; gap:10px;">
                <select id="delayPreset" class="main-input" style="flex:1;"><option value="5-8">5-8s Delay</option><option value="8-11">8-11s Delay</option></select>
                <select id="promptStyle" class="main-input" style="flex:1;"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
            </div>
            <button id="startAutoBtn" class="btn-primary">🚀 Start Batch</button>
            <div style="display:flex; gap:8px; margin-top:8px;">
               <button id="pauseAutoBtn" class="btn-outline" style="flex:1;">Pause</button>
               <button id="stopAutoBtn" class="btn-outline" style="flex:1; border-color:#ef4444; color:#ef4444;">Stop</button>
            </div>
            <div id="statusBox" style="text-align:center; margin-top:10px; font-size:12px; color:#38bdf8;">Ready.</div>
        </div>

        <div class="panel">
            <div class="section-label">TRAINING</div>
            <div class="train-grid">
                \${['assets','search','image','prompt','remove'].map(t => \`
                    <div class="train-row">
                        <div class="row-left"><span class="status-dot" id="dot-\${t}"></span> <span style="font-size:12px; font-weight:500;">\${t.toUpperCase()}</span></div>
                        <div>
                           <button class="btn-outline" style="padding:4px 8px; font-size:10px;" onclick="window.startTraining('\${t}')">Train</button>
                           <button class="btn-outline" style="padding:4px 8px; font-size:10px;" onclick="window.testTarget('\${t}')">Test</button>
                        </div>
                    </div>
                \`).join('')}
            </div>
            <div style="text-align:center; margin-top:15px;">
              <button id="rw-logout" style="background:none; border:none; color:var(--text-muted); text-decoration:underline; cursor:pointer; font-size:11px;">Logout</button>
            </div>
        </div>
      \`;

      // Bind Dashboard Events
      document.getElementById('startAutoBtn').onclick = handleStart;
      document.getElementById('stopAutoBtn').onclick = () => { STATE.stopRequested = true; updateStatus("Stopping...", "#ef4444"); };
      document.getElementById('pauseAutoBtn').onclick = togglePause;
      document.getElementById('rw-logout').onclick = logout;
      document.getElementById('theme-btn').onclick = toggleTheme;

      // Expose global functions
      window.startTraining = startTraining;
      window.testTarget = testTarget;

      loadFolders();
      checkCalibration();
  }

  // =================================================
  // 4. CORE AUTH LOGIC
  // =================================================
  
  function init() {
      injectStyles();

      const root = document.createElement("div");
      root.id = "runway-pro-root";

      const toggle = document.createElement("div");
      toggle.id = "runway-pro-toggle";
      toggle.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 6-2.5-2.5a2.12 2.12 0 1 0-3 3L16 9"/><path d="m16 9 3 3"/><path d="M14.5 7.5 4 18l3 3 10.5-10.5"/><path d="m19 12-7-7"/></svg>';
      toggle.onclick = () => document.getElementById("runway-pro-panel").classList.toggle("show");

      const panel = document.createElement("div");
      panel.id = "runway-pro-panel";
      
      root.appendChild(toggle);
      root.appendChild(panel);
      document.body.appendChild(root);

      // Determine Start State
      const token = localStorage.getItem('rw_auth_token');
      if (token) checkAuth(token);
      else {
          renderLogin();
          panel.classList.add('show'); // Show Login
          toggle.style.display = 'none';
      }
  }

  function getDeviceId() {
      let id = localStorage.getItem("RW_DEVICE_ID");
      if (!id) { id = 'dev_' + Math.random().toString(36).substr(2, 9); localStorage.setItem("RW_DEVICE_ID", id); }
      return id;
  }

  function handleGoogleLogin() {
      document.getElementById("rw-login-btn").innerText = "Opening Window...";
      window.postMessage({ type: "RW_OPEN_LOGIN" }, "*");
  }

  async function checkAuth(token) {
      try {
          const res = await fetch(\`\${API_BASE}/auth?device=\${getDeviceId()}&googleToken=\${token}\`);
          if (res.status === 200) {
              localStorage.setItem('rw_auth_token', token);
              renderDashboard();
              document.getElementById("runway-pro-panel").classList.add('show');
              document.getElementById('runway-pro-toggle').style.display = 'none';
          } else if (res.status === 402) {
              renderPayment();
              document.getElementById("runway-pro-panel").classList.add('show');
          } else {
              const json = await res.json();
              if (json.error.includes('PENDING')) {
                  renderPending();
                  document.getElementById("runway-pro-panel").classList.add('show');
              } else {
                  logout(); 
              }
          }
      } catch (e) {
          if(document.getElementById('rw-error')) document.getElementById('rw-error').innerText = "Connection Error";
      }
  }

  async function submitPayment(method) {
      const trx = document.getElementById('rw-trx').value.trim();
      if(!trx) return alert("Enter Transaction ID");
      const token = localStorage.getItem('rw_auth_token');
      
      try {
          await fetch(\`\${API_BASE}/auth\`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ googleToken: token, transactionId: trx, method, device: getDeviceId() })
          });
          renderPending();
      } catch(e) { alert("Error submitting"); }
  }

  function logout() {
      localStorage.removeItem('rw_auth_token');
      renderLogin();
  }
  
  function toggleTheme() {
      const r = document.getElementById('runway-pro-root');
      r.classList.toggle('light-mode');
      const isLight = r.classList.contains('light-mode');
      document.getElementById('theme-btn').innerText = isLight ? '🌙' : '☀️';
      localStorage.setItem('rw_theme', isLight ? 'light' : 'dark');
  }

  // =================================================
  // 5. AUTOMATION LOGIC
  // =================================================
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

  async function getAssetsInFolder(folderId) {
      const token = getAuthHeader();
      const teamId = localStorage.getItem("TEAM_ID") || "2493493";
      const allAssets = []; let cursor = null;
      updateStatus("Fetching Assets...", "#38bdf8");
      do {
          let url = \`https://api.runwayml.com/v2/assets?limit=500&asTeamId=\${teamId}&privateInTeam=true&parentAssetGroupId=\${folderId}&mediaTypes%5B%5D=image\`;
          if(cursor) url += \`&cursor=\${cursor}\`;
          const res = await fetch(url, { headers: { "Authorization": \`Bearer \${token}\` } });
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
          const res = await fetch(\`https://api.runwayml.com/v1/asset_groups?privateInTeam=true&asTeamId=\${teamId}\`, { headers: { "Authorization": \`Bearer \${token}\` } });
          const json = await res.json();
          sel.innerHTML = '';
          (json.assetGroups || []).forEach(g => { const opt = document.createElement('option'); opt.value = g.id; opt.textContent = g.name; sel.appendChild(opt); });
      } catch(e) { sel.innerHTML = '<option>Error</option>'; }
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

  function updateStatus(msg, color) {
      const el = document.getElementById('statusBox');
      if(el) { el.innerText = msg; if(color) el.style.color = color; }
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

  async function handleStart() {
      const folderId = document.getElementById('folderSelect').value;
      const fileInput = document.getElementById('csvFile');
      const styleKey = document.getElementById('promptStyle').value;
      if(!folderId || !fileInput.files[0]) return alert("Please select Folder & CSV");
      
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
              if(match) queue.push({ assetName: match.name, cleanName: row.cleanName, prompt: row[styleKey] || row.medium || row.low || "" });
          });
          if(queue.length === 0) throw new Error("No matches");
          
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
          
          // 1. Wait Queue
          while(document.body.innerText.includes("Queued") || document.body.innerText.includes("Generating...")) {
              if(STATE.stopRequested) break; await sleep(2000);
          }
          
          // 2. Remove
          if(i > 0 && selectors.remove) { await performClick(selectors.remove, 1500); await sleep(2000); }

          // 3. Assets
          await performClick(selectors.assets, 1000); await sleep(3000);

          // 4. Search
          if(await performClick(selectors.search, 1000)) {
             const el = document.activeElement;
             el.focus(); document.execCommand('selectAll'); document.execCommand('delete');
             document.execCommand('insertText', false, item.cleanName);
             await sleep(3500);
          }

          // 5. Image
          if(!await performClick(selectors.image, 1000)) {
             // Grid fallback
             let grid = document.querySelector('div[data-testid="asset-grid-item"]');
             if(grid) { grid.click(); await sleep(50); grid.click(); }
          }
          await sleep(2000);

          // 6. Prompt
          if(await performClick(selectors.prompt, 1000)) {
             document.execCommand('selectAll'); document.execCommand('delete');
             document.execCommand('insertText', false, item.prompt.replace(/^"|"$/g, ''));
             await sleep(2000);
          }

          // 7. Generate
          const btns = Array.from(document.querySelectorAll('button'));
          const genBtn = btns.find(b => b.innerText.trim().toLowerCase().startsWith('generate'));
          if(genBtn) genBtn.click();
          
          // 8. Cooldown
          const waitTime = Math.floor(Math.random() * (randomDelay.max - randomDelay.min + 1) + randomDelay.min);
          for(let s=waitTime; s>0; s--) { if(STATE.stopRequested) break; updateStatus("Cooldown: "+s+"s", "#fbbf24"); await sleep(1000); }
      }
      updateStatus(STATE.stopRequested ? "Stopped" : "Complete", "#22c55e");
  }

  // Wait for token listeners
  setTimeout(() => {
      window.addEventListener("message", (event) => {
          if (event.data.type === "RW_UPDATE_TOKEN") {
              CACHED_TOKEN = event.data.token;
              checkAuth(CACHED_TOKEN);
          }
      });
      init();
  }, 500);

})();
\`;
