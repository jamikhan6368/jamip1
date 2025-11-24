// lib/automation.js - V141: SINGLE APP (Login + Dashboard + Automation)

module.exports = `
(() => {
  if (window.runwayProLoaded) return;
  window.runwayProLoaded = true;
  console.log("Runway Pro: Loaded");

  // --- CONFIG ---
  const API_BASE = "https://jamip1.vercel.app/api";
  const QR_PAK = "https://i.imgur.com/YourPakQR.png";
  const QR_INT = "https://i.imgur.com/YourBinanceQR.png";

  // --- STATE ---
  const STATE = {
      isRunning: false,
      stopRequested: false,
      isPaused: false,
      theme: localStorage.getItem('rw_theme') || 'dark',
      token: localStorage.getItem('rw_auth_token'),
      targets: ['assets', 'search', 'image', 'prompt', 'remove']
  };

  // --- CSS ---
  const style = document.createElement("style");
  style.textContent = \`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    #rw-root { position: fixed; top: 50%; right: 20px; transform: translateY(-50%); z-index: 2147483647; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: flex-end; --bg: #050816; --panel: #0b0b0f; --input: #131316; --border: #27272a; --text: #e2e8f0; --muted: #94a3b8; --accent: #38bdf8; --gold: #fbbf24; --danger: #ef4444; --success: #22c55e; --radius: 12px; }
    #rw-root.light { --bg: #fff; --panel: #f8fafc; --input: #e2e8f0; --border: #cbd5e1; --text: #0f172a; --muted: #64748b; --accent: #0284c7; }
    
    #rw-toggle { width: 60px; height: 60px; border-radius: 50%; background: var(--panel); border: 1px solid var(--border); color: var(--accent); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: 0.2s; pointer-events: auto; }
    #rw-toggle:hover { transform: scale(1.1); border-color: var(--accent); }
    
    #rw-panel { width: 450px; background: var(--panel); color: var(--text); border: 1px solid var(--border); border-radius: var(--radius); display: none; flex-direction: column; box-shadow: 0 30px 80px rgba(0,0,0,0.9); pointer-events: auto; max-height: 90vh; overflow-y: auto; padding: 20px; gap: 15px; }
    #rw-panel.show { display: flex; }
    
    .rw-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
    .rw-title { font-size: 16px; font-weight: 800; background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .rw-subtitle { font-size: 11px; color: var(--muted); }
    
    .rw-section { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; border: 1px solid var(--border); }
    .rw-label { font-size: 10px; font-weight: 700; color: var(--muted); letter-spacing: 1px; margin-bottom: 8px; display:block; }
    
    .rw-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; }
    .rw-btn:hover { filter: brightness(1.1); }
    .btn-primary { background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; }
    .btn-gold { background: linear-gradient(135deg, #fbbf24, #d97706); color: #0f172a; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--muted); }
    .btn-outline:hover { color: var(--text); border-color: var(--text); }
    
    .rw-input { width: 100%; background: var(--input); border: 1px solid var(--border); color: var(--text); padding: 10px; border-radius: 8px; outline: none; font-size: 12px; box-sizing: border-box; }
    .rw-input:focus { border-color: var(--accent); }
    
    .rw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    
    .train-row { display: flex; justify-content: space-between; align-items: center; background: var(--input); padding: 8px; border-radius: 6px; margin-bottom: 5px; border: 1px solid var(--border); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; display: inline-block; margin-right: 8px; }
    .status-dot.active { background: var(--success); box-shadow: 0 0 5px var(--success); }
    
    .tab-group { display: flex; gap: 10px; margin-bottom: 10px; }
    .tab { flex: 1; padding: 8px; background: var(--input); text-align: center; border-radius: 6px; cursor: pointer; font-size: 11px; border: 1px solid var(--border); color: var(--muted); }
    .tab.active { background: rgba(56,189,248,0.1); border-color: var(--accent); color: var(--accent); font-weight: bold; }
    
    .qr-box { background: white; padding: 10px; border-radius: 10px; width: 140px; margin: 10px auto; }
    .qr-img { width: 100%; height: auto; }
  \`;
  document.head.appendChild(style);

  // --- DOM SETUP ---
  const root = document.createElement("div"); root.id = "rw-root";
  if(STATE.theme==='light') root.classList.add('light');
  
  const toggle = document.createElement("div"); toggle.id = "rw-toggle";
  toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 6-2.5-2.5a2.12 2.12 0 1 0-3 3L16 9"/><path d="m16 9 3 3"/><path d="M14.5 7.5 4 18l3 3 10.5-10.5"/><path d="m19 12-7-7"/></svg>';
  toggle.onclick = () => document.getElementById("rw-panel").classList.toggle("show");
  
  const panel = document.createElement("div"); panel.id = "rw-panel";
  
  root.appendChild(toggle);
  root.appendChild(panel);
  document.body.appendChild(root);

  // --- RENDERERS ---
  function render() {
      if (!STATE.token) return renderLogin();
      checkAuth(STATE.token); // Verify token validity
  }

  function renderLogin(msg="") {
      panel.innerHTML = \`
        <div class="rw-header">
           <div><div class="rw-title">Runway Pro 🔒</div><div class="rw-subtitle">Login Required</div></div>
           <div onclick="document.getElementById('rw-panel').classList.remove('show')" style="cursor:pointer;">✕</div>
        </div>
        <div style="text-align:center; padding:30px 0;">
           <div style="font-size:40px; margin-bottom:10px;">👋</div>
           <p style="color:var(--muted); font-size:13px;">Sign in to unlock automation.</p>
           <div style="color:var(--danger); font-size:12px; margin:10px 0;">\${msg}</div>
           <button id="btn-google" class="rw-btn btn-primary">Continue with Google</button>
        </div>
      \`;
      document.getElementById('btn-google').onclick = handleGoogleLogin;
      panel.classList.add('show');
  }

  function renderPayment() {
      panel.innerHTML = \`
        <div class="rw-header">
           <div><div class="rw-title">Unlock Access 🔓</div><div class="rw-subtitle">Subscription Required</div></div>
           <div onclick="document.getElementById('rw-panel').classList.remove('show')" style="cursor:pointer;">✕</div>
        </div>
        <div class="tab-group">
            <div id="tab-pak" class="tab active">🇵🇰 Pakistan</div>
            <div id="tab-intl" class="tab">🌍 Global</div>
        </div>
        <div style="text-align:center;">
            <h3 id="price-tag" style="margin:0; color:var(--gold);">1,000 PKR</h3>
            <div class="qr-box"><img id="qr-img" src="\${QR_PAK}" class="qr-img"></div>
            <p id="pay-instruct" style="font-size:11px; color:var(--muted);">Scan with EasyPaisa / JazzCash</p>
        </div>
        <input id="inp-trx" class="rw-input" placeholder="Enter Transaction ID (TRX)">
        <button id="btn-verify" class="rw-btn btn-gold">Verify Payment</button>
        <button id="btn-logout" class="rw-btn btn-outline" style="margin-top:5px;">Logout</button>
      \`;
      
      let method='local';
      document.getElementById('tab-pak').onclick = ()=>{ method='local'; document.getElementById('qr-img').src=QR_PAK; document.getElementById('price-tag').innerText="1,000 PKR"; document.getElementById('tab-pak').className='tab active'; document.getElementById('tab-intl').className='tab'; };
      document.getElementById('tab-intl').onclick = ()=>{ method='intl'; document.getElementById('qr-img').src=QR_INT; document.getElementById('price-tag').innerText="$10 USD"; document.getElementById('tab-intl').className='tab active'; document.getElementById('tab-pak').className='tab'; };
      
      document.getElementById('btn-verify').onclick = () => submitPayment(method);
      document.getElementById('btn-logout').onclick = logout;
  }

  function renderPending() {
      panel.innerHTML = \`
        <div class="rw-header">
           <div><div class="rw-title">Pending Approval ⏳</div></div>
           <div onclick="document.getElementById('rw-panel').classList.remove('show')" style="cursor:pointer;">✕</div>
        </div>
        <div style="text-align:center; padding:40px 0;">
           <p style="color:var(--muted); font-size:13px;">Admin is verifying your payment.<br>Check back soon.</p>
           <button id="btn-refresh" class="rw-btn btn-primary">Check Status</button>
           <button id="btn-logout" class="rw-btn btn-outline">Logout</button>
        </div>
      \`;
      document.getElementById('btn-refresh').onclick = () => checkAuth(STATE.token);
      document.getElementById('btn-logout').onclick = logout;
  }

  function renderDashboard() {
      panel.innerHTML = \`
        <div class="rw-header">
            <div><div class="rw-title">Runway Pro</div><div class="rw-subtitle">Automation Active</div></div>
            <div style="display:flex; gap:10px; align-items:center;">
                <div id="btn-theme" style="cursor:pointer;">\${STATE.theme==='dark'?'☀️':'🌙'}</div>
                <div onclick="document.getElementById('rw-panel').classList.remove('show')" style="cursor:pointer; font-size:18px;">✕</div>
            </div>
        </div>

        <div class="rw-section">
            <span class="rw-label">RUN AUTOMATION</span>
            <select id="folderSelect" class="rw-input"><option>Loading Folders...</option></select>
            <input type="file" id="csvFile" accept=".csv" class="rw-input" />
            <div class="rw-grid">
                <div><span class="rw-label">Delay</span><select id="delayPreset" class="rw-input"><option value="5-8">5-8s</option><option value="8-11">8-11s</option></select></div>
                <div><span class="rw-label">Style</span><select id="promptStyle" class="rw-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            </div>
            <button id="startAutoBtn" class="rw-btn btn-primary">🚀 Start Batch</button>
            <div class="rw-grid">
                <button id="pauseAutoBtn" class="rw-btn btn-outline">Pause</button>
                <button id="stopAutoBtn" class="rw-btn btn-outline" style="color:var(--danger); border-color:var(--danger);">Stop</button>
            </div>
            <div id="statusBox" style="text-align:center; font-size:11px; color:var(--accent); margin-top:10px;">Ready.</div>
        </div>

        <div class="rw-section">
            <span class="rw-label">TRAINING</span>
            <div class="train-grid">
                \${STATE.targets.map(t => \`
                    <div class="train-row">
                        <div><span class="status-dot" id="dot-\${t}"></span> <span style="font-size:11px;">\${t.toUpperCase()}</span></div>
                        <div>
                            <button class="btn-mini btn-outline" onclick="window.startTraining('\${t}')" style="padding:4px 8px; font-size:10px;">Train</button>
                            <button class="btn-mini btn-outline" onclick="window.testTarget('\${t}')" style="padding:4px 8px; font-size:10px;">Test</button>
                        </div>
                    </div>
                \`).join('')}
            </div>
            <button id="btn-logout" class="rw-btn btn-outline" style="margin-top:15px; border:none; text-decoration:underline;">Logout</button>
        </div>
      \`;
      
      document.getElementById('btn-theme').onclick = toggleTheme;
      document.getElementById('startAutoBtn').onclick = handleStart;
      document.getElementById('stopAutoBtn').onclick = () => { STATE.stopRequested = true; updateStatus("Stopping...", "#ef4444"); };
      document.getElementById('pauseAutoBtn').onclick = togglePause;
      document.getElementById('btn-logout').onclick = logout;
      
      // Expose
      window.startTraining = startTraining;
      window.testTarget = testTarget;

      loadFolders();
      checkCalibration();
  }

  // --- LOGIC ---
  function getDeviceId() {
      let id = localStorage.getItem("RW_DEVICE_ID");
      if (!id) { id = 'dev_' + Math.random().toString(36).substr(2, 9); localStorage.setItem("RW_DEVICE_ID", id); }
      return id;
  }

  function handleGoogleLogin() {
      document.getElementById("btn-google").innerText = "Connecting...";
      window.postMessage({ type: "RW_OPEN_LOGIN" }, "*");
  }

  async function checkAuth(token) {
      try {
          const res = await fetch(\`\${API_BASE}/auth?device=\${getDeviceId()}&googleToken=\${token}\`);
          if (res.status === 200) {
              STATE.token = token;
              localStorage.setItem('rw_auth_token', token);
              renderDashboard();
          } else if (res.status === 402) {
              renderPayment();
          } else {
              const json = await res.json();
              if(json.error.includes('PENDING')) renderPending();
              else {
                  localStorage.removeItem('rw_auth_token');
                  renderLogin(json.error);
              }
          }
      } catch (e) { renderLogin("Connection Failed"); }
  }

  async function submitPayment(method) {
      const trx = document.getElementById('inp-trx').value;
      if(!trx) return alert("Enter TRX");
      await fetch(\`\${API_BASE}/auth\`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ googleToken: STATE.token, transactionId: trx, method, device: getDeviceId() }) });
      renderPending();
  }

  function logout() {
      localStorage.removeItem('rw_auth_token');
      STATE.token = null;
      renderLogin();
  }
  
  function toggleTheme() {
      const r = document.getElementById('rw-root');
      r.classList.toggle('light');
      STATE.theme = r.classList.contains('light') ? 'light' : 'dark';
      localStorage.setItem('rw_theme', STATE.theme);
      document.getElementById('btn-theme').innerText = STATE.theme==='light'?'🌙':'☀️';
  }

  // --- AUTOMATION HELPERS ---
  function updateStatus(msg, color) { const el = document.getElementById('statusBox'); if(el) { el.innerText = msg; if(color) el.style.color = color; } }
  function togglePause() { STATE.isPaused = !STATE.isPaused; updateStatus(STATE.isPaused?"PAUSED":"Resuming...", "#fbbf24"); }
  
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
      document.getElementById('rw-panel').classList.remove('show');
      const banner = document.createElement('div');
      Object.assign(banner.style, { position:'fixed', top:'0', left:'0', width:'100%', padding:'20px', background:'#d946ef', color:'white', textAlign:'center', zIndex:'9999999', fontWeight:'bold' });
      banner.innerText = "CLICK [" + target.toUpperCase() + "]";
      document.body.appendChild(banner);
      const handler = (e) => {
          e.preventDefault(); e.stopPropagation();
          const coord = "COORD:" + e.clientX + "," + e.clientY;
          chrome.storage.local.get(['rw_selectors'], (res) => {
              const s = res.rw_selectors || {}; s[target] = coord;
              chrome.storage.local.set({rw_selectors: s}, () => {
                  banner.remove();
                  document.getElementById('rw-panel').classList.add('show');
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
          // Simple visual ping
          const parts = val.split(":")[1].split(",");
          const ping = document.createElement('div');
          Object.assign(ping.style, { position:'fixed', left:(parts[0]-10)+'px', top:(parts[1]-10)+'px', width:'20px', height:'20px', border:'2px solid #22c55e', borderRadius:'50%', zIndex:'999999' });
          document.body.appendChild(ping);
          setTimeout(()=>ping.remove(), 1000);
      });
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function performClick(targetData, timeout = 3000, isDoubleClick = false) {
      if (!targetData) return false;
      const parts = targetData.split(":")[1].split(",");
      const x = parseInt(parts[0]), y = parseInt(parts[1]);
      const el = document.elementFromPoint(x, y);
      if(!el) return false;
      
      const evt = new MouseEvent('click', { bubbles: true, clientX: x, clientY: y });
      el.dispatchEvent(evt);
      if(isDoubleClick) { await sleep(50); el.dispatchEvent(evt); }
      return true;
  }

  function getAuthHeader() {
      let token = localStorage.getItem("RW_USER_TOKEN");
      if (!token) { const m = document.cookie.match(/RW_USER_TOKEN=([^;]+)/); if (m) token = m[1]; }
      return token;
  }

  async function loadFolders() {
      const sel = document.getElementById('folderSelect');
      const token = getAuthHeader();
      const teamId = localStorage.getItem("TEAM_ID") || "2493493";
      if (!token) return sel.innerHTML = '<option>Login to Runway first</option>';
      try {
          const res = await fetch(\`https://api.runwayml.com/v1/asset_groups?privateInTeam=true&asTeamId=\${teamId}\`, { headers: { "Authorization": \`Bearer \${token}\` } });
          const json = await res.json();
          sel.innerHTML = '';
          (json.assetGroups || []).forEach(g => { const opt = document.createElement('option'); opt.value = g.id; opt.textContent = g.name; sel.appendChild(opt); });
      } catch(e) { sel.innerHTML = '<option>Error Loading</option>'; }
  }

  async function getAssetsInFolder(folderId) {
      const token = getAuthHeader();
      const teamId = localStorage.getItem("TEAM_ID") || "2493493";
      const allAssets = []; let cursor = null;
      updateStatus("Fetching...", "#38bdf8");
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

  async function handleStart() {
      const folderId = document.getElementById('folderSelect').value;
      const fileInput = document.getElementById('csvFile');
      const styleKey = document.getElementById('promptStyle').value;
      if(!folderId || !fileInput.files[0]) return alert("Select Folder & CSV");
      
      STATE.stopRequested = false; STATE.isPaused = false;
      document.getElementById('startAutoBtn').style.display = 'none';

      try {
          const text = await fileInput.files[0].text();
          // Simple CSV Parse
          const lines = text.split(/\\r?\\n/);
          const queue = [];
          const assets = await getAssetsInFolder(folderId);
          
          lines.forEach(line => {
             const parts = line.split(",");
             if(parts.length < 2) return;
             const name = parts[0].trim().toLowerCase().replace(".jpg","").replace(".png","");
             const match = assets.find(a => a.name.toLowerCase().includes(name));
             
             // Prompt logic (simple)
             let prompt = parts[1]; // Default to low
             if(styleKey === 'medium') prompt = parts[2] || prompt;
             if(styleKey === 'high') prompt = parts[3] || prompt;

             if(match) queue.push({ cleanName: name, prompt: prompt.replace(/^"|"$/g, '') });
          });

          if(queue.length === 0) throw new Error("No matches");
          
          const rangeVal = document.getElementById('delayPreset').value;
          const [min, max] = rangeVal.split("-").map(Number);

          await runQueue(queue, {min, max});

      } catch(e) { updateStatus("Error: " + e.message, "#ef4444"); } 
      finally { document.getElementById('startAutoBtn').style.display = 'block'; }
  }

  async function runQueue(queue, randomDelay) {
      const res = await chrome.storage.local.get(['rw_selectors']);
      const selectors = res.rw_selectors || {};

      for (let i = 0; i < queue.length; i++) {
          if (STATE.stopRequested) break;
          while(STATE.isPaused) { updateStatus("PAUSED", "#fbbf24"); await sleep(1000); }

          const item = queue[i];
          updateStatus("Job "+(i+1)+"/"+queue.length+": "+item.cleanName, "#38bdf8");
          
          // Queue Wait
          while(document.body.innerText.includes("Queued") || document.body.innerText.includes("Generating...")) {
              if (STATE.stopRequested) break;
              updateStatus("Queue Busy...", "#fbbf24");
              await sleep(2000);
          }

          // Remove
          if(i > 0 && selectors.remove) { await performClick(selectors.remove, 1500); await sleep(2000); }

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
             let grid = document.querySelector('div[data-testid="asset-grid-item"]');
             if(grid) { grid.click(); await sleep(50); grid.click(); }
          }
          await sleep(2000);

          // Prompt
          if(await performClick(selectors.prompt, 1000)) {
             document.execCommand('selectAll'); document.execCommand('delete');
             document.execCommand('insertText', false, item.prompt);
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
      updateStatus(STATE.stopRequested ? "Stopped" : "Complete", "#22c55e");
  }

  // LISTEN FOR WEB TOKEN
  window.addEventListener("message", (event) => {
      if (event.data.type === "RW_UPDATE_TOKEN") {
          STATE.token = event.data.token;
          localStorage.setItem('rw_auth_token', STATE.token);
          render();
      }
  });

  // INIT
  render();

})();
\`;
