// lib/automation.js - V151: FULL APP (Syntax Proof)

const clientScript = () => {
    if (window.runwayProLoaded) return;
    window.runwayProLoaded = true;
    console.log("Runway Pro: App Loaded Successfully");

    const API_BASE = "https://jamip1.vercel.app/api"; 
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

    // --- CSS ---
    const CSS_STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        #runway-pro-root { position: fixed; top: 50%; right: 20px; transform: translateY(-50%); z-index: 2147483647; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: flex-end; --bg: #050816; --panel: #0b0b0f; --border: #27272a; --text: #e2e8f0; --accent: #38bdf8; }
        #runway-pro-root.light-mode { --bg: #fff; --panel: #f8fafc; --border: #cbd5e1; --text: #0f172a; }
        #runway-pro-toggle { width: 60px; height: 60px; border-radius: 50%; background: var(--panel); border: 1px solid var(--border); color: var(--accent); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); margin-bottom: 10px; transition: 0.2s; pointer-events: auto; }
        #runway-pro-toggle:hover { transform: scale(1.1); }
        #runway-pro-panel { width: 500px; background: var(--panel); color: var(--text); border: 1px solid var(--border); border-radius: 16px; display: none; flex-direction: column; box-shadow: 0 30px 80px rgba(0,0,0,0.9); pointer-events: auto; max-height: 90vh; overflow-y: auto; padding: 25px; gap: 15px; }
        #runway-pro-panel.show { display: flex; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
        .brand-title { font-size: 18px; font-weight: 800; background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .panel-box { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 10px; }
        .section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 5px; margin-bottom: 5px; }
        .input { width: 100%; background: #131316; border: 1px solid var(--border); color: var(--text); padding: 10px; border-radius: 8px; outline: none; font-size: 12px; box-sizing: border-box; }
        .btn { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; margin-top: 10px; background: linear-gradient(135deg, #38bdf8, #818cf8); color: #0f172a; }
        .btn-outline { background: transparent; border: 1px solid var(--border); color: #94a3b8; padding: 8px; font-size: 11px; }
        .train-row { display: flex; justify-content: space-between; align-items: center; background: #131316; padding: 8px; border-radius: 6px; border: 1px solid var(--border); }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; margin-right: 8px; display: inline-block; }
        .status-dot.active { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .pill { position: fixed; bottom: 30px; right: 100px; background: var(--panel); border: 1px solid var(--border); padding: 8px 16px; border-radius: 50px; color: var(--text); font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; transform: translateY(20px); opacity: 0; transition: all 0.3s ease; pointer-events: none; }
        .pill.visible { transform: translateY(0); opacity: 1; }
        .qr-box { background: white; padding: 10px; border-radius: 10px; width: 140px; margin: 10px auto; }
        .qr-img { width: 100%; height: auto; }
        .tab-group { display: flex; gap: 10px; }
        .tab { flex: 1; padding: 8px; background: #131316; text-align: center; border-radius: 6px; cursor: pointer; font-size: 11px; color: #94a3b8; border: 1px solid var(--border); }
        .tab.active { background: rgba(56,189,248,0.1); border-color: var(--accent); color: var(--accent); font-weight: bold; }
    `;

    // --- HTML ---
    const HTML_TEMPLATE = `
      <div class="header">
        <div><div class="brand-title">Runway Pro</div><div style="font-size:10px; color:#94a3b8;">Automation Suite</div></div>
        <div style="display:flex; gap:10px; align-items:center;">
           <div style="cursor:pointer; font-size:16px;" id="btn-theme">☀️</div>
           <div style="cursor:pointer; font-size:18px; color:#94a3b8;" id="close-panel">✕</div>
        </div>
      </div>
      <div id="dynamic-content"></div>
    `;

    // --- INIT ---
    function createFloatingUI() {
        if (document.getElementById("runway-pro-root")) return;
        const s = document.createElement("style"); s.textContent = CSS_STYLES; document.head.appendChild(s);
        const root = document.createElement("div"); root.id = "runway-pro-root";
        if(STATE.theme==='light') root.classList.add('light-mode');
        
        const toggle = document.createElement("div"); toggle.id = "runway-pro-toggle"; toggle.innerHTML = '⚡';
        toggle.onclick = () => document.getElementById("runway-pro-panel").classList.toggle("show");
        
        const panel = document.createElement("div"); panel.id = "runway-pro-panel"; panel.innerHTML = HTML_TEMPLATE;
        
        const pill = document.createElement("div"); pill.className = "pill"; pill.id="rw-pill";
        pill.innerHTML = '<div id="pill-dot" class="status-dot"></div><span id="pill-text">Ready</span>';
        
        root.appendChild(toggle); root.appendChild(panel); document.body.appendChild(root); document.body.appendChild(pill);

        document.getElementById('close-panel').onclick = () => { panel.classList.remove('show'); toggle.style.display='flex'; };
        document.getElementById('btn-theme').onclick = () => { root.classList.toggle('light-mode'); STATE.theme = root.classList.contains('light-mode')?'light':'dark'; localStorage.setItem('rw_theme', STATE.theme); };

        // Start Auth Check
        checkAuth(STATE.token);
    }

    function render(view, msg="") {
        const c = document.getElementById('dynamic-content'); if(!c) return;
        document.getElementById('runway-pro-panel').classList.add('show');
        document.getElementById('runway-pro-toggle').style.display = 'none';

        if(view === 'login') {
            c.innerHTML = `<div style="text-align:center; padding:30px;"><h2>🔒 Locked</h2><p style="color:#94a3b8; font-size:13px;">Sign in to access tools.</p><div style="color:red; margin-top:10px;">${msg}</div><button id="btn-google" class="btn">Sign in with Google</button></div>`;
            document.getElementById('btn-google').onclick = () => window.postMessage({ type: "RW_OPEN_LOGIN" }, "*");
        }
        else if(view === 'payment') {
            c.innerHTML = `<div style="text-align:center;"><h3>Unlock Access</h3><div class="tab-group"><div id="t-pak" class="tab active">PK</div><div id="t-intl" class="tab">Global</div></div><div class="qr-box"><img id="qr-img" src="${QR_PAK}" class="qr-img"></div><input id="inp-trx" class="input" placeholder="Transaction ID"><button id="btn-verify" class="btn">Verify Payment</button><button id="btn-logout" class="btn-outline" style="width:100%; margin-top:5px;">Logout</button></div>`;
            document.getElementById('t-pak').onclick=()=>{document.getElementById('qr-img').src=QR_PAK;}; document.getElementById('t-intl').onclick=()=>{document.getElementById('qr-img').src=QR_INT;};
            document.getElementById('btn-verify').onclick = submitPayment;
            document.getElementById('btn-logout').onclick = logout;
        }
        else if(view === 'pending') {
            c.innerHTML = `<div style="text-align:center; padding:30px;"><h1>⏳</h1><h3>Pending</h3><p style="color:#94a3b8;">Admin verification.</p><button id="btn-check" class="btn">Check Status</button><button id="btn-logout" class="btn-outline" style="margin-top:10px;">Logout</button></div>`;
            document.getElementById('btn-check').onclick = () => checkAuth(STATE.token);
            document.getElementById('btn-logout').onclick = logout;
        }
        else if(view === 'dashboard') {
            c.innerHTML = `
                <div class="panel-box">
                    <div class="section-label">RUN AUTOMATION</div>
                    <select id="folderSelect" class="input"><option>Loading...</option></select>
                    <input type="file" id="csvFile" accept=".csv" class="input" />
                    <div style="display:flex; gap:10px;"><select id="delayPreset" class="input" style="flex:1;"><option value="5-8">5-8s</option><option value="8-11">8-11s</option></select><select id="promptStyle" class="input" style="flex:1;"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                    <button id="startAutoBtn" class="btn">🚀 Start Batch</button>
                    <div style="display:flex; gap:5px; margin-top:5px;"><button id="pauseBtn" class="btn-outline" style="flex:1">Pause</button><button id="stopBtn" class="btn-outline" style="flex:1; color:#ef4444; border-color:#ef4444;">Stop</button></div>
                    <div id="statusBox" style="text-align:center; margin-top:10px; font-size:11px; color:#38bdf8;">Ready.</div>
                </div>
                <div class="panel-box">
                    <div class="section-label">TRAINING</div>
                    <div id="train-list" style="display:flex; flex-direction:column; gap:5px;"></div>
                    <button id="btn-logout" class="btn-outline" style="width:100%; margin-top:10px;">Logout</button>
                </div>
            `;
            ['assets','search','image','prompt','remove'].forEach(t => {
                 const d = document.createElement('div'); d.className='train-row';
                 d.innerHTML = `<div><span class="status-dot" id="dot-${t}"></span> <span style="font-size:11px;">${t.toUpperCase()}</span></div><div><button class="btn-mini train-btn">Train</button><button class="btn-mini test-btn">Test</button></div>`;
                 d.querySelector('.train-btn').onclick = () => train(t);
                 d.querySelector('.test-btn').onclick = () => test(t);
                 document.getElementById('train-list').appendChild(d);
            });
            document.getElementById('startAutoBtn').onclick = handleStart;
            document.getElementById('stopBtn').onclick = () => { STATE.stopRequested = true; updateStatus("Stopping...", "#ef4444"); };
            document.getElementById('pauseBtn').onclick = togglePause;
            document.getElementById('btn-logout').onclick = logout;
            loadFolders(); checkCalibration();
        }
    }

    // --- AUTH ---
    async function checkAuth(token) {
        if(!token) return render('login');
        try {
            const res = await fetch(`${API_BASE}/auth?device=${localStorage.getItem("RW_DEVICE_ID")}&googleToken=${token}`);
            if(res.ok) {
                localStorage.setItem('rw_auth_token', token); STATE.token = token;
                render('dashboard');
            } else if(res.status === 402) render('payment');
            else {
                const j = await res.json();
                if(j.error.includes('PENDING')) render('pending');
                else { logout(); render('login', j.error); }
            }
        } catch(e) { render('login', "Connection Error"); }
    }

    async function submitPayment() {
        const trx = document.getElementById('inp-trx').value;
        if(!trx) return alert("Enter TRX");
        await fetch(`${API_BASE}/auth`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ googleToken: STATE.token, transactionId: trx, method: 'manual', device: localStorage.getItem("RW_DEVICE_ID") }) });
        render('pending');
    }

    function logout() { localStorage.removeItem('rw_auth_token'); STATE.token=null; render('login'); }

    // --- LOGIC ---
    function updateStatus(msg, color) { const el=document.getElementById('statusBox'); if(el){el.innerText=msg; if(color) el.style.color=color;} const p=document.getElementById('rw-pill'); if(p){ p.classList.add('visible'); document.getElementById('pill-text').innerText=msg; } }
    function togglePause() { STATE.isPaused = !STATE.isPaused; updateStatus(STATE.isPaused?"PAUSED":"Resuming...", "#fbbf24"); }
    function checkCalibration() { chrome.storage.local.get(['rw_selectors'], r => { const s=r.rw_selectors||{}; STATE.targets.forEach(t=>{ const d=document.getElementById('dot-'+t); if(d) d.classList.toggle('active', !!s[t]); }); }); }
    function train(t) { document.getElementById('runway-pro-panel').classList.remove('show'); const b=document.createElement('div'); Object.assign(b.style, {position:'fixed', top:0, left:0, width:'100%', padding:'20px', background:'#38bdf8', color:'black', textAlign:'center', zIndex:9999999, fontWeight:'bold'}); b.innerText="CLICK ["+t+"]"; document.body.appendChild(b); const h=(e)=>{ e.preventDefault(); e.stopPropagation(); const c=`COORD:${e.clientX},${e.clientY}`; chrome.storage.local.get(['rw_selectors'], r=>{ const s=r.rw_selectors||{}; s[t]=c; chrome.storage.local.set({rw_selectors:s}, ()=>{ b.remove(); document.getElementById('runway-pro-panel').classList.add('show'); checkCalibration(); }); }); document.removeEventListener('click',h,true); }; document.addEventListener('click',h,true); }
    function test(t) { chrome.storage.local.get(['rw_selectors'], r=>{ const v=(r.rw_selectors||{})[t]; if(!v) return alert("Train first"); performClick(v, 1000, t==='image'); }); }
    async function loadFolders() { const t=localStorage.getItem('RW_USER_TOKEN')||document.cookie.match(/RW_USER_TOKEN=([^;]+)/)?.[1]; if(!t) return; try{ const r=await fetch(`https://api.runwayml.com/v1/asset_groups?privateInTeam=true&asTeamId=2493493`,{headers:{Authorization:`Bearer ${t}`}}); const j=await r.json(); const s=document.getElementById('folderSelect'); s.innerHTML=''; (j.assetGroups||[]).forEach(g=>{const o=document.createElement('option'); o.value=g.id; o.textContent=g.name; s.appendChild(o);}); }catch(e){} }
    
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    async function performClick(t, time=3000, dbl=false) { if(!t) return false; const p=t.split(":")[1].split(","); const x=parseInt(p[0]), y=parseInt(p[1]); const el=document.elementFromPoint(x,y); if(!el) return false; const o=el.style.outline; el.style.outline="2px solid #d946ef"; await sleep(150); const ev={bubbles:true,cancelable:true,view:window,buttons:1,clientX:x,clientY:y,detail:1}; el.dispatchEvent(new MouseEvent('mousedown',ev)); el.dispatchEvent(new MouseEvent('mouseup',ev)); el.click(); if(dbl) { await sleep(50); el.dispatchEvent(new MouseEvent('dblclick',ev)); } setTimeout(()=>el.style.outline=o, 200); return true; }
    
    async function getAssetsInFolder(fid) { const t=localStorage.getItem('RW_USER_TOKEN')||document.cookie.match(/RW_USER_TOKEN=([^;]+)/)?.[1]; const assets=[]; let cur=null; updateStatus("Fetching...", "#38bdf8"); do { let u=`https://api.runwayml.com/v2/assets?limit=500&asTeamId=2493493&privateInTeam=true&parentAssetGroupId=${fid}&mediaTypes%5B%5D=image`; if(cur) u+=`&cursor=${cur}`; const r=await fetch(u,{headers:{Authorization:`Bearer ${t}`}}); const j=await r.json(); assets.push(...(j.assets||[])); cur=j.nextCursor; } while(cur); return assets; }
    function parseCSV(text) { const rows=[]; text.split(/\r?\n/).forEach(l=>{ const p=l.split(","); if(p.length>1) rows.push({cleanName:p[0].toLowerCase().replace(/\.(jpg|png|webp)/g,'').trim(), prompt:p[1].replace(/^"|"$/g,'')}); }); return rows; }

    async function handleStart() {
        const fid = document.getElementById('folderSelect').value;
        const file = document.getElementById('csvFile').files[0];
        if(!fid || !file) return alert("Missing Folder/CSV");
        
        STATE.stopRequested = false; document.getElementById('startAutoBtn').style.display = 'none';
        try {
            const txt = await file.text();
            const rows = parseCSV(txt);
            const assets = await getAssetsInFolder(fid);
            updateStatus("Matching...", "#fbbf24");
            const queue = [];
            rows.forEach(r => { const m = assets.find(a => a.name.toLowerCase().includes(r.cleanName)); if(m) queue.push({ ...r, assetName: m.name }); });
            if(!queue.length) throw new Error("No matches");

            // RUN QUEUE
            const res = await chrome.storage.local.get(['rw_selectors']);
            const s = res.rw_selectors || {};
            const min = 5, max = 8; // from dropdown logic

            for (let i = 0; i < queue.length; i++) {
                if (STATE.stopRequested) break;
                while(STATE.isPaused) { updateStatus("PAUSED", "#fbbf24"); await sleep(1000); }
                const item = queue[i];
                updateStatus(`Job ${i+1}/${queue.length}: ${item.cleanName}`, "#38bdf8");
                
                // LOGIC
                while(document.body.innerText.includes("Queued") || document.body.innerText.includes("Generating...")) { if(STATE.stopRequested) break; await sleep(2000); }
                if(i>0 && s.remove) { await performClick(s.remove, 1500); await sleep(2000); }
                await performClick(s.assets, 1000); await sleep(3000);
                if(await performClick(s.search, 1000)) { const el=document.activeElement; el.focus(); document.execCommand('selectAll'); document.execCommand('delete'); document.execCommand('insertText', false, item.cleanName); await sleep(3500); }
                if(!await performClick(s.image, 1000)) { let g=document.querySelector('div[data-testid="asset-grid-item"]'); if(g) { g.click(); await sleep(50); g.click(); } }
                await sleep(2000);
                if(await performClick(s.prompt, 1000)) { document.execCommand('selectAll'); document.execCommand('delete'); document.execCommand('insertText', false, item.prompt); await sleep(2000); }
                const btns=Array.from(document.querySelectorAll('button')); const gen=btns.find(b=>b.innerText.trim().toLowerCase().startsWith('generate')); if(gen) gen.click();
                
                const w = Math.floor(Math.random() * (max - min + 1) + min);
                for(let k=w; k>0; k--) { if(STATE.stopRequested) break; updateStatus(`Cooldown: ${k}s`, "#fbbf24"); await sleep(1000); }
            }
            updateStatus("Batch Complete!", "#22c55e");
        } catch(e) { updateStatus("Error: " + e.message, "#ef4444"); }
        finally { document.getElementById('startAutoBtn').style.display = 'block'; }
    }

    // Listen for Token from Shell
    window.addEventListener("message", (e) => {
        if (e.data.type === "RW_UPDATE_TOKEN") {
            STATE.token = e.data.token;
            localStorage.setItem('rw_auth_token', STATE.token);
            checkAuth(STATE.token);
        }
    });

    createFloatingUI();
    setTimeout(() => document.getElementById('runway-pro-panel').classList.add('show'), 500);
};

// Export as Eval-Ready String
module.exports = "(" + clientScript.toString() + ")()";
