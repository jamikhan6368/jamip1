// runway-bundle.js - COMBINED AUTOMATION LOGIC (Refactored for Remote Vercel Execution)

(() => {
  // --- PREVENT DUPLICATE LOADS ---
  if (window.RunwayProRemoteLoaded) return;
  window.RunwayProRemoteLoaded = true;

  console.log("🚀 Vercel Automation Core Initialized (V3.0)");

  // =================================================
  // 1. GLOBAL STATE & LOCALSTORAGE REPLACEMENTS
  // =================================================
  const STATE = {
      isRunning: false,
      stopRequested: false,
      isPaused: false,
      targets: ['assets', 'search', 'image', 'prompt', 'remove']
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Replacement for chrome.storage -> uses localStorage (required for remote code)
  const Storage = {
      get: (key = 'rw_selectors') => {
          try { return JSON.parse(localStorage.getItem(key)) || {}; } 
          catch (e) { return {}; }
      },
      set: (key = 'rw_selectors', val) => {
          localStorage.setItem(key, JSON.stringify(val));
      }
  };

  // =================================================
  // 2. AUTH & FOLDER LOGIC (From runwayFoldersContent.js)
  // =================================================
  function getAuth() {
    // Tries LocalStorage first, then Cookie for the token
    let token = localStorage.getItem("RW_USER_TOKEN");
    if (!token) {
        const m = document.cookie.match(/RW_USER_TOKEN=([^;]+)/);
        if (m) token = m[1];
    }
    if (token) {
        if (token.includes("%20")) token = decodeURIComponent(token);
        if (!token.toLowerCase().startsWith("bearer ")) token = "Bearer " + token;
    }
    // Team ID
    let teamId = localStorage.getItem("TEAM_ID");
    if(!teamId) teamId = "2493493"; // Default Fallback 
    
    return { token, teamId };
  }

  async function getAssetsInFolder(folderId) {
      const { token, teamId } = getAuth();
      if(!token) throw new Error("Not logged in (Token missing)");

      const allAssets = [];
      let cursor = null;
      updateStatus("Fetching Assets...", "#38bdf8");
      
      let loops = 0;
      do {
          if(loops++ > 50) break; 
          let url = `https://api.runwayml.com/v2/assets?limit=500&asTeamId=${teamId}&privateInTeam=true&parentAssetGroupId=${folderId}&mediaTypes%5B%5D=image`;
          if(cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
          
          const res = await fetch(url, { headers: { "Authorization": token } });
          if(!res.ok) throw new Error("API Error: " + res.status);
          
          const json = await res.json();
          allAssets.push(...(json.assets || []));
          cursor = json.nextCursor;
          
          await sleep(100);
      } while(cursor);
      
      return allAssets;
  }

  async function loadFolders() {
      const sel = document.getElementById('folderSelect');
      if(!sel) return;
      
      const { token, teamId } = getAuth();
      if (!token) {
          sel.innerHTML = '<option>Not Logged In</option>';
          return;
      }

      try {
          sel.innerHTML = '<option>Loading...</option>';
          const url = `https://api.runwayml.com/v1/asset_groups?privateInTeam=true&asTeamId=${teamId}`;
          const res = await fetch(url, { headers: { "Authorization": token } });
          const json = await res.json();
          
          sel.innerHTML = '';
          const groups = Array.isArray(json) ? json : (json.assetGroups || []);
          
          if(groups.length === 0) {
               sel.innerHTML = '<option value="">No Folders Found</option>';
          } else {
              groups.forEach(g => { 
                  const opt = document.createElement('option'); 
                  opt.value = g.id || g.assetGroupId; 
                  opt.textContent = g.name || g.title; 
                  sel.appendChild(opt); 
              });
          }
      } catch(e) { 
          console.error("Folder Load Error:", e);
          sel.innerHTML = '<option>Error loading folders</option>'; 
      }
  }

  // =================================================
  // 3. UI CONSTRUCTION (From contentScript.js & popup.html logic)
  // =================================================
  function updateStatus(msg, color) {
      const el = document.getElementById('statusBox');
      if(el) { el.textContent = msg; el.style.color = color || "#06b6d4"; }
      
      // Update floating pill
      const pill = document.getElementById('runway-status-pill');
      if(pill) {
          pill.classList.add('visible');
          document.getElementById('pill-text').textContent = msg;
          document.getElementById('pill-dot').style.background = color || "#06b6d4";
      }
  }
  
  function checkCalibration() {
      const s = Storage.get('rw_selectors');
      STATE.targets.forEach(t => {
          const dot = document.getElementById(`dot-${t}`);
          if(dot) s[t] ? dot.classList.add('active') : dot.classList.remove('active');
      });
  }

  function createFloatingUI() {
      // Use existing ID to prevent duplication
      if (document.getElementById("runway-pro-root")) return;

      const style = document.createElement("style");
      style.textContent = `
        /* Inject basic styles to make the UI look correct */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        #runway-pro-root {
            position: fixed; top: 50%; right: 20px; transform: translateY(-50%);
            z-index: 2147483647; font-family: 'Inter', sans-serif;
            --bg-panel: #0b0b0f; --border-color: #27272a; --text-main: #e2e8f0; --text-muted: #94a3b8;
            --gradient-primary: linear-gradient(135deg, #9d4edd, #ff007f);
        }
        #runway-pro-toggle {
            position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px;
            border-radius: 50%; background: var(--bg-panel); border: 1px solid var(--border-color);
            color: var(--accent-pink, #d946ef); display: flex; align-items: center; justify-content: center;
            cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: 0.2s; z-index: 2147483648;
        }
        #runway-pro-panel {
            width: 400px; background: var(--bg-panel); color: var(--text-main);
            border: 1px solid var(--border-color); border-radius: 16px; display: none;
            padding: 20px; gap: 16px; box-shadow: 0 30px 80px rgba(0,0,0,0.95);
        }
        #runway-pro-panel.show { display: flex; flex-direction: column; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .brand-title { font-size: 18px; font-weight: 800; background: linear-gradient(90deg, #9d4edd, #ff007f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .panel-sec { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .sec-lbl { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; margin-bottom: 5px; }
        .train-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; margin-right: 8px; }
        .status-dot.active { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .btn { border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer; }
        .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); }
        .btn-primary { background: var(--gradient-primary); color: white; width: 100%; padding: 14px; margin-top: 10px; }
        .main-input { width: 100%; background: #131316; border: 1px solid var(--border-color); color: var(--text-main); padding: 10px; border-radius: 8px; outline: none; }
        .status-banner { background: #131316; color: #06b6d4; padding: 10px; border-radius: 8px; text-align: center; font-size: 12px; font-weight: 600; }
        #runway-status-pill { position: fixed; bottom: 35px; right: 100px; z-index: 2147483648; background: var(--bg-panel); border: 1px solid var(--border-color); padding: 10px 20px; border-radius: 50px; color: var(--text-main); font-size: 12px; display: flex; align-items: center; gap: 8px; opacity: 0; pointer-events: none; transition: 0.3s; }
        .pill-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
      `;
      document.head.appendChild(style);

      const root = document.createElement("div");
      root.id = "runway-pro-root";

      // --- HTML Structure ---
      root.innerHTML = `
        <div id="runway-pro-toggle">🤖</div>
        <div id="runway-pro-panel">
          <div class="header">
            <div><div class="brand-title">Runway Automation</div><div style="font-size:10px; color:#94a3b8;">Vercel Remote Loaded</div></div>
            <button id="close-btn" class="btn btn-outline">✕</button>
          </div>

          <div class="panel-sec">
            <div class="sec-lbl">Training</div>
            ${STATE.targets.map(t => `
                <div class="train-row">
                    <div style="display:flex;align-items:center;">
                        <div class="status-dot" id="dot-${t}"></div>
                        <span style="font-size:11px;font-weight:500;">${t.toUpperCase()}</span>
                    </div>
                    <div>
                        <button class="btn btn-outline btn-train" data-target="${t}">Set</button>
                        <button class="btn btn-outline btn-test" data-target="${t}">Test</button>
                    </div>
                </div>
            `).join('')}
          </div>

          <div class="panel-sec">
            <div class="sec-lbl">Execution</div>
            <select id="folderSelect" class="main-input"><option>Loading...</option></select>
            <input type="file" id="csvFile" accept=".csv" class="main-input" style="padding:6px;" />
            
            <div style="display:flex; gap:10px; margin-top:5px;">
                <select id="delayPreset" class="main-input">
                    <option value="5-8">Delay: 5-8s</option>
                    <option value="8-12">Delay: 8-12s</option>
                </select>
                <select id="promptStyle" class="main-input">
                    <option value="low">Motion: Low</option>
                    <option value="medium">Motion: Medium</option>
                    <option value="high">Motion: High</option>
                </select>
            </div>

            <button id="startAutoBtn" class="btn-primary">Start Batch</button>
            <div style="display:flex; gap:5px;">
                <button id="pauseAutoBtn" class="btn btn-outline" style="flex:1;">Pause</button>
                <button id="stopAutoBtn" class="btn btn-outline" style="flex:1; border-color:#ef4444; color:#ef4444;">Stop</button>
            </div>
            
            <div class="status-banner" id="statusBox">Ready</div>
            <button id="resetMemoryBtn" style="background:none; border:none; color:#666; font-size:10px; text-decoration:underline; cursor:pointer; margin-top:5px;">Reset Training</button>
        </div>
      `;

      document.body.appendChild(root);
      
      const pill = document.createElement('div');
      pill.id = "runway-status-pill";
      pill.innerHTML = `<div class="pill-dot" id="pill-dot"></div><span id="pill-text">Ready</span>`;
      document.body.appendChild(pill);

      // --- BIND EVENTS ---
      document.getElementById('runway-pro-toggle').onclick = () => {
          document.getElementById('runway-pro-panel').classList.add('show');
          document.getElementById('runway-pro-toggle').style.display = 'none';
      };
      document.getElementById('close-btn').onclick = () => {
          document.getElementById('runway-pro-panel').classList.remove('show');
          document.getElementById('runway-pro-toggle').style.display = 'flex';
      };

      STATE.targets.forEach(t => {
          document.querySelector(`.btn-train[data-target="${t}"]`).onclick = () => startTraining(t);
          document.querySelector(`.btn-test[data-target="${t}"]`).onclick = () => testTarget(t);
      });

      document.getElementById('startAutoBtn').onclick = handleStart;
      document.getElementById('stopAutoBtn').onclick = () => { STATE.stopRequested = true; updateStatus("Stopping...", "#ef4444"); };
      document.getElementById('pauseAutoBtn').onclick = togglePause;
      document.getElementById('resetMemoryBtn').onclick = resetTraining;

      // Initial state checks
      loadFolders();
      checkCalibration();
  }
  
  // =================================================
  // 4. TRAINING & EXECUTION LOGIC (From contentScript.js)
  // =================================================
  function togglePause() {
      STATE.isPaused = !STATE.isPaused;
      document.getElementById('pauseAutoBtn').textContent = STATE.isPaused ? "Resume" : "Pause";
      updateStatus(STATE.isPaused ? "PAUSED" : "Resuming...");
  }

  function startTraining(target) {
      document.getElementById('runway-pro-panel').classList.remove('show');
      
      const banner = document.createElement('div');
      Object.assign(banner.style, {
          position:'fixed', top:'0', left:'0', width:'100%', padding:'20px',
          background:'#d946ef', color:'white', textAlign:'center', zIndex:'9999999', 
          fontWeight:'bold', fontSize:'16px'
      });
      banner.innerText = `CLICK THE [${target.toUpperCase()}] ELEMENT`;
      document.body.appendChild(banner);

      const handler = (e) => {
          e.preventDefault(); e.stopPropagation();
          const coord = `COORD:${e.clientX},${e.clientY}`;
          const s = Storage.get('rw_selectors');
          s[target] = coord;
          Storage.set('rw_selectors', s);
          
          banner.remove();
          document.getElementById('runway-pro-panel').classList.add('show');
          checkCalibration();
          
          document.removeEventListener('click', handler, true);
          e.target.style.outline = ""; // Clean up outline
      };
      
      const hover = (e) => { e.target.style.outline = "2px dashed #00ffcc"; };
      
      document.addEventListener('click', handler, true);
      document.addEventListener('mouseover', hover, true);
      
      // Cleanup on mouseout (less important but good practice)
      document.addEventListener('mouseout', (e) => { e.target.style.outline = ""; }, true);
  }

  function testTarget(target) {
      const s = Storage.get('rw_selectors');
      if(s[target]) performClick(s[target], 1000, target==='image');
      else alert("Train first!");
  }

  function resetTraining() {
      if(confirm("Are you sure you want to reset all training coordinates?")) {
          Storage.set('rw_selectors', {});
          checkCalibration();
          alert("Training data cleared.");
      }
  }

  async function performClick(targetData, timeout = 3000, isDoubleClick = false) {
      if (!targetData || !targetData.startsWith("COORD:")) return false;
      const [x, y] = targetData.split(":")[1].split(",").map(Number);
      let el = document.elementFromPoint(x, y);
      
      if (!el) return false;
      
      const oldOutline = el.style.outline;
      el.style.outline = "2px solid #d946ef"; 
      await sleep(200);
      
      // Use standard click simulation
      el.click();
      
      if(isDoubleClick) { await sleep(50); el.click(); }
      
      setTimeout(() => el.style.outline = oldOutline, 300);
      return true;
  }

  function normalizeName(name) { return name ? name.toLowerCase().replace(/\.(jpg|jpeg|png|webp|mp4|mov)$/i, '').trim() : ""; }

  function parseCSV(text) {
      // Basic CSV parser assuming structure: Filename, Prompt, [Optional columns]
      const rows = text.split('\n').filter(l => l.trim().length > 0).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      const data = [];
      const start = (rows[0] && rows[0][0].toLowerCase().includes('filename')) ? 1 : 0;
      for (let i = start; i < rows.length; i++) {
          const r = rows[i]; if(r.length < 2) continue;
          data.push({ 
              cleanName: normalizeName(r[0]), 
              prompt: r[1] || r[2] || "" 
          });
      }
      return data;
  }

  async function handleStart() {
      const folderId = document.getElementById('folderSelect').value;
      const file = document.getElementById('csvFile').files[0];
      if(!folderId || !file) return alert("Select folder and CSV file.");

      const s = Storage.get('rw_selectors');
      if(!s.assets || !s.prompt) return alert("Training missing for Assets and Prompt.");

      STATE.stopRequested = false;
      STATE.isPaused = false;
      document.getElementById('startAutoBtn').style.display = 'none';

      try {
          const text = await file.text();
          const rows = parseCSV(text);
          const assets = await getAssetsInFolder(folderId);

          if(!assets.length) throw new Error("Folder empty or failed to load assets.");

          const queue = [];
          rows.forEach(row => {
              const match = assets.find(a => normalizeName(a.name).includes(row.cleanName));
              if(match) queue.push({ ...row, assetName: match.name });
          });

          if(!queue.length) throw new Error("No matching asset names found in the folder for the CSV entries.");

          const delayRange = document.getElementById('delayPreset').value.split("-").map(Number);
          
          await runQueue(queue, {min: delayRange[0], max: delayRange[1]}, s);

      } catch(e) {
          updateStatus("Error: " + e.message, "#ef4444");
          alert("Automation Error: " + e.message);
      } finally {
          document.getElementById('startAutoBtn').style.display = 'block';
      }
  }

  async function runQueue(queue, delay, s) {
      for (let i = 0; i < queue.length; i++) {
          if (STATE.stopRequested) break;
          while(STATE.isPaused) { updateStatus("PAUSED", "#fbbf24"); await sleep(1000); }

          const item = queue[i];
          updateStatus(`Job ${i+1}/${queue.length}: ${item.cleanName}`, "#d946ef");

          // 1. Wait for generation to finish
          while(document.body.innerText.includes("Generating") || document.body.innerText.includes("Queued")) {
              updateStatus("Waiting for previous job...", "#fbbf24"); await sleep(2000);
          }

          // 2. Remove previous video (if defined)
          if(i > 0 && s.remove) {
              await performClick(s.remove, 1000); await sleep(1500);
          }

          if(STATE.stopRequested) break;

          // 3. Open Assets
          updateStatus("Opening Assets...", "#38bdf8");
          await performClick(s.assets, 1000); await sleep(2500);

          // 4. Search & Type Name
          updateStatus("Searching...", "#38bdf8");
          if(await performClick(s.search, 1000)) {
              // Find the input element (less reliable on coordinates, but necessary for remote injection)
              const [x, y] = s.search.split(":")[1].split(",").map(Number);
              let el = document.elementFromPoint(x, y);
              el = el.querySelector('input, textarea') || el.closest('input, textarea') || el;
              
              if(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                  el.focus(); el.value = item.cleanName;
                  el.dispatchEvent(new Event('input', {bubbles:true}));
                  await sleep(3000);
              }
          }

          // 5. Select Image (Double Click)
          updateStatus("Selecting Image...", "#38bdf8");
          await performClick(s.image, 1000, true); 
          await sleep(2000);

          // 6. Prompt
          updateStatus("Typing Prompt...", "#38bdf8");
          if(await performClick(s.prompt, 1000)) {
              const [x, y] = s.prompt.split(":")[1].split(",").map(Number);
              let el = document.elementFromPoint(x, y);
              el = el.querySelector('textarea') || el.closest('textarea') || el;
              
              if(el && el.tagName === 'TEXTAREA') {
                  el.focus(); el.value = item.prompt;
                  el.dispatchEvent(new Event('input', {bubbles:true}));
                  await sleep(2000);
              }
          }

          // 7. Generate
          updateStatus("Starting Generation...", "#22c55e");
          const btns = Array.from(document.querySelectorAll('button'));
          const genBtn = btns.find(b => b.innerText.trim().toLowerCase().startsWith('generate'));
          if(genBtn && !genBtn.disabled) {
              genBtn.click();
              await sleep(3000);
          } else {
              updateStatus("Generate button not clickable.", "#ef4444");
          }

          // 8. Random Delay
          const wait = Math.floor(Math.random() * (delay.max - delay.min + 1) + delay.min);
          for(let k=wait; k>0; k--) {
             if(STATE.stopRequested) break;
             updateStatus(`Cooldown: ${k}s remaining before next job`, "#fbbf24");
             await sleep(1000);
          }
      }
      updateStatus("Batch Complete!", "#22c55e");
  }


  // Final UI launch hook
  // Wait for the main page elements to load before creating the floating UI
  if (document.readyState === 'complete') {
    createFloatingUI();
  } else {
    window.addEventListener('load', createFloatingUI);
  }
})();
