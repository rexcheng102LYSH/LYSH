// ================= 视觉特效引擎 (Visual Effects) =================
// [Alpha 0.7.8.2]
// - 閃電特效全面升級：電流粒子、電弧爆發、能量波動、環境電離
// - 新增五層視覺效果：光暈、主路徑、移動粒子、分支爆發、核心閃光
// - 保持其他特效穩定性

const VisualFX = {
    canvas: null,
    ctx: null,
    animationId: null,
    
    // FPS 計數器
    fps: {
        frameCount: 0,
        lastTime: performance.now(),
        currentFps: 0
    },
    
    // 全屏鼠标
    mouse: { x: -1000, y: -1000, active: false, click: false },

    // 渲染状态
    state: {
        active: false,
        startTime: 0,
        
        // 连珠
        lineType: null, 
        linePoints: [],
        lineParticles: [],
        lightningData: null,
        
        // 胜利特效
        celebrationType: null, 
        fireworks: { rockets: [], explosions: [] },
        
        // [New] DJ 節奏遊戲數據 - 三階段系統
        dj: {
            phase: 'idle', // 'challenge', 'fail', 'victory'
            
            // 挑戰階段
            notes: [], // 飛向鼓的音符 {x, y, vx, vy, targetTime, hit}
            kickScale: 1.0,
            bgFlash: 0,
            spotlights: [],
            
            // 失敗階段
            darknessAlpha: 0, // 黑暗覆蓋透明度
            
            // 勝利階段
            autoKickTimer: 0,
            victoryParticles: [] // 勝利粒子效果
        }
    },

    init: function() {
        // 【修復】防止重複初始化導致事件監聽器多次綁定
        if (this._initialized) {
            console.log('[FX] 已初始化，跳過重複綁定');
            // 只更新 canvas 尺寸
            if (this.canvas) this.resize();
            return;
        }
        
        this.canvas = document.getElementById('fxCanvas');
        if (this.canvas) {
            // 啟用低延遲模式和透明度
            this.ctx = this.canvas.getContext('2d', { 
                alpha: true, 
                desynchronized: true 
            });
            this.resize();
            window.addEventListener('resize', () => this.resize());
            
            document.addEventListener('mousemove', e => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                this.mouse.active = true;
            });
            document.addEventListener('mouseleave', () => { this.mouse.active = false; });
            
            // [New] 绑定点击事件用于打鼓
            this.canvas.addEventListener('mousedown', (e) => {
                console.log('[Canvas] mousedown 事件觸發！celebrationType:', this.state.celebrationType);
                if (this.state.celebrationType === 'dj') {
                    console.log('[Canvas] 是 DJ 模式，調用 handleDrumHit');
                    this.handleDrumHit(e);
                } else {
                    console.log('[Canvas] 不是 DJ 模式，忽略點擊');
                }
            }, true); // 使用捕獲階段，優先處理
            
            // 【調試】添加全局點擊監聽
            document.addEventListener('mousedown', (e) => {
                console.log('[Document] 全局點擊事件，目標:', e.target.tagName, e.target.id);
            }, true);
            
            // Canvas 預熱優化：提前觸發 GPU 編譯
            this.warmupCanvas();
            
            // 標記已初始化
            this._initialized = true;
            console.log('[FX] 初始化完成，事件監聽器已綁定');
        }
    },

    // Canvas 預熱函數：提前觸發所有渲染操作的 GPU 編譯
    // 解決首次播放特效時的卡頓問題
    warmupCanvas: function() {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // 保存當前狀態
        ctx.save();
        
        // 1. 預熱混合模式
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalCompositeOperation = 'source-over';
        
        // 2. 預熱線性漸變
        const linearGrad = ctx.createLinearGradient(0, 0, w, h);
        linearGrad.addColorStop(0, 'rgba(255, 0, 0, 1)');
        linearGrad.addColorStop(0.5, 'rgba(0, 255, 0, 0.5)');
        linearGrad.addColorStop(1, 'rgba(0, 0, 255, 0)');
        ctx.fillStyle = linearGrad;
        ctx.fillRect(0, 0, 1, 1);
        
        // 3. 預熱徑向漸變
        const radialGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 100);
        radialGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGrad;
        ctx.fillRect(0, 0, 1, 1);
        
        // 4. 預熱各種繪製操作
        // 填充圓形
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(10, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 描邊圓形
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(20, 20, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // 陰影效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 255, 0.5)';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.fillRect(30, 30, 5, 5);
        ctx.shadowBlur = 0;
        
        // 文字渲染
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('W', 40, 40);
        
        // 5. 預熱 HSL 顏色（煙花特效使用）
        for (let i = 0; i < 360; i += 60) {
            ctx.fillStyle = `hsla(${i}, 100%, 60%, 0.5)`;
            ctx.fillRect(0, 0, 1, 1);
        }
        
        // 6. 預熱線條繪製（連珠特效使用）
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(10, 10);
        ctx.stroke();
        
        // 7. 預熱 lighter 混合模式（煙花和聚光燈使用）
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, 10, 10);
        
        // 清除預熱痕跡
        ctx.restore();
        ctx.clearRect(0, 0, w, h);
    },

    resize: function() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    clear: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.ctx) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalCompositeOperation = 'source-over';
            // 重置所有 Canvas 狀態
            this.ctx.shadowBlur = 0;
            this.ctx.shadowColor = 'transparent';
            this.ctx.globalAlpha = 1.0;
        }
        
        // 【修復】恢復 Canvas 點擊穿透
        if (this.canvas) {
            this.canvas.style.pointerEvents = 'none';
        }
        
        // 【修復】恢復技能按鈕和悔棋按鈕顯示
        const skillBtn = document.getElementById('skillBtn');
        if (skillBtn) skillBtn.style.display = '';
        const undoBtn = document.querySelector('[onclick="undoMove()"]');
        if (undoBtn) undoBtn.style.display = '';
        
        // 清理緩存
        this._goldGradientCache = null;
        
        this.state = {
            active: false,
            startTime: 0,
            lineType: null,
            linePoints: [],
            lineParticles: [],
            lightningData: null,
            celebrationType: null,
            fireworks: { 
                rockets: [], 
                explosions: [],
                lastLaunchTime: 0,
                launchInterval: 1000 / 3
            },
            dj: { 
                phase: 'idle',
                notes: [], 
                kickScale: 1.0, 
                bgFlash: 0, 
                spotlights: [], 
                darknessAlpha: 0,
                autoKickTimer: 0,
                victoryParticles: []
            }
        };
        
        if (typeof SoundEngine !== 'undefined' && SoundEngine.stopDJGame) SoundEngine.stopDJGame();
    },

    getCoords: function(r, c) {
        const cell = document.getElementById(`c-${r}-${c}`);
        if (!cell) return null;
        const rect = cell.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    },

    startLoop: function() {
        // 由 FrameRateController 統一管理，已在頁面加載時啟動
        this.state.active = true;
        this.state.startTime = performance.now();
    },

    drawWinLine: function(lineCells, type) {
        this.state.lineType = type;
        this.state.linePoints = lineCells.map(p => this.getCoords(p.r, p.c)).filter(p => p);
        this.state.lineParticles = [];
        this.state.lightningData = null;

        if (this.state.linePoints.length < 2) return;

        if (type === 'lightning') {
            this.state.lightningData = this.generateLightningPath(this.state.linePoints[0], this.state.linePoints[this.state.linePoints.length-1], 35);
        } else if (type === 'default' || type === 'gold') {
            for(let i=0; i<30; i++) {
                this.state.lineParticles.push({
                    t: Math.random(), 
                    offset: (Math.random() - 0.5) * 20, 
                    speed: 0.002 + Math.random() * 0.005,
                    size: Math.random() * 3 + 1,
                    life: Math.random() * Math.PI * 2,
                    blinkSpeed: 0.05 + Math.random() * 0.1
                });
            }
        }
        this.startLoop();
    },

    startCelebration: function(type) {
        if (type === 'default') return; 
        this.state.celebrationType = type;
        
        if (type === 'fireworks') {
            this.state.fireworks = { 
                rockets: [], 
                explosions: [],
                lastLaunchTime: 0,  // 記錄上次發射時間
                launchInterval: 1000 / 3  // 每秒3枚 = 333.33ms間隔
            };
        } 
        // [New] DJ 三階段初始化
        else if (type === 'dj') {
            console.log('[DJ] 啟動 DJ 模式');
            
            // 【修復】隱藏技能按鈕和悔棋按鈕
            const skillBtn = document.getElementById('skillBtn');
            if (skillBtn) {
                skillBtn.style.display = 'none';
                console.log('[DJ] 隱藏技能按鈕');
            }
            const undoBtn = document.querySelector('[onclick="undoMove()"]');
            if (undoBtn) {
                undoBtn.style.display = 'none';
                console.log('[DJ] 隱藏悔棋按鈕');
            }
            
            // 【修復】Canvas 接收點擊事件
            if (this.canvas) {
                this.canvas.style.pointerEvents = 'auto';
                console.log('[DJ] Canvas pointerEvents 設為 auto');
                console.log('[DJ] Canvas 當前樣式:', window.getComputedStyle(this.canvas).pointerEvents);
            }
            
            this.state.dj = {
                phase: 'challenge',
                notes: [],
                kickScale: 1.0,
                bgFlash: 0,
                spotlights: [
                    { x: 0.2, fixed: true, color: '#B3E5FC' }, // 淺藍
                    { x: 0.4, fixed: true, color: '#E1BEE7' }, // 淺紫
                    { x: 0.6, fixed: true, color: '#C8E6C9' }, // 淺綠
                    { x: 0.8, fixed: true, color: '#FFF9C4' }  // 淺黃
                ],
                darknessAlpha: 0,
                autoKickTimer: 0,
                victoryParticles: [],
                missText: null,      // MISS 文字特效
                perfectText: null    // PERFECT 文字特效
            };
            
            console.log('[DJ] DJ 狀態初始化完成');
            
            // 設置回調函數供 audio.js 調用
            window.djMissCallback = () => this.onDJMiss();
            window.djFailCallback = () => this.onDJFail();
            window.djVictoryCallback = () => this.onDJVictory();
            window.djAutoKickCallback = () => this.onDJAutoKick();
            
            // 啟動音頻引擎的 DJ 挑戰
            if (typeof SoundEngine !== 'undefined') {
                console.log('[DJ] 啟動音頻引擎');
                SoundEngine.startDJChallenge();
            }
        }
        
        this.startLoop();
    },

    renderFrame: function(now) {
        // 如果沒有活動特效，跳過渲染以節省 GPU
        if (!this.state.active && !this.state.lineType && !this.state.celebrationType) {
            this.updateAndRenderFPS(now);
            return;
        }
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const elapsed = now - this.state.startTime;

        // 清屏
        ctx.clearRect(0, 0, w, h);

        // 1. 绘制连珠 (Win Line)
        if (this.state.lineType && this.state.linePoints.length >= 2) {
            const type = this.state.lineType;
            const pts = this.state.linePoints;
            // DJ 模式下为了突出节奏，稍微压暗连珠
            if (this.state.celebrationType === 'dj') ctx.globalAlpha = 0.6;
            
            if (type === 'default') this.renderDefaultLine(pts, elapsed);
            else if (type === 'lightning') this.renderLightning(pts, this.state.lightningData, elapsed);
            else if (type === 'gold') this.renderGold(pts, elapsed);
            else if (type === 'future') this.renderFuture(pts, elapsed);
            
            ctx.globalAlpha = 1.0;
        }

        // 2. 绘制胜利特效
        if (this.state.celebrationType === 'fireworks') {
            this.renderFireworks(ctx, w, h, now);  // 傳遞 now 參數
        } else if (this.state.celebrationType === 'dj') {
            this.renderDJGame(ctx, w, h, now);
        }
        
        // 3. 繪製 FPS 計數器
        this.updateAndRenderFPS(now);
    },

    // =========================================
    // 🥁 DJ 三階段系統
    // =========================================
    
    // FPS 計算和渲染
    updateAndRenderFPS: function(now) {
        // 更新 FPS 計數
        this.fps.frameCount++;
        const timeDelta = now - this.fps.lastTime;
        
        // 每 500ms 更新一次 FPS 值
        if (timeDelta >= 500) {
            this.fps.currentFps = Math.round((this.fps.frameCount * 1000) / timeDelta);
            this.fps.frameCount = 0;
            this.fps.lastTime = now;
            
            // 更新 DOM 元素
            const fpsCounter = document.getElementById('fpsCounter');
            if (fpsCounter) {
                fpsCounter.textContent = `FPS: ${this.fps.currentFps}`;
            }
        }
    },
    
    // 玩家擊鼓（僅在挑戰階段有效）
    handleDrumHit: function(e) {
        const dj = this.state.dj;
        console.log('[FX] handleDrumHit 被調用，phase:', dj.phase);
        
        if (dj.phase !== 'challenge') return;
        
        // 【修復】阻止事件冒泡和默認行為
        if (e) {
            e.stopPropagation();
            e.stopImmediatePropagation(); // 阻止同一元素上的其他監聽器
            e.preventDefault();
        }
        
        // 【防抖】防止短時間內多次調用
        const now = performance.now();
        if (this._lastHitTime && now - this._lastHitTime < 100) {
            console.log('[FX] 防抖：忽略重複點擊');
            return;
        }
        this._lastHitTime = now;
        
        // 視覺反馈：鼓面收縮
        dj.kickScale = 0.8;
        
        // 調用音頻引擎判定
        if (typeof SoundEngine !== 'undefined') {
            console.log('[FX] 調用 SoundEngine.djPlayerHit()');
            const success = SoundEngine.djPlayerHit();
            console.log('[FX] 判定結果:', success ? '成功' : '失敗');
            if (success) {
                dj.bgFlash = 1.0; // 屏幕閃白
                dj.kickScale = 1.3; // 鼓面膨脹
                this.createHitParticles();
            }
        }
    },
    
    // 擊中粒子效果
    createHitParticles: function() {
        const dj = this.state.dj;
        const w = this.canvas.width;
        const drumX = w / 2;
        const drumY = this.canvas.height - 80;
        
        // 創建爆發粒子
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (2 + Math.random() * 4) * 1.2;  // 提速 20%
            dj.victoryParticles.push({
                x: drumX,
                y: drumY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: `hsl(${Math.random() * 60 + 150}, 100%, 60%)`
            });
        }
    },
    
    // 回調：錯過節拍（顯示 MISS）
    onDJMiss: function() {
        const dj = this.state.dj;
        dj.bgFlash = 0.3;
        
        // 創建 MISS 文字特效（永久停留）
        const w = this.canvas.width;
        const h = this.canvas.height;
        dj.missText = {
            x: w / 2,
            y: h / 4, // 【修復】移到畫面上方 1/4，避免被彈窗遮住
            alpha: 0,
            scale: 0.5,
            targetScale: 1.5,
            permanent: true // 永久顯示
        };
    },
    
    // 回調：挑戰失敗
    onDJFail: function() {
        const dj = this.state.dj;
        dj.phase = 'fail';
        dj.darknessAlpha = 0;
        // 開始黑暗吞噬動畫
    },
    
    // 回調：挑戰成功
    onDJVictory: function() {
        const dj = this.state.dj;
        dj.phase = 'victory';
        
        // 創建 PERFECT 文字特效
        const w = this.canvas.width;
        const h = this.canvas.height;
        dj.perfectText = {
            x: w / 2,
            y: h / 4, // 與 MISS 等高，避免被彈窗遮住
            alpha: 0,
            scale: 0.5,
            life: 1.0
        };
        
        // 聚光燈改為旋轉模式（五顏六色）
        dj.spotlights = Array(4).fill(0).map(() => ({ 
            angle: Math.random() * Math.PI, 
            speed: (Math.random()-0.5)*0.02, 
            color: `hsl(${Math.random()*360}, 80%, 60%)`,
            fixed: false
        }));
        
        // 創建勝利粒子噴泉
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                dj.victoryParticles.push({
                    x: w / 2,
                    y: h - 80,
                    vx: (Math.random() - 0.5) * 8 * 1.2,
                    vy: (-5 - Math.random() * 5) * 1.2,
                    life: 1.0,
                    color: `hsl(${Math.random() * 360}, 100%, 60%)`
                });
            }, i * 50);
        }
    },
    
    // 回調：自動擊鼓
    onDJAutoKick: function() {
        const dj = this.state.dj;
        dj.kickScale = 0.7;
        dj.bgFlash = 0.8;
        this.createHitParticles();
    },

    renderDJGame: function(ctx, w, h, now) {
        const dj = this.state.dj;
        
        // === 階段一：挑戰模式 ===
        if (dj.phase === 'challenge') {
            this.renderDJChallenge(ctx, w, h, now);
        }
        // === 階段二：失敗模式 ===
        else if (dj.phase === 'fail') {
            this.renderDJFailure(ctx, w, h, now);
        }
        // === 階段三：勝利模式 ===
        else if (dj.phase === 'victory') {
            this.renderDJVictory(ctx, w, h, now);
        }
    },
    
    // 渲染挑戰階段
    renderDJChallenge: function(ctx, w, h, now) {
        const dj = this.state.dj;
        
        // 1. 壓暗背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);
        
        // 2. 固定聚光燈（挑戰階段）
        ctx.globalCompositeOperation = 'lighter';
        const drumX = w / 2;
        const drumY = h - 80;
        
        dj.spotlights.forEach(s => {
            const sx = w * s.x;  // 固定 x 位置
            const sy = -100;
            const ex = drumX;    // 統一照射鼓心
            const ey = drumY;
            
            const grd = ctx.createLinearGradient(sx, sy, ex, ey);
            grd.addColorStop(0, s.color);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex - 50, ey);
            ctx.lineTo(ex + 50, ey);
            ctx.fill();
        });
        
        // 3. 閃白效果
        if (dj.bgFlash > 0.01) {
            ctx.fillStyle = `rgba(255, 255, 255, ${dj.bgFlash * 0.3})`;
            ctx.fillRect(0, 0, w, h);
            dj.bgFlash *= 0.85;
        }
        ctx.globalCompositeOperation = 'source-over';
        
        // 4. 繪製節拍提示圓環
        if (typeof SoundEngine !== 'undefined' && SoundEngine.djGame.active) {
            const beats = SoundEngine.djGame.challengeBeats;
            const currentTime = SoundEngine.ctx.currentTime;
            
            beats.forEach(beat => {
                if (beat.hit || beat.missed) return;
                
                const timeToBeat = beat.time - currentTime;
                
                if (timeToBeat > 0 && timeToBeat < 2) {
                    const progress = 1 - (timeToBeat / 2);
                    const distance = 300 * (1 - progress);
                    const alpha = 0.3 + progress * 0.7;
                    const size = 10 + progress * 10;
                    
                    ctx.fillStyle = `rgba(0, 230, 118, ${alpha})`;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#00e676';
                    ctx.beginPath();
                    ctx.arc(drumX, drumY - distance, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    ctx.strokeStyle = `rgba(0, 230, 118, ${alpha * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(drumX, drumY - distance, size + 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }
        
        // 5. 繪製鼓
        this.drawDrum(ctx, w, h, dj);
        
        // 6. 繪製粒子
        this.updateAndDrawParticles(ctx, dj);
        
        // 7. 繪製 MISS 文字特效
        if (dj.missText && dj.missText.life > 0) {
            const miss = dj.missText;
            miss.y += miss.vy;
            miss.scale += (1.5 - miss.scale) * 0.1;
            miss.life -= 0.02;
            miss.alpha = miss.life;
            
            ctx.save();
            ctx.translate(miss.x, miss.y);
            ctx.scale(miss.scale, miss.scale);
            ctx.globalAlpha = miss.alpha;
            
            ctx.fillStyle = '#FF1744';
            ctx.font = 'bold 64px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FF1744';
            ctx.fillText('MISS', 0, 0);
            
            ctx.restore();
            
            if (miss.life <= 0) dj.missText = null;
        }
    },
    
    // 渲染失敗階段
    renderDJFailure: function(ctx, w, h, now) {
        const dj = this.state.dj;
        
        // 黑暗逐漸吞噬
        if (dj.darknessAlpha < 1.0) {
            dj.darknessAlpha += 0.02;
        }
        
        ctx.fillStyle = `rgba(0, 0, 0, ${dj.darknessAlpha})`;
        ctx.fillRect(0, 0, w, h);
        
        // 【修復】MISS 文字永久停留在黑屏上
        if (dj.missText) {
            const miss = dj.missText;
            
            // 動畫：淡入 + 放大
            if (miss.alpha < 1.0) {
                miss.alpha += 0.05;
            }
            if (miss.scale < miss.targetScale) {
                miss.scale += (miss.targetScale - miss.scale) * 0.1;
            }
            
            ctx.save();
            ctx.translate(miss.x, miss.y);
            ctx.scale(miss.scale, miss.scale);
            ctx.globalAlpha = miss.alpha;
            
            ctx.fillStyle = '#FF1744';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#FF1744';
            ctx.fillText('MISS', 0, 0);
            
            ctx.restore();
        }
    },
    
    // 渲染勝利階段
    renderDJVictory: function(ctx, w, h, now) {
        const dj = this.state.dj;
        
        // 1. 華麗背景
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 20, 147, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // 2. 旋轉聚光燈（五顏六色）
        ctx.globalCompositeOperation = 'lighter';
        dj.spotlights.forEach(s => {
            if (!s.fixed) {
                s.angle += s.speed * 2;
                const sx = w/2 + Math.cos(s.angle) * w * 0.5;
                const sy = -100;
                const ex = w/2 + Math.sin(s.angle) * (w*0.8);
                const ey = h;
                
                const grd = ctx.createLinearGradient(sx, sy, ex, ey);
                grd.addColorStop(0, s.color);
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex - 50, ey);
                ctx.lineTo(ex + 50, ey);
                ctx.fill();
            }
        });
        
        // 3. 閃白效果
        if (dj.bgFlash > 0.01) {
            ctx.fillStyle = `rgba(255, 255, 255, ${dj.bgFlash * 0.4})`;
            ctx.fillRect(0, 0, w, h);
            dj.bgFlash *= 0.85;
        }
        ctx.globalCompositeOperation = 'source-over';
        
        // 4. 繪製自動擊鼓的鼓
        this.drawDrum(ctx, w, h, dj);
        
        // 5. 繪製勝利粒子
        this.updateAndDrawParticles(ctx, dj);
        
        // 6. 繪製 PERFECT 文字特效
        if (dj.perfectText && dj.perfectText.life > 0) {
            const perfect = dj.perfectText;
            perfect.alpha += (1.0 - perfect.alpha) * 0.05;
            perfect.scale += (1.2 - perfect.scale) * 0.05;
            perfect.life -= 0.005;
            
            ctx.save();
            ctx.translate(perfect.x, perfect.y);
            ctx.scale(perfect.scale, perfect.scale);
            ctx.globalAlpha = perfect.alpha;
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#FFD700';
            ctx.fillText('PERFECT!', 0, 0);
            
            ctx.restore();
            
            if (perfect.life <= 0) dj.perfectText = null;
        }
    },
    
    // 繪製鼓
    drawDrum: function(ctx, w, h, dj) {
        const drumX = w / 2;
        const drumY = h - 80;
        
        // 【調試】判定提示燈 - 顯示當前是否可以擊中
        let canHit = false;
        let indicatorColor = '#FF1744'; // 默認紅色（不可擊中）
        
        if (typeof SoundEngine !== 'undefined' && SoundEngine.djGame.active) {
            const currentTime = SoundEngine.ctx.currentTime;
            const hitWindow = 0.4; // 【翻倍】400ms 判定窗口
            const beats = SoundEngine.djGame.challengeBeats;
            
            // 檢查是否有節拍在判定窗口內
            for (let beat of beats) {
                if (!beat.hit && !beat.missed) {
                    const timeDiff = Math.abs(currentTime - beat.time);
                    if (timeDiff <= hitWindow) {
                        canHit = true;
                        indicatorColor = '#00E676'; // 綠色（可擊中）
                        break;
                    }
                }
            }
        }
        
        // 繪製提示燈（鼓上方）
        const indicatorY = drumY - 60;
        const indicatorSize = 15;
        
        // 外圈光暈
        ctx.shadowBlur = 20;
        ctx.shadowColor = indicatorColor;
        ctx.fillStyle = indicatorColor;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(drumX, indicatorY, indicatorSize + 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 內圈實心
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = indicatorColor;
        ctx.beginPath();
        ctx.arc(drumX, indicatorY, indicatorSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(drumX - 5, indicatorY - 5, indicatorSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        
        // 鼓的縮放動畫
        dj.kickScale += (1.0 - dj.kickScale) * 0.2;
        const radius = 40 * dj.kickScale;
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00e676';
        ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(drumX, drumY, radius, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(dj.phase === 'challenge' ? 'CLICK' : '♪', drumX, drumY);
        ctx.shadowBlur = 0;
    },
    
    // 更新並繪製粒子
    updateAndDrawParticles: function(ctx, dj) {
        for (let i = dj.victoryParticles.length - 1; i >= 0; i--) {
            const p = dj.victoryParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.24;  // 提速 20% (0.2 * 1.2)
            p.life -= 0.024;  // 提速 20% (0.02 * 1.2)
            
            if (p.life <= 0) {
                dj.victoryParticles.splice(i, 1);
                continue;
            }
            
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },

    // =========================================
    // ✨ 煙花邏輯 (Fireworks) - 優化版
    // =========================================
    renderFireworks: function(ctx, w, h, now) {
        const fw = this.state.fireworks;
        
        // 固定頻率發射火箭（每秒3枚）
        if (!fw.lastLaunchTime) fw.lastLaunchTime = now;
        if (now - fw.lastLaunchTime >= fw.launchInterval) {
            fw.lastLaunchTime = now;
            
            const hue = Math.floor(Math.random() * 360);
            
            // 計算朝向鼠標的方向
            let targetX = this.mouse.active ? this.mouse.x : w / 2;
            let targetY = this.mouse.active ? this.mouse.y : h * 0.3;
            
            // 隨機起始位置（屏幕底部）
            const startX = Math.random() * w;
            const startY = h + 10;
            
            // 計算方向向量
            const dx = targetX - startX;
            const dy = targetY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 歸一化並設置速度（朝向鼠標）
            const speed = 12 * 1.2;  // 提速 20%
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            
            // 記錄目標爆炸位置（鼠標附近隨機範圍）
            const explodeRadius = 150;  // 在鼠標周圍150px範圍內隨機爆炸
            const randomAngle = Math.random() * Math.PI * 2;
            const randomDist = Math.random() * explodeRadius;
            const explodeX = targetX + Math.cos(randomAngle) * randomDist;
            const explodeY = targetY + Math.sin(randomAngle) * randomDist;
            
            fw.rockets.push({
                x: startX,
                y: startY,
                vx: vx,
                vy: vy,
                hue: hue,
                trail: [],
                explodeX: explodeX,  // 目標爆炸位置
                explodeY: explodeY
            });
            
            // 移除發射音效，改為在爆炸時播放
        }
        
        // 渲染火箭
        ctx.globalCompositeOperation = 'lighter';
        for (let i = fw.rockets.length - 1; i >= 0; i--) {
            let r = fw.rockets[i];
            
            // 更新位置（不再受鼠標吸引，保持直線飛行）
            r.x += r.vx; 
            r.y += r.vy; 
            r.vy += 0.12;  // 提速 20% (0.1 * 1.2) - 輕微重力
            r.vx *= 0.99;  // 輕微空氣阻力
            
            // 更新軌跡
            r.trail.push({x: r.x, y: r.y}); 
            if (r.trail.length > 12) r.trail.shift();
            
            // 優化：使用純色代替 gradient
            ctx.lineWidth = 5;
            ctx.strokeStyle = `hsla(${r.hue}, 100%, 80%, 0.8)`;
            ctx.beginPath();
            if (r.trail.length > 1) { 
                ctx.moveTo(r.trail[0].x, r.trail[0].y); 
                for(let k=1; k<r.trail.length; k++) {
                    const alpha = k / r.trail.length;
                    ctx.lineTo(r.trail[k].x, r.trail[k].y);
                }
            } else { 
                ctx.moveTo(r.x, r.y); 
                ctx.lineTo(r.x, r.y+5); 
            }
            ctx.stroke();
            
            // 檢查是否到達目標爆炸位置
            let detonate = false;
            const distToTarget = Math.hypot(r.explodeX - r.x, r.explodeY - r.y);
            
            // 當接近目標位置時爆炸（50px範圍內）
            if (distToTarget < 50) {
                detonate = true;
            }
            // 或者速度變慢時爆炸（到達頂點）
            else if (r.vy >= -0.5) {
                detonate = true;
            }
            // 或者飛出屏幕時移除
            else if (r.y < -50 || r.x < -50 || r.x > w + 50) {
                fw.rockets.splice(i, 1);
                continue;
            }
            
            if (detonate) { 
                this.explodeFirework(r.x, r.y, r.hue); 
                fw.rockets.splice(i, 1); 
            }
        }
        
        // 渲染爆炸粒子
        for (let i = fw.explosions.length - 1; i >= 0; i--) {
            let p = fw.explosions[i];
            
            // 閃光效果（優化：移除 gradient）
            if (p.isFlash) { 
                p.life -= p.decay; 
                if (p.life <= 0) { 
                    fw.explosions.splice(i, 1); 
                    continue; 
                }
                
                const rad = p.size * p.life;
                if (rad > 0) {
                    // 使用純色圓形代替 gradient
                    ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${p.life * 0.6})`;
                    ctx.beginPath(); 
                    ctx.arc(p.x, p.y, rad, 0, Math.PI*2); 
                    ctx.fill();
                    
                    // 添加內圈高亮
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.8})`;
                    ctx.beginPath(); 
                    ctx.arc(p.x, p.y, rad * 0.3, 0, Math.PI*2); 
                    ctx.fill();
                }
                continue; 
            }
            
            // 普通粒子
            p.x += p.vx; 
            p.y += p.vy; 
            p.vx *= 0.96; 
            p.vy *= 0.96; 
            p.vy += 0.036;  // 提速 20% (0.03 * 1.2)
            p.life -= p.decay; 
            
            if (p.life <= 0) { 
                fw.explosions.splice(i, 1); 
                continue; 
            }
            
            // 優化：簡化顏色計算
            let lightness = 50;
            if (p.life > 0.7) { 
                lightness = 90; 
            } else if (p.life > 0.4) { 
                lightness = 60; 
            } else { 
                lightness = 40; 
            }
            
            const size = p.size * p.life;
            ctx.fillStyle = `hsla(${p.hue}, 100%, ${lightness}%, ${p.life})`;
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, size, 0, Math.PI*2); 
            ctx.fill();
        }
        
        ctx.globalCompositeOperation = 'source-over';
    },
    
    explodeFirework: function(x, y, hue) {
        // 播放煙花爆炸音效
        if (typeof SoundEngine !== 'undefined') SoundEngine.playFireworkBlast();
        
        // 閃光效果
        this.state.fireworks.explosions.push({ 
            x: x, 
            y: y, 
            isFlash: true, 
            hue: hue, 
            size: 100, 
            life: 1.0, 
            decay: 0.1 
        });
        
        // 優化：減少粒子數量（從 60-100 降到 50-70）
        const count = 50 + Math.random() * 20; 
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2; 
            const speed = (Math.random() * 4 + 1) * 1.2;  // 提速 20%
            this.state.fireworks.explosions.push({ 
                x: x, 
                y: y, 
                isFlash: false, 
                vx: Math.cos(angle) * speed, 
                vy: Math.sin(angle) * speed, 
                hue: hue + (Math.random() - 0.5) * 40, 
                size: Math.random() * 3 + 2, 
                life: 1.0, 
                decay: 0.01 + Math.random() * 0.015  // 加快衰減
            });
        }
    },

    // =========================================
    // 🎨 连珠绘制逻辑 (Keep Legacy)
    // =========================================
    renderDefaultLine: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0], end = points[points.length-1];
        const breath = (Math.sin(elapsed * 0.005) + 1) * 0.5; 
        
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 6 + breath * 4; ctx.strokeStyle = '#00e676'; ctx.shadowColor = '#69f0ae'; ctx.shadowBlur = 15 + breath * 10; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = '#e8f5e9'; ctx.shadowBlur = 0; ctx.stroke();
        
        ctx.fillStyle = '#b9f6ca';
        this.state.lineParticles.forEach(p => {
            p.t += p.speed; if(p.t > 1) p.t = 0;
            const px = start.x + (end.x - start.x) * p.t;
            const py = start.y + (end.y - start.y) * p.t;
            ctx.globalAlpha = (Math.sin(elapsed * p.blinkSpeed + p.life) + 1) * 0.5;
            ctx.beginPath(); ctx.arc(px, py + p.offset - (elapsed * 0.024), p.size, 0, Math.PI*2); ctx.fill();  // 提速 20% (0.02 * 1.2)
        });
    },

    renderLightning: function(points, data, elapsed) {
        const ctx = this.ctx;
        if (!data || Math.random() > 0.85) return; 
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        
        // 能量波動效果（電流強度變化）
        const energyPulse = Math.sin(elapsed * 0.008) * 0.3 + 0.7; // 0.4 到 1.0
        const flicker = 0.8 + Math.random() * 0.2;
        const combinedIntensity = energyPulse * flicker;
        
        const drawPath = (pathData, width, color, blur, alpha) => {
            ctx.beginPath(); ctx.moveTo(pathData.main[0].x, pathData.main[0].y);
            pathData.main.forEach(p => ctx.lineTo(p.x, p.y));
            pathData.branches.forEach(branch => { ctx.moveTo(branch[0].x, branch[0].y); branch.forEach(p => ctx.lineTo(p.x, p.y)); });
            ctx.lineWidth = width; ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.shadowColor = blur ? '#03a9f4' : 'transparent'; ctx.shadowBlur = blur; ctx.stroke();
        };
        
        // 1. 環境電離效果（外層光暈）
        drawPath(data, 12, '#00B0FF', 50, 0.2 * combinedIntensity);
        
        // 2. 主閃電路徑（三層）
        drawPath(data, 6, '#00B0FF', 40, 0.4 * combinedIntensity); 
        drawPath(data, 3, '#40C4FF', 20, 0.8 * combinedIntensity); 
        drawPath(data, 1.5, '#FFFFFF', 0, 1.0 * combinedIntensity);
        
        // 3. 電流粒子（沿路徑移動）
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const offset = (i / particleCount + elapsed * 0.003) % 1; // 不同起始位置
            const pathIndex = Math.floor(offset * (data.main.length - 1));
            const nextIndex = Math.min(pathIndex + 1, data.main.length - 1);
            const localT = (offset * (data.main.length - 1)) % 1;
            
            const p1 = data.main[pathIndex];
            const p2 = data.main[nextIndex];
            const px = p1.x + (p2.x - p1.x) * localT;
            const py = p1.y + (p2.y - p1.y) * localT;
            
            // 粒子大小隨位置變化
            const size = 3 + Math.sin(offset * Math.PI * 2) * 2;
            
            // 繪製粒子
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00E5FF';
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.8 + Math.sin(elapsed * 0.01 + i) * 0.2;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
            
            // 粒子拖尾
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#40C4FF';
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(px, py, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 4. 電弧爆發（在分支點）
        if (Math.random() > 0.7) { // 30% 機率出現
            data.branches.forEach((branch, idx) => {
                if (Math.random() > 0.5) return; // 每個分支 50% 機率
                
                const root = branch[0];
                const burstCount = 3;
                
                for (let i = 0; i < burstCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const length = 10 + Math.random() * 15;
                    const endX = root.x + Math.cos(angle) * length;
                    const endY = root.y + Math.sin(angle) * length;
                    
                    ctx.beginPath();
                    ctx.moveTo(root.x, root.y);
                    ctx.lineTo(endX, endY);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = '#80D8FF';
                    ctx.globalAlpha = 0.6 * flicker;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#00E5FF';
                    ctx.stroke();
                }
            });
        }
        
        // 5. 能量核心閃光（隨機在主路徑上）
        if (Math.random() > 0.6) { // 40% 機率
            const flashIndex = Math.floor(Math.random() * data.main.length);
            const flashPoint = data.main[flashIndex];
            
            const flashSize = 8 + Math.random() * 8;
            const gradient = ctx.createRadialGradient(flashPoint.x, flashPoint.y, 0, flashPoint.x, flashPoint.y, flashSize);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.3, 'rgba(0, 229, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 176, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.8;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(flashPoint.x, flashPoint.y, flashSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 重置狀態
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    },

    generateLightningPath: function(start, end, displace) {
        const createPts = (p1, p2, dis) => {
            if (dis < 2) return [p1, p2];
            let midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
            const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.sqrt(dx*dx + dy*dy);
            const normalX = -dy / len, normalY = dx / len;
            const offset = (Math.random() - 0.5) * dis;
            midX += normalX * offset; midY += normalY * offset;
            const mid = {x: midX, y: midY};
            return createPts(p1, mid, dis * 0.55).concat(createPts(mid, p2, dis * 0.55).slice(1));
        };
        const main = createPts(start, end, displace);
        const branches = [];
        const totalDist = Math.hypot(end.x - start.x, end.y - start.y);
        const numBranches = Math.floor(totalDist / 50);
        for (let i = 0; i < numBranches; i++) {
            const idx = Math.floor(Math.random() * (main.length - 1));
            const root = main[idx];
            const angle = Math.random() * Math.PI * 2;
            const len = 20 + Math.random() * 30;
            const tip = { x: root.x + Math.cos(angle) * len, y: root.y + Math.sin(angle) * len };
            branches.push(createPts(root, tip, 10));
        }
        return { main, branches };
    },

    renderGold: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0], end = points[points.length-1];
        const shift = (elapsed * 0.0018) % 1;  // 提速 20% (0.0015 * 1.2) 
        
        // 優化：減少 gradient 創建，使用緩存
        if (!this._goldGradientCache || this._goldGradientCache.shift !== shift) {
            const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
            grad.addColorStop(0, '#FFC107'); 
            grad.addColorStop(Math.max(0, shift - 0.15), '#FFD54F'); 
            grad.addColorStop(shift, '#FFFFFF'); 
            grad.addColorStop(Math.min(1, shift + 0.15), '#FFD54F'); 
            grad.addColorStop(1, '#FFC107');
            this._goldGradientCache = { grad, shift };
        }
        
        ctx.lineCap = 'round'; 
        ctx.beginPath(); 
        ctx.moveTo(start.x, start.y); 
        ctx.lineTo(end.x, end.y);
        
        // 優化：減少 shadowBlur 使用
        ctx.lineWidth = 10; 
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.4)'; 
        ctx.shadowColor = '#FF6F00'; 
        ctx.shadowBlur = 15; // 從 25 降到 15
        ctx.stroke();
        
        ctx.lineWidth = 6; 
        ctx.strokeStyle = this._goldGradientCache.grad; 
        ctx.shadowBlur = 0; // 移除第二次 shadowBlur
        ctx.stroke();
        
        // 優化：減少粒子的 shadowBlur
        ctx.shadowBlur = 0; // 關閉 shadow
        this.state.lineParticles.forEach(p => {
            p.t += p.speed; 
            if(p.t > 1) p.t = 0;
            
            const twinkle = Math.abs(Math.sin(elapsed * p.blinkSpeed * 2));
            if (twinkle < 0.2) return;
            
            const px = start.x + (end.x - start.x) * p.t + p.offset;
            const py = start.y + (end.y - start.y) * p.t + p.offset;
            const size = p.size * twinkle * 1.5;
            
            // 使用純色代替 shadow，性能更好
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            ctx.beginPath(); 
            ctx.arc(px, py, size, 0, Math.PI*2); 
            ctx.fill();
        });
        
        // 重置 shadow
        ctx.shadowBlur = 0;
    },

    renderFuture: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0], end = points[points.length-1];
        
        // 優化：減少 shadowBlur
        ctx.shadowBlur = 10; // 從 20 降到 10
        ctx.shadowColor = '#ea80fc';
        ctx.beginPath(); 
        ctx.moveTo(start.x, start.y); 
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 4; 
        ctx.strokeStyle = 'rgba(224, 64, 251, 0.3)'; 
        ctx.stroke();
        
        // 優化：減少隨機計算，使用預計算的偏移
        const segments = 12;
        const dx = (end.x - start.x) / segments;
        const dy = (end.y - start.y) / segments;
        
        // 使用固定的隨機種子，避免每幀重新計算
        const frameOffset = Math.floor(elapsed / 100) % 4; // 每 100ms 變化一次
        
        ctx.shadowBlur = 0; // 關閉 shadow 以提升性能
        ctx.beginPath();
        for (let i = 0; i < segments; i++) {
            const sX = start.x + dx * i;
            const sY = start.y + dy * i;
            const eX = start.x + dx * (i+1);
            const eY = start.y + dy * (i+1);
            
            // 優化：使用簡單的偏移模式代替隨機
            let offsetX = 0, offsetY = 0;
            if ((i + frameOffset) % 3 === 0) { 
                offsetX = ((i % 2) - 0.5) * 10; 
                offsetY = ((i % 3) - 1) * 10; 
            }
            
            ctx.moveTo(sX + offsetX, sY + offsetY); 
            ctx.lineTo(eX + offsetX, eY + offsetY);
        }
        
        // 優化：使用固定顏色，避免每幀隨機
        ctx.lineWidth = 2; 
        ctx.strokeStyle = Math.floor(elapsed / 200) % 2 === 0 ? '#00e5ff' : '#d500f9';
        ctx.stroke();
        
        // 優化：簡化 runner 動畫，移除 save/restore
        const runnerT = (elapsed * 0.0048) % 1;  // 提速 20% (0.004 * 1.2)
        const rx = start.x + (end.x - start.x) * runnerT;
        const ry = start.y + (end.y - start.y) * runnerT;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        // 使用簡單的矩形代替變換
        ctx.fillStyle = '#fff'; 
        ctx.shadowBlur = 8; // 從 15 降到 8
        ctx.shadowColor = '#fff';
        
        // 手動計算旋轉後的矩形頂點，避免 save/restore
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const w = 20, h = 6;
        
        ctx.beginPath();
        ctx.moveTo(rx + (-w/2) * cos - (-h/2) * sin, ry + (-w/2) * sin + (-h/2) * cos);
        ctx.lineTo(rx + (w/2) * cos - (-h/2) * sin, ry + (w/2) * sin + (-h/2) * cos);
        ctx.lineTo(rx + (w/2) * cos - (h/2) * sin, ry + (w/2) * sin + (h/2) * cos);
        ctx.lineTo(rx + (-w/2) * cos - (h/2) * sin, ry + (-w/2) * sin + (h/2) * cos);
        ctx.closePath();
        ctx.fill();
        
        // 重置 shadow
        ctx.shadowBlur = 0;
    }
};