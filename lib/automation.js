// lib/automation.js - V144: MASTER APP (UI + AUTH + AUTOMATION)

module.exports = `
(() => {
  // Prevent double loading
  if (window.runwayProLoaded) return;
  window.runwayProLoaded = true;

  console.log("Runway Pro: Master App Loaded");

  const API_BASE = "https://jamip1.vercel.app/api"; 
  // ⚠️ REPLACE WITH YOUR IMAGES
  const QR_PAK = "https://i.imgur.com/YourPakQR.png"; 
  const QR_INT = "https://i.imgur.com/YourBinanceQR.png";

  const STATE = {
      isRunning: false,
      stopRequested: false,
      isPaused: false,
      theme: localStorage.getItem('rw_theme') || 'dark',
      targets: ['assets', 'search', 'image', 'prompt', 'remove'],
      token: localStorage.getItem('rw_auth_token')
  };

  // =================================================
  // 1. UI CONSTRUCTION
  // =================================================
  function createFloatingUI() {
      if (document.getElementById("runway-pro-root")) return;

      const style = document.createElement("style");
      // ESCAPED BACKTICKS for Vercel Compatibility
      style.textContent = \`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        #runway-pro-root {
            position: fixed; top: 50%; right: 20px; transform: translateY(-50%);
            z-index: 2147483647; font-family: 'Inter', sans-serif;
            display: flex; flex-direction: column; align-items: flex-end;
            --bg-panel: #0b0b0f; --bg-input: #131316; --border-color: #27272a;
            --text-main: #e2e8f0; --text-muted: #94a3b8; --accent-cyan: #06b6d4;
            --accent-pink: #d946ef; --radius-lg: 12px;
            --gradient-title: linear-gradient(90deg, #38bdf8, #818cf8);
            --gradient-primary: linear-gradient(135deg, #0ea5e9, #3b82f6);
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
        #runway-pro-toggle svg { width: 28px; height: 28px; }

        #runway-pro-panel {
            width: 500px; background: var(--bg-panel); color: var(--text-main);
            border: 1px solid var(--border-color); border-radius: var(--radius-lg); 
            display: none; flex-direction: column; 
            box-shadow: 0 30px 80px rgba(0,0,0,0.9);
            pointer-events: auto; max-height: 90vh; overflow-y: auto;
            padding: 25px;
        }
        #runway-pro-panel.show { display: flex; }

        .app-shell { padding: 0; display: flex; flex-direction: column; gap: 16px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .brand-title { font-size: 18px; font-weight: 800; background: var(--gradient-title); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .brand-subtitle { font-size: 10px; color: var(--text-muted); }

        .header-right { display: flex; align-items: center; gap: 8px; }
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
        .btn-gold { background: linear-gradient(135deg, #fbbf24, #d97706); color: #0f172a; width: 100%; padding: 14px; border-radius: 8px; font-weight: 700; border:none; cursor:pointer; margin-top:10px; }

        .main-input, .styled-select { width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); padding: 10px; border-radius: 8px; outline: none; font-size: 12px; }
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 5px; }
        
        .status-banner { background: var(--bg-input); border: 1px solid var(--border-color); color: var(--accent-cyan); padding: 10px; border-radius: 8px; text-align: center; font-size: 12px; margin-top: 10px; }
        .rf-progress-bg { width: 100%; height: 4px; background: var(--bg-input); border-radius: 2px; margin-top: 10px; overflow: hidden; }
        .rf-progress-fill { width: 0%; height: 100%; background: #22c55e; transition: width 0.3s; }
        
        .tab-group { display: flex; gap: 10px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; background: var(--bg-input); text-align: center; border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--text-muted); border: 1px solid var(--border-color); }
        .tab.active { background: rgba(56, 189, 248, 0.1); border-color: var(--accent-cyan); color: var(--accent-cyan); font-weight: bold; }
        .qr-box { text-align: center; background: white; padding: 10px; border-radius: 10px; width: 150px; margin: 10px auto; }
        .qr-img { width: 100%; height: auto; }
        
        /* PILL */
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
      \`;
      document.head.appendChild(style);

      const root = document.createElement("div");
      root.id = "runway-pro-root";
      if(STATE.theme === 'light') root.classList.add('light-mode');

      const toggle = document.createElement("div");
      toggle.id = "runway-pro-toggle";
      toggle.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 6-2.5-2.5a2.12 2.12 0 1 0-3 3L16 9"/><path d="m16 9 3 3"/><path d="M14.5 7.5 4 18l3 3 10.5-10.5"/><path d="m19 12-7-7"/></svg>\`;
      toggle.onclick = () => document.getElementById("runway-pro-panel").classList.toggle("show");

      const panel = document.createElement("div");
      panel.id = "runway-pro-panel";
      
      root.appendChild(toggle);
      root.appendChild(panel);
      document.body.appendChild(root);

      // PILL
      const pill = document.createElement("div");
      pill.id = "runway-status-pill";
      pill.innerHTML = \`<div id="pill-dot" class="pill-dot"></div><span id="pill-text">Ready</span>\`;
      document.body.appendChild(pill);

      // Decide what to render based on token/auth
      if(STATE.token) {
          checkAuth(STATE.token);
      } else {
          renderLogin();
          panel.classList.add('show');
          toggle.style.display = 'none';
      }
  }

  // =================================================
  // 3. RENDERERS
  // =================================================

  function renderLogin(msg="") {
      const panel = document.getElementById("runway-pro-panel");
      panel.innerHTML = \`
        <div class="app-shell">
            <div class="header">
                 <div><div class="brand-title">Runway Pro 🔒</div><div style="font-size:10px; color:#94a3b8;">Locked</div></div>
                 <div onclick="togglePanel()" style="cursor:pointer; padding:5px;">✕</div>
            </div>
            <div style="text-align:center; padding:40px 0;">
               <div style="font-size:40px; margin-bottom:15px;">👋</div>
               <p style="color:var(--text-muted); font-size:13px;">Sign in to access automation tools.</p>
               <div style="color:#ef4444; font-size:12px; margin:10px 0;">\${msg}</div>
               <button id="btn-google" class="btn-primary">Sign in with Google</button>
            </div>
        </div>\`;
      document.getElementById('btn-google').onclick = handleGoogleLogin;
  }

  function renderPayment() {
      const panel = document.getElementById("runway-pro-panel");
      panel.innerHTML = \`
        <div class="app-shell">
            <div class="header">
                 <div><div class="brand-title">Unlock Access 🔓</div><div style="font-size:10px; color:#94a3b8;">Subscription Required</div></div>
                 <div onclick="togglePanel()" style="cursor:pointer; padding:5px;">✕</div>
            </div>
            <div class="tab-group">
                <div id="tab-pak" class="tab active">🇵🇰 Pakistan</div>
                <div id="tab-intl" class="tab">🌍 Global</div>
            </div>
            <div class="panel" style="text-align:center;">
                <h3 id="price-tag" style="margin:0; color:var(--accent-cyan);">1,000 PKR</h3>
                <div class="qr-box"><img id="qr-img" src="\${QR_PAK}" class="qr-img"></div>
                <p id="pay-instruct" style="font-size:11px; color:var(--text-muted);">Scan with JazzCash</p>
            </div>
            <input id="inp-trx" class="main-input" placeholder="Enter Transaction ID (TRX)">
            <button id="btn-verify" class="btn-gold">Verify Payment</button>
            <div style="text-align:center; margin-top:10px;"><button id="btn-logout" style="background:none; border:none; color:#64748b; text-decoration:underline; cursor:pointer;">Logout</button></div>
        </div>\`;
      
      let method='local';
      document.getElementById('tab-pak').onclick=()=>{ method='local'; document.getElementById('qr-img').src=QR_PAK; document.getElementById('price-tag').innerText="1,000 PKR"; document.getElementById('pay-instruct').innerText="Scan with JazzCash"; document.getElementById('tab-pak').className='tab active'; document.getElementById('tab-intl').className='tab'; };
      document.getElementById('tab-intl').onclick=()=>{ method='intl'; document.getElementById('qr-img').src=QR_INT; document.getElementById('price-tag').innerText="$10 USD"; document.getElementById('pay-instruct').innerText="Scan with Binance"; document.getElementById('tab-intl').className='tab active'; document.getElementById('tab-pak').className='tab'; };
      
      document.getElementById('btn-verify').onclick = () => submitPayment(method);
      document.getElementById('btn-logout').onclick = logout;
  }

  function renderPending() {
      const panel = document.getElementById("runway-pro-panel");
      panel.innerHTML = \`
        <div class="app-shell">
            <div class="header">
                 <div><div class="brand-title">Pending Approval ⏳</div></div>
                 <div onclick="togglePanel()" style="cursor:pointer; padding:5px;">✕</div>
            </div>
            <div style="text-align:center; padding:40px 0;">
               <p style="color:var(--text-muted); font-size:13px;">Admin is verifying your payment.</p>
               <button id="btn-refresh" class="btn-primary">Check Status</button>
               <button id="btn-logout" class="btn-outline" style="margin-top:20px;">Logout</button>
            </div>
        </div>\`;
      document.getElementById('btn-refresh').onclick = () => checkAuth(STATE.token);
      document.getElementById('btn-logout').onclick = logout;
  }

  function renderDashboard() {
      const panel = document.getElementById("runway-pro-panel");
      panel.innerHTML = \`
        <div class="app-shell">
          <div class="header">
            <div><div class="brand-title">Runway Pro</div><div style="font-size:10px; color:#94a3b8;">Automation Suite</div></div>
            <div class="header-right">
               <div class="social-row">
                  <a href="https://www.youtube.com/channel/UC7otDLkBsEsMstspQN6FpWw" target="_blank" class="social-btn"><span style="color:#ef4444">▶</span> YT</a>
                  <a href="https://chat.whatsapp.com/F022Xf2DFAr3seGowwlUN5" target="_blank" class="social-btn"><span style="color:#22c55e">💬</span> WA</a>
               </div>
               <div class="control-icon" id="theme-btn" title="Toggle Theme">\${STATE.theme==='dark' ? '☀️' : '🌙'}</div>
               <div class="control-icon" id="min-btn" title="Minimize">_</div>
               <div class="control-icon" id="close-btn" title="Close">✕</div>
            </div>
          </div>

          <div class="panel">
            <div class="section-label">RUN AUTOMATION</div>
            <select id="folderSelect" class="main-input"><option>Loading Folders...</option></select>
            <input type="file" id="csvFile" accept=".csv" class="main-input" style="padding:6px;" />
            <div class="settings-grid">
                <div><div style="font-size:11px; color:#94a3b8; margin-bottom:4px;">Delay</div><select id="delayPreset" class="styled-select"><option value="5-8">5-8s</option><option value="8-11">8-11s</option></select></div>
                <div><div style="font-size:11px; color:#94a3b8; margin-bottom:4px;">Style</div><select id="promptStyle" class="styled-select"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            </div>
            <button id="startAutoBtn" class="btn-primary">🚀 Start Batch</button>
            <div style="display:flex; gap:8px; margin-top:8px;">
               <button id="pauseAutoBtn" class="btn-outline" style="flex:1;">Pause</button>
               <button id="stopAutoBtn" class="btn-outline" style="flex:1; border-color:#ef4444; color:#ef4444;">Stop</button>
            </div>
            <div class="status-banner"><span id="statusBox">Ready.</span></div>
            <div class="rf-progress-bg"><div class="rf-progress-fill" id="rf-progress"></div></div>
            <button id="resetMemoryBtn" style="display:block; margin:10px auto 0; background:none; border:none; color:#64748b; text-decoration:underline; cursor:pointer; font-size:11px;">Reset All</button>
          </div>

          <div class="panel">
            <div class="section-label">ROBOT TRAINING</div>
            <div class="train-grid">
                \${['assets','search','image','prompt','remove'].map(t => \`
                    <div class="train-row">
                        <div class="row-left"><div class="status-dot" id="dot-\${t}"></div><span class="label">\${t.charAt(0).toUpperCase() + t.slice(1)}</span></div>
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

      // Bind Events
      document.getElementById('close-btn').onclick = closePanel;
      document.getElementById('min-btn').onclick = closePanel;
      
      document.getElementById('theme-btn').onclick = () => {
          const r = document.getElementById('runway-pro-root');
          if(r.classList.contains('light-mode')) {
              r.classList.remove('light-mode'); STATE.theme = 'dark'; document.getElementById('theme-btn').innerText = '☀️';
          } else {
              r.classList.add('light-mode'); STATE.theme = 'light'; document.getElementById('theme-btn').innerText = '🌙';
          }
          localStorage.setItem('rw_theme', STATE.theme);
      };

      ['assets','search','image','prompt','remove'].forEach(t => {
          const b = document.querySelector(\`.btn-train[data-target="\${t}"]\`);
          if(b) b.onclick = () => startTraining(t);
          const b2 = document.querySelector(\`.btn-test[data-target="\${t}"]\`);
          if(b2) b2.onclick = () => testTarget(t);
      });

      document.getElementById('startAutoBtn').onclick = handleStart;
      document.getElementById('stopAutoBtn').onclick = () => { STATE.stopRequested = true; updateStatus("Stopping...", "#ef4444"); };
      document.getElementById('pauseAutoBtn').onclick = togglePause;
      document.getElementById('resetMemoryBtn').onclick = resetTraining;

      loadFolders();
      checkCalibration();
  }

  // --- CORE LOGIC ---
  function togglePanel() {
      const panel = document.getElementById('runway-pro-panel');
      const toggle = document.getElementById('runway-pro-toggle');
      if (panel.classList.contains('show')) { panel.classList.remove('show'); toggle.style.display = 'flex'; }
      else { panel.classList.add('show'); toggle.style.display = 'none'; }
  }
  
  function openPanel() { document.getElementById('runway-pro-panel').classList.add('show'); document.getElementById('runway-pro-toggle').style.display = 'none'; }
  function closePanel() { document.getElementById('runway-pro-panel').classList.remove('show'); document.getElementById('runway-pro-toggle').style.display = 'flex'; }

  function getDeviceId() {
      let id = localStorage.getItem("RW_DEVICE_ID");
      if (!id) { id = 'dev_' + Math.random().toString(36).substr(2, 9); localStorage.setItem("RW_DEVICE_ID", id); }
      return id;
  }

  function handleGoogleLogin() {
      document.getElementById("btn-google").innerText = "Opening...";
      window.postMessage({ type: "RW_OPEN_LOGIN" }, "*");
  }

  async function checkAuth(token) {
      try {
          const res = await fetch(\`\${API_BASE}/auth?device=\${getDeviceId()}&googleToken=\${token}\`);
          if (res.status === 200) {
              STATE.token = token;
              localStorage.setItem('rw_auth_token', token);
              renderDashboard();
              openPanel();
          } else if (res.status === 402) {
              renderPayment();
              openPanel();
          } else {
              const json = await res.json();
              if (json.error.includes('PENDING')) {
                  renderPending();
                  openPanel();
              } else {
                  logout(); // Invalid token
              }
          }
      } catch (e) { renderLogin("Connection Error"); }
  }

  async function submitPayment(method) {
      const trx = document.getElementById('inp-trx').value.trim();
      if(!trx) return alert("Enter TRX");
      try {
          await fetch(\`\${API_BASE}/auth\`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ googleToken: STATE.token, transactionId: trx, method, device: getDeviceId() })
          });
          renderPending();
      } catch(e) { alert("Error submitting"); }
  }

  function logout() {
      localStorage.removeItem('rw_auth_token');
      STATE.token = null;
      renderLogin();
  }

  // --- AUTOMATION HELPERS (SAME AS BEFORE) ---
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
  function togglePause() { STATE.isPaused = !STATE.isPaused; updateStatus(STATE.isPaused ? "PAUSED" : "Resuming...", "#fbbf24"); }
  function checkCalibration() { chrome.storage.local.get(['rw_selectors'], (res) => { const s = res.rw_selectors || {}; STATE.targets.forEach(t => { const dot = document.getElementById('dot-'+t); if(dot) s[t] ? dot.classList.add('active') : dot.classList.remove('active'); }); }); }
  
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

  function resetTraining() { if(confirm("Reset?")) chrome.storage.local.set({rw_selectors: {}}, checkCalibration); }
  
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
      const trigger = (c) => { const o = { bubbles:true, cancelable:true, view:window, buttons:1, clientX:x, clientY:y, detail:c }; el.dispatchEvent(new MouseEvent('mousedown', o)); el.dispatchEvent(new MouseEvent('mouseup', o)); el.click(); };
      trigger(1);
      if(isDoubleClick) { await sleep(50); trigger(2); }
      setTimeout(() => el.style.outline = oldOutline, 200);
      return true;
  }
  
  function getAuth() { let token = localStorage.getItem("RW_USER_TOKEN"); if (!token) { const m = document.cookie.match(/RW_USER_TOKEN=([^;]+)/); if (m) token = m[1]; } return { token, teamId: localStorage.getItem("TEAM_ID") || "2493493" }; }
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
      if(!folderId || !fileInput.files[0]) return alert("Select Folder & CSV");
      const res = await chrome.storage.local.get(['rw_selectors']);
      const s = res.rw_selectors || {};
      if(!s.assets || !s.search || !s.prompt) return alert("Train First!");
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
      finally { document.getElementById('startAutoBtn').style.display = 'block'; setTimeout(() => document.getElementById('runway-status-pill').classList.remove('visible'), 5000); }
  }
  async function runQueue(queue, randomDelay, selectors) {
      for (let i = 0; i < queue.length; i++) {
          if (STATE.stopRequested) break;
          while(STATE.isPaused) { updateStatus("PAUSED", "#fbbf24"); await sleep(1000); }
          const item = queue[i];
          updateStatus("Job "+(i+1)+"/"+queue.length+": "+item.cleanName, "#38bdf8");
          document.getElementById('rf-progress-fill').style.width = ((i+1)/queue.length)*100+"%";
          while(document.body.innerText.includes("Queued") || document.body.innerText.includes("Generating...")) { if(STATE.stopRequested) break; updateStatus("Queue Busy...", "#fbbf24"); await sleep(2000); }
          if(i > 0 && selectors.remove) { await performClick(selectors.remove, 1500); await sleep(2000); }
          await performClick(selectors.assets, 1000); await sleep(3000);
          if(await performClick(selectors.search, 1000)) { const el = document.activeElement; el.focus(); document.execCommand('selectAll'); document.execCommand('delete'); document.execCommand('insertText', false, item.cleanName); await sleep(3500); }
          if(!await performClick(selectors.image, 1000)) { let grid = document.querySelector('div[data-testid="asset-grid-item"]'); if(grid) { grid.click(); await sleep(50); grid.click(); } }
          await sleep(2000);
          if(await performClick(selectors.prompt, 1000)) { document.execCommand('selectAll'); document.execCommand('delete'); document.execCommand('insertText', false, item.prompt.replace(/^"|"$/g, '')); await sleep(2000); }
          const btns = Array.from(document.querySelectorAll('button'));
          const genBtn = btns.find(b => b.innerText.trim().toLowerCase().startsWith('generate'));
          if(genBtn) genBtn.click();
          const waitTime = Math.floor(Math.random() * (randomDelay.max - randomDelay.min + 1) + randomDelay.min);
          for(let s=waitTime; s>0; s--) { if(STATE.stopRequested) break; updateStatus("Cooldown: "+s+"s", "#fbbf24"); await sleep(1000); }
      }
      updateStatus(STATE.stopRequested ? "Stopped" : "Complete", "#22c55e");
  }

  // LISTENER FOR TOKEN UPDATE
  window.addEventListener("message", (event) => {
      if (event.data.type === "RW_UPDATE_TOKEN") {
          STATE.token = event.data.token;
          localStorage.setItem('rw_auth_token', STATE.token);
          render();
      }
  });

  // INIT
  createFloatingUI();
})();
\`;
