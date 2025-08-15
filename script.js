// script.js
document.addEventListener('DOMContentLoaded', async () => {
    // 從config.json載入配置
    const config = await fetchConfig();
    
    // 設置頁面元素
    document.title = config.pageTitle;
    document.querySelector('.logo span').textContent = config.logoText;
    document.querySelector('.logo').style.background = config.logoColor;
    
    // 創建粒子效果
    createParticles();
    // 設置複製按鈕
    setupCopyUrlButton();
    
    // 檢測是否為微信/QQ瀏覽器
    if (isWeixinOrQQBrowser()) {
        // 顯示引導遮罩層
        document.getElementById('browserOverlay').classList.add('active');
        // 隱藏主內容
        document.querySelector('.container').style.display = 'none';
        // 停止倒計時
        return;
    }
    
    // 解密base64域名
    const domains = decodeDomains(config.domains);
    
    // 更新目標URL顯示
    updateTargetUrl("測速中...");
    
    // 測試域名速度並選擇最快的
    const results = await testDomainSpeed(domains);
    const fastest = selectFastestDomain(results);
    
    // 獲取hash路徑
    const hashPath = window.location.hash.substring(1);
    let targetUrl = fastest;
    
    // 如果有hash路徑，添加到目標URL
    if (hashPath) {
        // 確保目標URL以斜杠結尾
        if (!targetUrl.endsWith('/')) {
            targetUrl += '/';
        }
        // 移除hash路徑開頭的斜杠（如果有）
        const cleanHash = hashPath.startsWith('/') ? hashPath.substring(1) : hashPath;
        targetUrl += cleanHash;
    }
    
    updateTargetUrl(targetUrl);
    
    // 開始倒計時
    startCountdown(targetUrl, config.countdownDuration);
});

// 從config.json載入配置
async function fetchConfig() {
    try {
        const response = await fetch('config.json');
        return await response.json();
    } catch (error) {
        console.error('載入配置失敗，使用預設配置', error);
        return {
            domains: [
                "aHR0cHM6Ly9kdWppYW8udXV1aXguY29tCg==",
                "aHR0cHM6Ly9iYWlkdS5jb20=",
                "aHR0cHM6Ly8xLjEuMS4x"
            ],
            countdownDuration: 5,
            logoText: "WF",
            logoColor: "linear-gradient(45deg, #ff6b6b, #ffa502)",
            pageTitle: "跳轉到我的網站"
        };
    }
}

// 檢測微信/QQ瀏覽器
function isWeixinOrQQBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('micromessenger') || ua.includes('qq/');
}

// 解密base64域名
function decodeDomains(domains) {
    return domains.map(d => atob(d));
}

// 測試域名速度
function testDomainSpeed(domains, timeout = 2000) {
    return Promise.all(domains.map(domain => {
        return new Promise(resolve => {
            const img = new Image();
            const start = performance.now();
            let finished = false;
            img.onload = () => {
                if (!finished) {
                    finished = true;
                    resolve({domain, time: performance.now() - start});
                }
            };
            img.onerror = () => {
                if (!finished) {
                    finished = true;
                    resolve({domain, time: Infinity});
                }
            };
            img.src = domain + "/favicon.ico?_t=" + Math.random();
            setTimeout(() => {
                if (!finished) {
                    finished = true;
                    resolve({domain, time: Infinity});
                }
            }, timeout);
        });
    }));
}

// 選擇最快的域名
function selectFastestDomain(results) {
    results.sort((a, b) => a.time - b.time);
    return results[0].domain;
}

// 更新目標URL顯示
function updateTargetUrl(url) {
    document.getElementById('targetUrl').textContent = url;
}

// 開始倒計時
function startCountdown(targetUrl, duration) {
    let c = duration, el = document.getElementById('countdown');
    el.textContent = c;
    const timer = setInterval(() => {
        el.textContent = --c;
        if (c <= 0) { 
            clearInterval(timer); 
            redirectToTarget(targetUrl); 
        }
    }, 1000);
    setTimeout(() => redirectToTarget(targetUrl), duration * 1000);
}

// 重定向到目標URL
function redirectToTarget(url) {
    window.location.href = url;
}

// 創建粒子效果
function createParticles() {
    const p = document.getElementById('particles');
    for (let i = 0; i < 20; i++) {
        const d = document.createElement('div');
        d.className = 'particle';
        const s = Math.random() * 10 + 5;
        d.style.width = d.style.height = s + 'px';
        d.style.left = (Math.random() * 100) + '%';
        d.style.animationDelay = (Math.random() * 15) + 's';
        d.style.animationDuration = (10 + Math.random() * 20) + 's';
        p.appendChild(d);
    }
}

// 複製URL功能
function setupCopyUrlButton() {
    const btn = document.getElementById('copyUrlBtn');
    btn.addEventListener('click', () => {
        // 複製當前頁面URL（包含hash）
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const originalText = btn.textContent;
            btn.innerHTML = '<i class="fas fa-check"></i> 已複製';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('複製失敗:', err);
            btn.textContent = '複製失敗';
        });
    });
}

// 添加一個輔助函數來解析hash路徑
function parseHashPath() {
    const hash = window.location.hash.substring(1);
    if (!hash) return null;
    
    // 嘗試解析hash為對象（如果是JSON格式）
    try {
        return JSON.parse(decodeURIComponent(hash));
    } catch (e) {
        // 如果不是JSON，返回原始字符串
        return hash;
    }
}

// 示例用法（可選）
// const pathInfo = parseHashPath();
// if (typeof pathInfo === 'string') {
//   console.log("Hash路徑:", pathInfo);
// } else if (pathInfo) {
//   console.log("解析的Hash對象:", pathInfo);
// }