// lib/login.js - The Locked UI (Login + Payment)

module.exports = `
(() => {
    // REMOVE OLD UI
    if(document.getElementById("runway-pro-panel")) document.getElementById("runway-pro-panel").remove();
    if(document.getElementById("rw-login-root")) document.getElementById("rw-login-root").remove();

    // IMAGES
    const QR_PAK = "https://i.imgur.com/YourPakQR.png"; 
    const QR_INT = "https://i.imgur.com/YourBinanceQR.png";

    // CREATE STYLE
    const style = document.createElement('style');
    style.textContent = \`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        #rw-login-root {
            font-family: 'Inter', sans-serif; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 2147483648; padding: 30px; border-radius: 16px;
            background: #0f172a; border: 1px solid #334155;
            box-shadow: 0 50px 200px rgba(0,0,0,0.95); color: white;
            display: flex; flex-direction: column; gap: 15px; width: 400px; text-align: center;
        }
        .rw-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; display:flex; align-items:center; justify-content:center; gap:10px; font-size:14px; }
        .rw-btn-primary { background: linear-gradient(135deg, #38bdf8, #818cf8); color: #0f172a; }
        .rw-btn-gold { background: linear-gradient(135deg, #fbbf24, #d97706); color: #0f172a; }
        .rw-btn:hover { filter: brightness(1.1); }
        .rw-input { background: #1e293b; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; outline: none; margin-top: 10px; box-sizing:border-box; }
        .rw-tab-group { display: flex; gap: 10px; margin-bottom: 5px; }
        .rw-tab { flex: 1; padding: 8px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .rw-tab.active { background: #38bdf8; color: #0f172a; font-weight: bold; }
        .rw-qr { width: 140px; height: 140px; border-radius: 10px; border: 2px solid white; margin: 10px auto; object-fit: cover; background: white; }
        .rw-close { position: absolute; top: 15px; right: 15px; cursor: pointer; color: #94a3b8; font-size: 18px; }
    \`;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = "rw-login-root";
    document.body.appendChild(root);

    // RENDER FUNCTION
    window.renderLoginState = (state, msg="") => {
        const root = document.getElementById("rw-login-root");
        
        if(state === 'login') {
            root.innerHTML = \`
                <div class="rw-close" onclick="document.getElementById('rw-login-root').remove()">✕</div>
                <h2 style="margin:0;">✨ Runway Pro</h2>
                <p style="margin:0; color:#94a3b8; font-size:13px;">Sign in to verify subscription</p>
                <button id="rw-google-btn" class="rw-btn rw-btn-primary">Continue with Google</button>
                <div style="color:#ef4444; font-size:12px;">\${msg}</div>
            \`;
            document.getElementById('rw-google-btn').onclick = () => {
                window.postMessage({ type: "RW_OPEN_LOGIN" }, "*");
            };
        }
        else if(state === 'payment') {
            root.innerHTML = \`
                <div class="rw-close" onclick="document.getElementById('rw-login-root').remove()">✕</div>
                <h2 style="margin:0;">Unlock Access 🔓</h2>
                <div class="rw-tab-group"><div id="tab-pak" class="rw-tab active">🇵🇰 Pakistan</div><div id="tab-intl" class="rw-tab">🌍 International</div></div>
                <div id="qr-con" style="text-align:center;"><img id="qr-img" src="\${QR_PAK}" class="rw-qr"><div id="qr-txt" style="font-size:11px; color:#94a3b8;">Scan with JazzCash/EasyPaisa</div></div>
                <input id="rw-trx" class="rw-input" placeholder="Enter Transaction ID">
                <button id="rw-pay" class="rw-btn rw-btn-gold">Verify Payment</button>
            \`;
            
            // Tabs
            document.getElementById('tab-pak').onclick = (e) => { 
                e.target.classList.add('active'); document.getElementById('tab-intl').classList.remove('active');
                document.getElementById('qr-img').src = QR_PAK; document.getElementById('qr-txt').innerText = "Scan with JazzCash/EasyPaisa";
            };
            document.getElementById('tab-intl').onclick = (e) => { 
                e.target.classList.add('active'); document.getElementById('tab-pak').classList.remove('active');
                document.getElementById('qr-img').src = QR_INT; document.getElementById('qr-txt').innerText = "Scan with Binance/USDT";
            };

            // Submit
            document.getElementById('rw-pay').onclick = () => {
                const trx = document.getElementById('rw-trx').value;
                if(!trx) return alert("Enter ID");
                window.postMessage({ type: "RW_SUBMIT_PAYMENT", trx: trx, method: 'manual' }, "*");
            };
        }
        else if(state === 'pending') {
            root.innerHTML = \`
                <div class="rw-close" onclick="document.getElementById('rw-login-root').remove()">✕</div>
                <div style="font-size:40px;">⏳</div><h2>Pending Approval</h2>
                <p style="color:#94a3b8; font-size:13px;">Admin is verifying payment.</p>
                <button id="rw-check" class="rw-btn rw-btn-primary">Check Status</button>
            \`;
            document.getElementById('rw-check').onclick = () => window.postMessage({ type: "RW_CHECK_AUTH" }, "*");
        }
    };

    // Initial Render
    const ERROR = "\${typeof ERROR_MSG !== 'undefined' ? ERROR_MSG : ''}";
    const INITIAL_STATE = "\${typeof INITIAL_STATE !== 'undefined' ? INITIAL_STATE : 'login'}";
    renderLoginState(INITIAL_STATE, ERROR);
})();
`;
