module.exports = `
(() => {
    // Clean up old UI
    if(document.getElementById("runway-pro-panel")) document.getElementById("runway-pro-panel").remove();
    if(document.getElementById("rw-login-root")) document.getElementById("rw-login-root").remove();

    const QR_PAK = "https://i.imgur.com/YourPakQR.png"; 
    const QR_INT = "https://i.imgur.com/YourBinanceQR.png";

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
        .rw-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; margin-top:10px; }
        .rw-primary { background: linear-gradient(135deg, #38bdf8, #818cf8); color: #0f172a; }
        .rw-input { background: #1e293b; border: 1px solid #334155; color: white; padding: 12px; border-radius: 8px; width: 100%; outline: none; box-sizing:border-box; }
        .rw-close { position: absolute; top: 15px; right: 15px; cursor: pointer; color: #94a3b8; font-size: 18px; }
    \`;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = "rw-login-root";
    document.body.appendChild(root);

    // STATE MANAGER
    const STATE = "INITIAL_STATE"; // Replaced by Server
    const ERROR = "ERROR_MSG";     // Replaced by Server

    if(STATE === 'login') {
        root.innerHTML = \`
            <div class="rw-close" id="rw-close-btn">✕</div>
            <h2 style="margin:0;">Runway Pro 🔒</h2>
            <p style="color:#94a3b8; font-size:13px; margin:0;">Sign in to unlock automation.</p>
            <button id="rw-login-btn" class="rw-btn rw-primary">Continue with Google</button>
            <div style="color:#ef4444; font-size:12px; margin-top:5px;">\${ERROR !== 'ERROR_MSG' ? ERROR : ''}</div>
        \`;
        document.getElementById("rw-login-btn").onclick = () => window.postMessage({ type: "RW_OPEN_LOGIN" }, "*");
    }
    else if(STATE === 'payment') {
        root.innerHTML = \`
            <div class="rw-close" id="rw-close-btn">✕</div>
            <h2 style="margin:0;">Unlock Access</h2>
            <p style="color:#94a3b8; font-size:12px;">Subscription Required</p>
            <input id="rw-trx" class="rw-input" placeholder="Enter Transaction ID">
            <button id="rw-pay" class="rw-btn rw-primary">Verify Payment</button>
        \`;
        document.getElementById("rw-pay").onclick = () => {
            const trx = document.getElementById('rw-trx').value;
            if(trx) window.postMessage({ type: "RW_SUBMIT_PAYMENT", trx: trx }, "*");
        };
    }
    else if(STATE === 'pending') {
        root.innerHTML = \`
            <div class="rw-close" id="rw-close-btn">✕</div>
            <div style="font-size:40px;">⏳</div><h2>Pending</h2>
            <p style="color:#94a3b8; font-size:13px;">Admin verification in progress.</p>
            <button id="rw-check" class="rw-btn rw-primary">Check Status</button>
        \`;
        document.getElementById("rw-check").onclick = () => window.postMessage({ type: "RW_CHECK_AUTH" }, "*");
    }

    document.getElementById("rw-close-btn").onclick = () => root.remove();
})();
`;
