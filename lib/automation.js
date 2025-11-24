// Paste your ENTIRE V103 contentScript.js code inside the backticks below.
// Make sure to escape any backticks (`) inside your code with a backslash (\`).

module.exports = `
(() => {
    console.log("✨ Licensed Code Loaded Successfully!");

    // =================================================
    // PASTE YOUR FULL V103 CODE BELOW THIS LINE
    // =================================================
    
    // contentScript.js - V101: AUTO-HIDE ICON WHEN PANEL OPEN

(() => {
  // =================================================
  // 1. GLOBAL STATE
  // =================================================
  const STATE = {
      isRunning: false,
      stopRequested: false,
      isPaused: false,
      theme: localStorage.getItem('rw_theme') || 'dark',
      targets: ['assets', 'search', 'image', 'prompt', 'remove']
  };

  // =================================================
  // 2. UI CONSTRUCTION
  // =================================================
  function createFloatingUI() {
      if (document.getElementById("runway-pro-root")) return;

      const style = document.createElement("style");
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        /* --- ROOT WRAPPER --- */
        #runway-pro-root {
            position: fixed; 
            top: 50%; 
            right: 20px; 
            transform: translateY(-50%);
            z-index: 2147483647;
            font-family: 'Inter', sans-serif;
            display: flex; 
            flex-direction: column; 
            align-items: flex-end;

            /* DARK MODE VARIABLES */
            --bg: #050816;
            --bg-panel: #0b0b0f;
            --bg-input: #131316;
            --bg-hover: rgba(255,255,255,0.05);
            --border-color: #27272a;
            --text-main: #e2e8f0;
            --text-muted: #94a3b8;
            --accent-cyan: #06b6d4;
            --accent-pink: #d946ef;
            --gradient-title: linear-gradient(90deg, #9d4edd 0%, #ff007f 100%);
            --gradient-primary: linear-gradient(135deg, #9d4edd, #ff007f);
            --gradient-primary-hover: linear-gradient(135deg, #ff007f, #f97316);
            --shadow-panel: 0 30px 80px rgba(0,0,0,0.95);
            --radius-lg: 16px;
            --radius-pill: 999px;
        }

        /* LIGHT MODE VARIABLES */
        #runway-pro-root.light-mode {
            --bg: #ffffff;
            --bg-panel: #f8fafc;
            --bg-input: #e2e8f0;
            --bg-hover: rgba(0,0,0,0.05);
            --border-color: #cbd5e1;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --accent-cyan: #0891b2;
            --accent-pink: #c026d3;
            --shadow-panel: 0 20px 60px rgba(0,0,0,0.15);
        }

        /* --- TOGGLE BUTTON --- */
        #runway-pro-toggle {
            position: fixed; bottom: 30px; right: 30px;
            width: 60px; height: 60px; border-radius: 50%; 
            background: var(--bg-panel); border: 1px solid var(--border-color);
            color: var(--accent-pink); display: flex; align-items: center; justify-content: center; 
            cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); 
            transition: 0.2s; pointer-events: auto; z-index: 2147483648;
        }
        #runway-pro-toggle:hover { transform: scale(1.1); border-color: var(--accent-cyan); color: var(--accent-cyan); }
        #runway-pro-toggle svg { width: 28px; height: 28px; }

        /* --- MAIN PANEL --- */
        #runway-pro-panel {
            width: 500px; 
            background: var(--bg-panel);
            color: var(--text-main);
            border: 1px solid var(--border-color); 
            border-radius: var(--radius-lg); 
            display: none; 
            flex-direction: column; 
            box-shadow: var(--shadow-panel);
            pointer-events: auto; 
            max-height: 90vh; 
            overflow-y: auto;
            transition: background 0.3s, color 0.3s;
        }
        #runway-pro-panel.show { display: flex; animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* --- STATUS PILL --- */
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
        @keyframes pillPulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }

        /* --- UI COMPONENTS --- */
        .app-shell { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .brand-title { font-size: 18px; font-weight: 800; background: var(--gradient-title); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .brand-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        
        .header-right { display: flex; align-items: center; gap: 8px; }
        
        .social-row { display: flex; gap: 6px; }
        .social-btn { text-decoration: none; font-size: 10px; padding: 4px 8px; border-radius: 4px; background: var(--bg-hover); color: var(--text-muted); border: 1px solid var(--border-color); transition: 0.2s; display: flex; align-items: center; gap: 4px; }
        .social-btn:hover { background: var(--bg-hover); color: var(--text-main); border-color: var(--accent-cyan); }
        .yt { color: #ff4444; } .wa { color: #25D366; }
        
        .control-icon { cursor: pointer; padding: 6px; font-size: 16px; color: var(--text-muted); line-height: 1; transition: 0.2s; border-radius: 4px; }
        .control-icon:hover { color: var(--text-main); background: var(--bg-hover); }

        .panel { background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); display: flex; align-items: center; gap: 10px; margin-bottom: 5px; font-weight: 700; }
        .section-label::after { content: ""; flex: 1; height: 1px; background: var(--border-color); }

        .train-grid { display: flex; flex-direction: column; gap: 8px; }
        .train-row { display: flex; align-items: center; justify-content: space-between; background: var(--bg-input); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); transition: 0.2s; }
        .train-row:hover { border-color: var(--accent-pink); }

        .row-left { display: flex; align-items: center; gap: 10px; flex: 1; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; transition: 0.3s; }
        .status-dot.active { background: var(--success); box-shadow: 0 0 8px var(--success); }
        .label { font-size: 12px; font-weight: 500; color: var(--text-main); }

        .btn { border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); }
        .btn-outline:hover { border-color: var(--text-main); color: var(--text-main); background: var(--bg-hover); }

        .styled-select { background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px; font-size: 11px; margin-right: 6px; outline: none; }
        .main-input { width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); padding: 12px; border-radius: 8px; font-size: 12px; margin-bottom: 6px; outline: none; transition: 0.2s; }
        .main-input:focus { border-color: var(--accent-cyan); }
        
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 5px; }
        .setting-item { display: flex; flex-direction: column; gap: 6px; }
        .setting-label { font-size: 11px; color: var(--text-muted); font-weight: 500; }

        .btn-primary { background: var(--gradient-primary); color: white; width: 100%; padding: 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 10px; font-weight: 700; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4); margin-top: 10px; border: none; cursor: pointer; }
        .btn-primary:hover { transform: translateY(-1px); filter: brightness(1.1); }

        .status-banner { background: var(--bg-input); border: 1px solid var(--border-color); color: var(--accent-cyan); padding: 10px; border-radius: 8px; font-size: 12px; text-align: center; margin-top: 10px; font-weight: 600; }
        .rf-progress-bg { width: 100%; height: 6px; background: var(--bg-input); border-radius: 3px; margin-top: 12px; overflow: hidden; }
        .rf-progress-fill { width: 0%; height: 100%; background: var(--success); transition: width 0.3s; }

        .history-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 5px; }
        .clear-link { color: var(--danger); cursor: pointer; text-decoration: underline; }
        .btn-reset { display:block; margin: 10px auto 0; background: none; border: none; color: var(--text-muted); font-size: 11px; text-decoration: underline; cursor: pointer; }
        .btn-reset:hover { color: var(--danger); }

        #runway-pro-panel::-webkit-scrollbar { width: 6px; }
        #runway-pro-panel::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }
      `;
      document.head.appendChild(style);

      const root = document.createElement("div");
      root.id = "runway-pro-root";
      if(STATE.theme === 'light') root.classList.add('light-mode');

      // TOGGLE
      const toggle = document.createElement("div");
      toggle.id = "runway-pro-toggle";
      toggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 6-2.5-2.5a2.12 2.12 0 1 0-3 3L16 9"/><path d="m16 9 3 3"/><path d="M14.5 7.5 4 18l3 3 10.5-10.5"/><path d="m19 12-7-7"/></svg>`;
      toggle.onclick = openPanel;

      // PANEL
      const panel = document.createElement("div");
      panel.id = "runway-pro-panel";
      panel.innerHTML = `
        <div class="app-shell">
          <div class="header">
            <div><div class="brand-title">Runway Automation Pro</div><div class="brand-subtitle">Powered by Moin Datori</div></div>
            <div class="header-right">
              <div class="social-row">
                <a href="https://www.youtube.com/channel/UC7otDLkBsEsMstspQN6FpWw" target="_blank" class="social-btn"><span class="yt">▶</span> YT</a>
                <a href="https://chat.whatsapp.com/F022Xf2DFAr3seGowwlUN5" target="_blank" class="social-btn"><span class="wa">💬</span> WA</a>
              </div>
              <div class="control-icon" id="theme-btn" title="Toggle Theme">${STATE.theme==='dark' ? '☀️' : '🌙'}</div>
              <div class="control-icon" id="min-btn" title="Minimize">_</div>
              <div class="control-icon" id="close-btn" title="Close">✕</div>
            </div>
          </div>

          <div class="panel">
            <div class="section-label">ROBOT TRAINING (HOVER FOR HINT)</div>
            <div class="train-grid">
                <div class="train-row" title="Click Assets/Folder icon on sidebar">
                    <div class="row-left"><div class="status-dot" id="dot-assets"></div><span class="label">1. Assets (Sidebar)</span></div>
                    <select id="clicks-assets" class="styled-select" style="width:60px;"><option value="1">1x</option><option value="2">2x</option></select>
                    <button class="btn btn-outline btn-train" data-target="assets">Train</button>
                    <button class="btn btn-outline btn-test" data-target="assets">Test</button>
                </div>
                <div class="train-row" title="Click Search Bar">
                    <div class="row-left"><div class="status-dot" id="dot-search"></div><span class="label">2. Search Bar</span></div>
                    <button class="btn btn-outline btn-train" data-target="search">Train</button>
                    <button class="btn btn-outline btn-test" data-target="search">Test</button>
                </div>
                <div class="train-row" title="Click First Image">
                    <div class="row-left"><div class="status-dot" id="dot-image"></div><span class="label">3. First Image</span></div>
                    <select id="clicks-image" class="styled-select" style="width:60px;"><option value="1">1x</option><option value="2" selected>2x</option></select>
                    <button class="btn btn-outline btn-train" data-target="image">Train</button>
                    <button class="btn btn-outline btn-test" data-target="image">Test</button>
                </div>
                <div class="train-row" title="Click Remove/Trash Icon">
                    <div class="row-left"><div class="status-dot" id="dot-remove"></div><span class="label">4. Remove Icon</span></div>
                    <select id="clicks-remove" class="styled-select" style="width:60px;"><option value="1">1x</option></select>
                    <button class="btn btn-outline btn-train" data-target="remove">Train</button>
                    <button class="btn btn-outline btn-test" data-target="remove">Test</button>
                </div>
                <div class="train-row" title="Click Prompt Text Area">
                    <div class="row-left"><div class="status-dot" id="dot-prompt"></div><span class="label">5. Prompt Box</span></div>
                    <button class="btn btn-outline btn-train" data-target="prompt">Train</button>
                    <button class="btn btn-outline btn-test" data-target="prompt">Test</button>
                </div>
            </div>
          </div>

          <div class="panel">
            <div class="section-label">RUN AUTOMATION</div>
            <div>
                <select id="folderSelect" class="main-input"><option>Loading Folders...</option></select>
                <input type="file" id="csvFile" accept=".csv" class="main-input" />

                <div class="settings-grid">
                    <div class="setting-item">
                        <label class="setting-label">Random Delay Between Jobs</label>
                        <select id="delayPreset" class="styled-select">
                            <option value="5-8">5 – 8 Seconds</option>
                            <option value="8-11">8 – 11 Seconds</option>
                            <option value="11-15">11 – 15 Seconds</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Prompt Column Style</label>
                        <select id="promptStyle" class="styled-select">
                            <option value="low">Low Motion</option>
                            <option value="medium">Medium Motion</option>
                            <option value="high">High Motion</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="history-row" style="margin-top:10px;"><span id="historyStatus">History: Active</span><span id="clearHistoryBtn" class="clear-link">Clear</span></div>
            
            <button id="startAutoBtn" class="btn-primary">🚀 Start Batch</button>
            
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button id="pauseAutoBtn" class="btn btn-outline" style="flex:1; padding:10px;">Pause</button>
              <button id="stopAutoBtn" class="btn btn-outline" style="flex:1; padding:10px; border-color:var(--danger); color:var(--danger);">Stop</button>
            </div>

            <div class="status-banner"><span id="statusBox">Ready.</span></div>
            <div class="rf-progress-bg"><div class="rf-progress-fill" id="rf-progress"></div></div>
            
            <button id="resetMemoryBtn" class="btn-reset">Reset All Calibration</button>
            <input type="hidden" id="time-assets" value="5"><input type="hidden" id="time-action" value="3">
          </div>
        </div>
      `;

      root.appendChild(toggle);
      root.appendChild(panel);
      document.body.appendChild(root);

      // --- STATUS PILL ---
      const pill = document.createElement("div");
      pill.id = "runway-status-pill";
      pill.innerHTML = `<div id="pill-dot" class="pill-dot"></div><span id="pill-text">Ready</span>`;
      document.body.appendChild(pill);

      // --- EVENTS ---
      document.getElementById('close-btn').onclick = closePanel;
      document.getElementById('min-btn').onclick = closePanel;
      
      document.getElementById('theme-btn').onclick = () => {
          const r = document.getElementById('runway-pro-root');
          if(r.classList.contains('light-mode')) {
              r.classList.remove('light-mode');
              STATE.theme = 'dark';
              document.getElementById('theme-btn').innerText = '☀️';
          } else {
              r.classList.add('light-mode');
              STATE.theme = 'light';
              document.getElementById('theme-btn').innerText = '🌙';
          }
          localStorage.setItem('rw_theme', STATE.theme);
      };

      STATE.targets.forEach(t => {
          document.querySelector(`.btn-train[data-target="${t}"]`).onclick = () => startTraining(t);
          document.querySelector(`.btn-test[data-target="${t}"]`).onclick = () => testTarget(t);
      });

      document.getElementById('startAutoBtn').onclick = handleStart;
      document.getElementById('stopAutoBtn').onclick = () => { STATE.stopRequested = true; updateStatus("Stopping...", "#ef4444"); };
      document.getElementById('pauseAutoBtn').onclick = togglePause;
      document.getElementById('resetMemoryBtn').onclick = resetTraining;
      
      loadFolders();
      checkCalibration();
  }

  // =================================================
  // 3. VISIBILITY CONTROLS (TOGGLE/PANEL LOGIC)
  // =================================================
  function openPanel() {
      document.getElementById('runway-pro-panel').classList.add('show');
      document.getElementById('runway-pro-toggle').style.display = 'none'; // HIDE ICON
  }

  function closePanel() {
      document.getElementById('runway-pro-panel').classList.remove('show');
      document.getElementById('runway-pro-toggle').style.display = 'flex'; // SHOW ICON
  }

  // =================================================
  // 4. LOGIC: UPDATES
  // =================================================
  function updateStatus(msg, color) {
      const el = document.getElementById('statusBox');
      if(el) { 
          el.textContent = msg; 
          if(color) el.style.color = color;
          else el.style.color = "var(--accent-cyan)";
      }

      const pill = document.getElementById('runway-status-pill');
      const pillText = document.getElementById('pill-text');
      const pillDot = document.getElementById('pill-dot');
      
      if(pill && pillText) {
          pillText.textContent = msg;
          pill.classList.add('visible');
          
          let dotColor = "#94a3b8";
          if(msg.includes("Generating") || msg.includes("Job")) dotColor = "#22c55e";
          else if(msg.includes("Waiting") || msg.includes("Queue")) dotColor = "#fbbf24";
          else if(msg.includes("Error") || msg.includes("Stop")) dotColor = "#ef4444";
          else if(msg.includes("Assets") || msg.includes("Search")) dotColor = "#38bdf8";

          pillDot.style.backgroundColor = dotColor;
          pillDot.style.boxShadow = `0 0 8px ${dotColor}`;
          
          if(msg.includes("Generating")) pillDot.style.animation = "pillPulse 1.5s infinite";
          else pillDot.style.animation = "none";
      }
  }

  function togglePause() {
      STATE.isPaused = !STATE.isPaused;
      document.getElementById('pauseAutoBtn').textContent = STATE.isPaused ? "Resume" : "Pause";
      updateStatus(STATE.isPaused ? "PAUSED" : "Resuming...", STATE.isPaused ? "#fbbf24" : "#22c55e");
  }

  function checkCalibration() {
      chrome.storage.local.get(['rw_selectors'], (res) => {
          const s = res.rw_selectors || {};
          STATE.targets.forEach(t => {
              const dot = document.getElementById(`dot-${t}`);
              if(dot) s[t] ? dot.classList.add('active') : dot.classList.remove('active');
          });
      });
  }

  function startTraining(target) {
      closePanel(); // Hide Panel & Show Icon (Wait, logic check)
      // We want panel GONE, but Banner VISIBLE. Icon can stay.
      
      const banner = document.createElement('div');
      Object.assign(banner.style, {
          position:'fixed', top:'0', left:'0', width:'100%', padding:'20px',
          background:'#d946ef', color:'white', textAlign:'center', zIndex:'9999999', fontWeight:'bold', fontFamily:'sans-serif', fontSize:'16px'
      });
      banner.innerText = `CLICK ON THE [${target.toUpperCase()}] ELEMENT`;
      document.body.appendChild(banner);

      const handler = (e) => {
          e.preventDefault(); e.stopPropagation();
          const coord = `COORD:${e.clientX},${e.clientY}`;
          chrome.storage.local.get(['rw_selectors'], (res) => {
              const s = res.rw_selectors || {}; s[target] = coord;
              chrome.storage.local.set({rw_selectors: s}, () => {
                  banner.remove();
                  openPanel(); // Re-open panel, Hide Icon
                  checkCalibration();
              });
          });
          document.removeEventListener('click', handler, true);
          document.removeEventListener('mouseover', hover, true);
          document.removeEventListener('mouseout', leave, true);
          e.target.style.outline = "";
      };

      const hover = (e) => { e.target.style.outline = "2px dashed #00ffcc"; e.target.style.cursor = "crosshair"; };
      const leave = (e) => { e.target.style.outline = ""; e.target.style.cursor = "default"; };

      document.addEventListener('click', handler, true);
      document.addEventListener('mouseover', hover, true);
      document.addEventListener('mouseout', leave, true);
  }

  function testTarget(target) {
      chrome.storage.local.get(['rw_selectors'], (res) => {
          const val = (res.rw_selectors || {})[target];
          if(!val) return alert("Train first!");
          performClick(val, 1000, target==='image');
      });
  }

  function resetTraining() {
      if(confirm("Reset all training?")) {
          chrome.storage.local.set({rw_selectors: {}}, () => {
              checkCalibration();
              alert("Memory Cleared.");
          });
      }
  }

  // =================================================
  // 5. AUTOMATION LOGIC
  // =================================================
  async function performClick(targetData, timeout = 3000, isDoubleClick = false) {
      let el = null, x = 0, y = 0;
      if (typeof targetData === 'string' && targetData.startsWith("COORD:")) {
          [x, y] = targetData.split(":")[1].split(",").map(Number);
          el = document.elementFromPoint(x, y);
      }
      if (!el) return false;
      
      const oldOutline = el.style.outline;
      el.style.outline = "2px solid #d946ef"; await sleep(150);
      
      const trigger = (c) => {
          const o = { bubbles:true, cancelable:true, view:window, buttons:1, clientX:x, clientY:y, detail:c };
          el.dispatchEvent(new MouseEvent('mousedown', o)); 
          el.dispatchEvent(new MouseEvent('mouseup', o)); 
          el.click();
      };
      trigger(1);
      if(isDoubleClick) { await sleep(50); trigger(2); }
      
      setTimeout(() => el.style.outline = oldOutline, 200);
      return true;
  }

  async function handleStart() {
      const folderId = document.getElementById('folderSelect').value;
      const fileInput = document.getElementById('csvFile');
      const styleKey = document.getElementById('promptStyle').value;
      
      if(!folderId || !fileInput.files[0]) return alert("Please select a Folder and Upload a CSV.");

      const res = await chrome.storage.local.get(['rw_selectors']);
      const s = res.rw_selectors || {};
      if(!s.assets || !s.search || !s.prompt) return alert("Please train Assets, Search, and Prompt buttons first.");

      STATE.stopRequested = false;
      STATE.isPaused = false;
      document.getElementById('startAutoBtn').style.display = 'none';

      try {
          const text = await fileInput.files[0].text();
          const csvRows = parseCSV(text);
          const assets = await getAssetsInFolder(folderId);
          if(assets.length === 0) throw new Error("Folder appears empty.");

          updateStatus("Matching files...", "#fbbf24");
          const queue = [];
          csvRows.forEach(row => {
              const match = assets.find(a => normalizeName(a.name).includes(row.cleanName) || row.cleanName.includes(normalizeName(a.name)));
              if(match) queue.push({ assetName: match.name, cleanName: row.cleanName, prompt: row[styleKey] || row.medium || row.low || "" });
          });

          if(queue.length === 0) throw new Error("No matches found in CSV/Folder.");

          const rangeVal = document.getElementById('delayPreset').value;
          const [min, max] = rangeVal.split("-").map(Number);
          
          await runQueue(queue, {min, max}, s);

      } catch(e) {
          updateStatus("Error: " + e.message, "#ef4444");
      } finally {
          document.getElementById('startAutoBtn').style.display = 'block';
          setTimeout(() => document.getElementById('runway-status-pill').classList.remove('visible'), 5000);
      }
  }

  async function runQueue(queue, randomDelay, selectors) {
      for (let i = 0; i < queue.length; i++) {
          if (STATE.stopRequested) break;
          while(STATE.isPaused) { updateStatus("PAUSED", "#fbbf24"); await sleep(1000); }

          const item = queue[i];
          updateStatus(`Job ${i+1}/${queue.length}: ${item.cleanName}`, "#38bdf8");
          const prog = document.getElementById('rf-progress');
          if(prog) prog.style.width = `${((i+1)/queue.length)*100}%`;

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
              updateStatus(`Cooldown: ${s}s`, "#fbbf24");
              await sleep(1000);
          }
      }
      updateStatus(STATE.stopRequested ? "Stopped." : "Batch Complete!", STATE.stopRequested ? "#ef4444" : "#22c55e");
  }

  // =================================================
  // 6. HELPER FUNCTIONS
  // =================================================
  const sleep = ms => new Promise(r => setTimeout(r, ms));
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
          let url = `https://api.runwayml.com/v2/assets?limit=500&asTeamId=${teamId}&privateInTeam=true&parentAssetGroupId=${folderId}&mediaTypes%5B%5D=image`;
          if(cursor) url += `&cursor=${cursor}`;
          const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
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
          const res = await fetch(`https://api.runwayml.com/v1/asset_groups?privateInTeam=true&asTeamId=${teamId}`, { headers: { "Authorization": `Bearer ${token}` } });
          const json = await res.json();
          sel.innerHTML = '';
          (json.assetGroups || []).forEach(g => { const opt = document.createElement('option'); opt.value = g.id; opt.textContent = g.name; sel.appendChild(opt); });
      } catch(e) { sel.innerHTML = '<option>Error</option>'; }
  }

  setTimeout(createFloatingUI, 1000);
})();

    // =================================================
    // END OF CODE
    // =================================================
})();
`;
