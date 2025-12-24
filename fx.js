// ================= 视觉特效引擎 (Visual Effects) =================
// [Alpha 0.7.8.2]
// - 闪电特效全面升级：电流粒子、电弧爆发、能量波动、环境电离
// - 新增五层视觉效果：光晕、主路径、移动粒子、分支爆发、核心闪光
// - 保持其他特效稳定性

const VisualFX = {
    canvas: null,
    ctx: null,
    animationId: null,
    
    // FPS 计数器
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
        
        // [New] DJ 节奏游戏数据 - 三阶段系统
        dj: {
            phase: 'idle', // 'challenge', 'fail', 'victory'
            
            // 挑战阶段
            notes: [], // 飞向鼓的音符 {x, y, vx, vy, targetTime, hit}
            kickScale: 1.0,
            bgFlash: 0,
            spotlights: [],
            
            // 失败阶段
            darknessAlpha: 0, // 黑暗覆盖透明度
            
            // 胜利阶段
            autoKickTimer: 0,
            victoryParticles: [] // 胜利粒子效果
        }
    },

    init: function() {
        // 【修复】防止重复初始化导致事件监听器多次绑定
        if (this._initialized) {
            console.log('[FX] 已初始化，跳过重复绑定');
            // 只更新 canvas 尺寸
            if (this.canvas) this.resize();
            return;
        }
        
        this.canvas = document.getElementById('fxCanvas');
        if (this.canvas) {
            // 启用低延迟模式和透明度
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
                console.log('[Canvas] mousedown 事件触发！celebrationType:', this.state.celebrationType);
                if (this.state.celebrationType === 'dj') {
                    console.log('[Canvas] 是 DJ 模式，调用 handleDrumHit');
                    this.handleDrumHit(e);
                } else if (this.state.celebrationType === 'golden') {
                    console.log('[Canvas] 是流金模式，检测金币点击');
                    const rect = this.canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    this.checkCoinClick(mouseX, mouseY);
                } else {
                    console.log('[Canvas] 不是交互模式，忽略点击');
                }
            }, true); // 使用捕获阶段，优先处理
            
            // 【调试】添加全局点击监听
            document.addEventListener('mousedown', (e) => {
                console.log('[Document] 全局点击事件，目标:', e.target.tagName, e.target.id);
            }, true);
            
            // Canvas 预热优化：提前触发 GPU 编译
            this.warmupCanvas();
            
            // 标记已初始化
            this._initialized = true;
            console.log('[FX] 初始化完成，事件监听器已绑定');
        }
    },

    // Canvas 预热函数：提前触发所有渲染操作的 GPU 编译
    // 解决首次播放特效时的卡顿问题
    warmupCanvas: function() {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // 保存当前状态
        ctx.save();
        
        // 1. 预热混合模式
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalCompositeOperation = 'source-over';
        
        // 2. 预热线性渐变
        const linearGrad = ctx.createLinearGradient(0, 0, w, h);
        linearGrad.addColorStop(0, 'rgba(255, 0, 0, 1)');
        linearGrad.addColorStop(0.5, 'rgba(0, 255, 0, 0.5)');
        linearGrad.addColorStop(1, 'rgba(0, 0, 255, 0)');
        ctx.fillStyle = linearGrad;
        ctx.fillRect(0, 0, 1, 1);
        
        // 3. 预热径向渐变
        const radialGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 100);
        radialGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGrad;
        ctx.fillRect(0, 0, 1, 1);
        
        // 4. 预热各种绘制操作
        // 填充圆形
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(10, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 描边圆形
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(20, 20, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // 阴影效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 255, 0.5)';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.fillRect(30, 30, 5, 5);
        ctx.shadowBlur = 0;
        
        // 文字渲染
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('W', 40, 40);
        
        // 5. 预热 HSL 颜色（烟花特效使用）
        for (let i = 0; i < 360; i += 60) {
            ctx.fillStyle = `hsla(${i}, 100%, 60%, 0.5)`;
            ctx.fillRect(0, 0, 1, 1);
        }
        
        // 6. 预热线条绘制（连珠特效使用）
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(10, 10);
        ctx.stroke();
        
        // 7. 预热 lighter 混合模式（烟花和聚光灯使用）
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, 10, 10);
        
        // 清除预热痕迹
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
            // 重置所有 Canvas 状态
            this.ctx.shadowBlur = 0;
            this.ctx.shadowColor = 'transparent';
            this.ctx.globalAlpha = 1.0;
        }
        
        // 【修复】恢复 Canvas 点击穿透
        if (this.canvas) {
            this.canvas.style.pointerEvents = 'none';
        }
        
        // 【修复】恢复技能按钮和悔棋按钮显示
        const skillBtn = document.getElementById('skillBtn');
        if (skillBtn) skillBtn.style.display = '';
        const undoBtn = document.querySelector('[onclick="undoMove()"]');
        if (undoBtn) undoBtn.style.display = '';
        
        // 清理缓存
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
                spotlights: [], // [CRITICAL FIX] 强制清空聚光灯，防止内存泄漏 
                darknessAlpha: 0,
                autoKickTimer: 0,
                victoryParticles: []
            }
        };
        
        if (typeof SoundEngine !== 'undefined' && SoundEngine.stopDJGame) SoundEngine.stopDJGame();
        
        // [CRITICAL FIX] 强制清理DJ特效，防止崩溃和内存泄漏
        this.forceStopDJ();
        
        // [NEW] 强制清理流金特效
        this.forceStopGolden();
    },
    
    // [NEW] 强制停止DJ特效的专用函数
    forceStopDJ: function() {
        // 1. 强制重置DJ状态
        if (this.state && this.state.dj) {
            this.state.dj.phase = 'idle';
            this.state.dj.spotlights = [];
            this.state.dj.victoryParticles = [];
            this.state.dj.notes = [];
        }
        
        // 2. 强制重置庆祝类型
        if (this.state) {
            this.state.celebrationType = null;
        }
        
        // 3. 清理可能的定时器
        if (typeof SoundEngine !== 'undefined' && SoundEngine.djGame) {
            const dj = SoundEngine.djGame;
            if (dj.schedulerID) {
                clearTimeout(dj.schedulerID);
                dj.schedulerID = null;
            }
            if (dj.autoKickInterval) {
                clearInterval(dj.autoKickInterval);
                dj.autoKickInterval = null;
            }
        }
        
        console.log('[FX] DJ特效已强制清理');
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
        // 由 FrameRateController 统一管理，已在页面加载时启动
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
                lastLaunchTime: 0,  // 记录上次发射时间
                launchInterval: 1000 / 3  // 每秒3枚 = 333.33ms间隔
            };
        } 
        // [New] DJ 三阶段初始化
        else if (type === 'dj') {
            console.log('[DJ] 启动 DJ 模式');
            
            // 【修复】隐藏技能按钮和悔棋按钮
            const skillBtn = document.getElementById('skillBtn');
            if (skillBtn) {
                skillBtn.style.display = 'none';
                console.log('[DJ] 隐藏技能按钮');
            }
            const undoBtn = document.querySelector('[onclick="undoMove()"]');
            if (undoBtn) {
                undoBtn.style.display = 'none';
                console.log('[DJ] 隐藏悔棋按钮');
            }
            
            // 【修复】Canvas 接收点击事件
            if (this.canvas) {
                this.canvas.style.pointerEvents = 'auto';
                console.log('[DJ] Canvas pointerEvents 设为 auto');
                console.log('[DJ] Canvas 当前样式:', window.getComputedStyle(this.canvas).pointerEvents);
            }
            
            this.state.dj = {
                phase: 'challenge',
                notes: [],
                kickScale: 1.0,
                bgFlash: 0,
                spotlights: [
                    { x: 0.2, fixed: true, color: '#B3E5FC' }, // 浅蓝
                    { x: 0.4, fixed: true, color: '#E1BEE7' }, // 浅紫
                    { x: 0.6, fixed: true, color: '#C8E6C9' }, // 浅绿
                    { x: 0.8, fixed: true, color: '#FFF9C4' }  // 浅黄
                ],
                darknessAlpha: 0,
                autoKickTimer: 0,
                victoryParticles: [],
                missText: null,      // MISS 文字特效
                perfectText: null    // PERFECT 文字特效
            };
            
            console.log('[DJ] DJ 状态初始化完成');
            
            // 设置回调函数供 audio.js 调用
            window.djMissCallback = () => this.onDJMiss();
            window.djFailCallback = () => this.onDJFail();
            window.djVictoryCallback = () => this.onDJVictory();
            window.djAutoKickCallback = () => this.onDJAutoKick();
            
            // 启动音频引擎的 DJ 挑战
            if (typeof SoundEngine !== 'undefined') {
                console.log('[DJ] 启动音频引擎');
                SoundEngine.startDJChallenge();
            }
        }
        // [New] 流金特效初始化
        else if (type === 'golden') {
            console.log('[Golden] 启动流金模式');
            
            // Canvas 接收点击事件（金币收集）
            if (this.canvas) {
                this.canvas.style.pointerEvents = 'auto';
            }
            
            this.state.golden = {
                // 探照灯系统 - 画面外光源版
                spotlights: [
                    { 
                        x: -0.3, y: -0.2, // 画面外左上角
                        angle: 0, speed: 0.008, // 较慢的扫射速度
                        color: '#FFD700',
                        intensity: 0.9 // 高强度
                    },
                    { 
                        x: 1.3, y: -0.2, // 画面外右上角
                        angle: Math.PI, speed: -0.006, // 反向扫射
                        color: '#FFA500',
                        intensity: 0.8
                    }
                ],
                
                // 彩带与碎纸系统（恢复）
                streamers: [],
                confetti: [],
                lastStreamerTime: 0,
                streamerInterval: 2400, // 每2400ms喷射一次（对齐4/4拍 @ 100BPM）
                
                // 金币雨系统（优化）
                coins: [],
                lastCoinTime: 0,
                coinInterval: 1500, // 每1.5秒生成一枚金币（更慢）
                collectedCoins: 0,
                totalCoins: 0, // 已生成的金币总数
                maxCoins: 12, // 最大金币数量
                
                // 粒子效果
                particles: []
            };
            
            console.log('[Golden] 流金状态初始化完成');
        }
        
        this.startLoop();
    },

    renderFrame: function(now) {
        // [CRITICAL FIX] 安全检查，防止渲染冲突导致崩溃
        if (!this.ctx || !this.canvas) {
            console.warn('[FX] Canvas未初始化，跳过渲染');
            return;
        }
        
        // 如果没有活动特效，跳过渲染以节省 GPU
        if (!this.state.active && !this.state.lineType && !this.state.celebrationType) {
            this.updateAndRenderFPS(now);
            return;
        }
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const elapsed = now - this.state.startTime;

        // === 应用屏幕震动效果 ===
        const shakeOffset = this.updateScreenShake(now);
        if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
            ctx.save();
            ctx.translate(shakeOffset.x, shakeOffset.y);
        }

        // 清屏
        ctx.clearRect(-shakeOffset.x, -shakeOffset.y, w + Math.abs(shakeOffset.x) * 2, h + Math.abs(shakeOffset.y) * 2);

        // 1. 绘制连珠 (Win Line)
        if (this.state.lineType && this.state.linePoints.length >= 2) {
            const type = this.state.lineType;
            const pts = this.state.linePoints;
            
            // [CRITICAL FIX] 状态隔离：防止连珠特效污染 DJ 特效
            ctx.save();
            try {
                // DJ 模式下为了突出节奏，稍微压暗连珠
                if (this.state.celebrationType === 'dj') ctx.globalAlpha = 0.6;
                
                if (type === 'default') this.renderDefaultLine(pts, elapsed);
                else if (type === 'lightning') this.renderLightning(pts, this.state.lightningData, elapsed);
                else if (type === 'gold') this.renderGold(pts, elapsed);
                else if (type === 'future') this.renderFuture(pts, elapsed);
            } finally {
                // 确保无论是否发生异常都恢复状态
                ctx.restore();
            }
        }

        // 2. 绘制胜利特效
        if (this.state.celebrationType === 'fireworks') {
            // [CRITICAL FIX] 状态隔离：防止烟花特效污染其他渲染
            ctx.save();
            try {
                this.renderFireworks(ctx, w, h, now);
            } finally {
                ctx.restore();
            }
        } else if (this.state.celebrationType === 'dj') {
            // [CRITICAL FIX] 状态隔离 + DJ渲染安全检查
            ctx.save();
            try {
                if (this.state.dj && this.state.dj.phase) {
                    this.renderDJGame(ctx, w, h, now);
                }
            } catch (error) {
                console.error('[FX] DJ渲染错误:', error);
                // 发生错误时强制清理DJ特效
                this.forceStopDJ();
            } finally {
                ctx.restore();
            }
        } else if (this.state.celebrationType === 'golden') {
            // [New] 流金特效渲染
            ctx.save();
            try {
                if (this.state.golden) {
                    this.renderGoldenRain(ctx, w, h, now);
                }
            } catch (error) {
                console.error('[FX] 流金渲染错误:', error);
                // 发生错误时强制清理流金特效
                this.forceStopGolden();
            } finally {
                ctx.restore();
            }
        }
        
        // === 恢复屏幕震动变换 ===
        if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
            ctx.restore();
        }
        
        // 3. 绘制 FPS 计数器（不受震动影响）
        this.updateAndRenderFPS(now);
    },

    // =========================================
    // 🥁 DJ 三阶段系统
    // =========================================
    
    // FPS 计算和渲染
    updateAndRenderFPS: function(now) {
        // 更新 FPS 计数
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
    
    // 玩家击鼓（仅在挑战阶段有效）
    handleDrumHit: function(e) {
        const dj = this.state.dj;
        console.log('[FX] handleDrumHit 被调用，phase:', dj.phase);
        
        if (dj.phase !== 'challenge') return;
        
        // 【修复】阻止事件冒泡和默认行为
        if (e) {
            e.stopPropagation();
            e.stopImmediatePropagation(); // 阻止同一元素上的其他监听器
            e.preventDefault();
        }
        
        // 【防抖】防止短时间内多次调用
        const now = performance.now();
        if (this._lastHitTime && now - this._lastHitTime < 100) {
            console.log('[FX] 防抖：忽略重复点击');
            return;
        }
        this._lastHitTime = now;
        
        // 视觉反馈：鼓面收缩
        dj.kickScale = 0.8;
        
        // 调用音频引擎判定
        if (typeof SoundEngine !== 'undefined') {
            console.log('[FX] 调用 SoundEngine.djPlayerHit()');
            const success = SoundEngine.djPlayerHit();
            console.log('[FX] 判定结果:', success ? '成功' : '失败');
            if (success) {
                dj.bgFlash = 1.0; // 屏幕闪白
                dj.kickScale = 1.3; // 鼓面膨胀
                this.createHitParticles();
            }
        }
    },
    
    // 击中粒子效果
    createHitParticles: function() {
        const dj = this.state.dj;
        const w = this.canvas.width;
        const drumX = w / 2;
        const drumY = this.canvas.height - 80;
        
        // === 屏幕震动效果 ===
        this.triggerScreenShake(8, 200); // 强度8，持续200ms
        
        // 创建爆发粒子
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
        
        // === 波纹扩散效果 ===
        dj.ripples = dj.ripples || [];
        dj.ripples.push({
            x: drumX,
            y: drumY,
            radius: 0,
            maxRadius: 150,
            alpha: 1.0,
            life: 1.0
        });
    },
    
    // 屏幕震动系统
    triggerScreenShake: function(intensity, duration) {
        this.screenShake = {
            intensity: intensity,
            duration: duration,
            startTime: performance.now(),
            offsetX: 0,
            offsetY: 0
        };
    },
    
    // 更新屏幕震动
    updateScreenShake: function(now) {
        if (!this.screenShake) return { x: 0, y: 0 };
        
        const shake = this.screenShake;
        const elapsed = now - shake.startTime;
        
        if (elapsed >= shake.duration) {
            this.screenShake = null;
            return { x: 0, y: 0 };
        }
        
        // 震动强度随时间衰减
        const progress = elapsed / shake.duration;
        const currentIntensity = shake.intensity * (1 - progress);
        
        // 生成随机震动偏移
        shake.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
        shake.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
        
        return { x: shake.offsetX, y: shake.offsetY };
    },
    
    // 回调：错过节拍（显示 MISS）
    onDJMiss: function() {
        const dj = this.state.dj;
        dj.bgFlash = 0.3;
        
        // 创建 MISS 文字特效（永久停留）
        const w = this.canvas.width;
        const h = this.canvas.height;
        dj.missText = {
            x: w / 2,
            y: h / 4, // 【修复】移到画面上方 1/4，避免被弹窗遮住
            alpha: 0,
            scale: 0.5,
            targetScale: 1.5,
            permanent: true // 永久显示
        };
    },
    
    // 回调：挑战失败
    onDJFail: function() {
        const dj = this.state.dj;
        dj.phase = 'fail';
        dj.darknessAlpha = 0;
        // 开始黑暗吞噬动画
    },
    
    // 回调：挑战成功
    onDJVictory: function() {
        const dj = this.state.dj;
        dj.phase = 'victory';
        
        // 创建 PERFECT 文字特效
        const w = this.canvas.width;
        const h = this.canvas.height;
        dj.perfectText = {
            x: w / 2,
            y: h / 4, // 与 MISS 等高，避免被弹窗遮住
            alpha: 0,
            scale: 0.5,
            life: 1.0
        };
        
        // === 聚光灯渐变过渡系统 ===
        // 记录过渡开始时间
        dj.transitionStartTime = performance.now();
        dj.transitionDuration = 2000; // 2秒过渡时间
        
        // 初始化过渡状态：从固定位置开始
        dj.spotlights = [
            { 
                x: 0.2, 
                fixed: true, 
                color: '#B3E5FC',
                // 过渡目标状态
                targetAngle: Math.random() * Math.PI,
                targetSpeed: (Math.random()-0.5)*0.02,
                targetColor: `hsl(${Math.random()*360}, 80%, 60%)`
            },
            { 
                x: 0.4, 
                fixed: true, 
                color: '#E1BEE7',
                targetAngle: Math.random() * Math.PI,
                targetSpeed: (Math.random()-0.5)*0.02,
                targetColor: `hsl(${Math.random()*360}, 80%, 60%)`
            },
            { 
                x: 0.6, 
                fixed: true, 
                color: '#C8E6C9',
                targetAngle: Math.random() * Math.PI,
                targetSpeed: (Math.random()-0.5)*0.02,
                targetColor: `hsl(${Math.random()*360}, 80%, 60%)`
            },
            { 
                x: 0.8, 
                fixed: true, 
                color: '#FFF9C4',
                targetAngle: Math.random() * Math.PI,
                targetSpeed: (Math.random()-0.5)*0.02,
                targetColor: `hsl(${Math.random()*360}, 80%, 60%)`
            }
        ];
        
        // 创建胜利粒子喷泉
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
    
    // 回调：自动击鼓
    onDJAutoKick: function() {
        const dj = this.state.dj;
        dj.kickScale = 0.7;
        dj.bgFlash = 0.8;
        this.createHitParticles();
    },

    renderDJGame: function(ctx, w, h, now) {
        const dj = this.state.dj;
        
        // === 阶段一：挑战模式 ===
        if (dj.phase === 'challenge') {
            this.renderDJChallenge(ctx, w, h, now);
        }
        // === 阶段二：失败模式 ===
        else if (dj.phase === 'fail') {
            this.renderDJFailure(ctx, w, h, now);
        }
        // === 阶段三：胜利模式 ===
        else if (dj.phase === 'victory') {
            this.renderDJVictory(ctx, w, h, now);
        }
    },
    
    // 渲染挑战阶段
    renderDJChallenge: function(ctx, w, h, now) {
        const dj = this.state.dj;
        
        // 1. 压暗背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);
        
        // 2. 固定聚光灯（挑战阶段）
        ctx.globalCompositeOperation = 'lighter';
        const drumX = w / 2;
        const drumY = h - 80;
        
        dj.spotlights.forEach(s => {
            const sx = w * s.x;  // 固定 x 位置
            const sy = -100;
            const ex = drumX;    // 统一照射鼓心
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
        
        // 3. 闪白效果
        if (dj.bgFlash > 0.01) {
            ctx.fillStyle = `rgba(255, 255, 255, ${dj.bgFlash * 0.3})`;
            ctx.fillRect(0, 0, w, h);
            dj.bgFlash *= 0.85;
        }
        ctx.globalCompositeOperation = 'source-over';
        
        // 4. 绘制节拍提示圆环
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
        
        // 5. 绘制鼓
        this.drawDrum(ctx, w, h, dj);
        
        // 6. 绘制粒子
        this.updateAndDrawParticles(ctx, dj);
        
        // 7. 绘制 MISS 文字特效
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
    
    // 渲染失败阶段
    renderDJFailure: function(ctx, w, h, now) {
        const dj = this.state.dj;
        
        // 黑暗逐渐吞噬
        if (dj.darknessAlpha < 1.0) {
            dj.darknessAlpha += 0.02;
        }
        
        ctx.fillStyle = `rgba(0, 0, 0, ${dj.darknessAlpha})`;
        ctx.fillRect(0, 0, w, h);
        
        // 【修复】MISS 文字永久停留在黑屏上
        if (dj.missText) {
            const miss = dj.missText;
            
            // 动画：淡入 + 放大
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
    
    // 渲染胜利阶段
    renderDJVictory: function(ctx, w, h, now) {
        const dj = this.state.dj;
        
        // 1. 华丽背景
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 20, 147, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // 2. 渐变聚光灯系统
        ctx.globalCompositeOperation = 'lighter';
        
        // 计算过渡进度
        let transitionProgress = 1.0; // 默认完全过渡
        if (dj.transitionStartTime && dj.transitionDuration) {
            const elapsed = now - dj.transitionStartTime;
            transitionProgress = Math.min(elapsed / dj.transitionDuration, 1.0);
            // 使用 easeInOutCubic 缓动函数，让过渡更自然
            transitionProgress = transitionProgress < 0.5 
                ? 4 * transitionProgress * transitionProgress * transitionProgress
                : 1 - Math.pow(-2 * transitionProgress + 2, 3) / 2;
        }
        
        const drumX = w / 2;
        const drumY = h - 80;
        
        dj.spotlights.forEach((s, index) => {
            if (s.fixed && transitionProgress < 1.0) {
                // === 过渡阶段：从固定位置渐变到旋转模式 ===
                
                // 固定模式的起始位置
                const fixedX = w * s.x;
                const fixedY = -100;
                const fixedEndX = drumX;
                const fixedEndY = drumY;
                
                // 旋转模式的目标位置（改为小范围摆动）
                if (!s.angle) s.angle = s.targetAngle;
                if (!s.speed) s.speed = s.targetSpeed;
                if (!s.baseX) s.baseX = w * (0.2 + index * 0.2); // 固定基础位置
                
                s.angle += s.speed * transitionProgress * 0.1; // 大幅减小角度变化
                
                // 小范围摆动目标位置
                const microSwing = 5;
                const rotateStartX = s.baseX + Math.cos(s.angle) * microSwing;
                const rotateStartY = -100;
                const rotateEndX = s.baseX + Math.sin(s.angle) * microSwing;
                const rotateEndY = h;
                
                // 插值计算当前位置
                const currentStartX = fixedX + (rotateStartX - fixedX) * transitionProgress;
                const currentStartY = fixedY + (rotateStartY - fixedY) * transitionProgress;
                const currentEndX = fixedEndX + (rotateEndX - fixedEndX) * transitionProgress;
                const currentEndY = fixedEndY + (rotateEndY - fixedEndY) * transitionProgress;
                
                // 颜色渐变
                const currentColor = this.interpolateColor(s.color, s.targetColor, transitionProgress);
                
                // 绘制渐变聚光灯
                const grd = ctx.createLinearGradient(currentStartX, currentStartY, currentEndX, currentEndY);
                grd.addColorStop(0, currentColor);
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.moveTo(currentStartX, currentStartY);
                ctx.lineTo(currentEndX - 50, currentEndY);
                ctx.lineTo(currentEndX + 50, currentEndY);
                ctx.fill();
            }
            else if (s.fixed && transitionProgress >= 1.0) {
                // === 过渡完成，转换为旋转模式 ===
                s.fixed = false;
                s.color = s.targetColor;
                
                // [CRITICAL FIX] 保存第2阶段结束时的聚光灯位置（固定不变）
                if (!s.fixedStartX) {
                    // 计算第2阶段结束时的聚光灯起始位置（这个位置在第3阶段保持不变）
                    const fixedX = w * s.x;
                    const fixedY = -100;
                    const fixedEndX = drumX;
                    const fixedEndY = drumY;
                    
                    const microSwing = 5;
                    const rotateStartX = s.baseX + Math.cos(s.angle) * microSwing;
                    const rotateStartY = -100;
                    const rotateEndX = s.baseX + Math.sin(s.angle) * microSwing;
                    const rotateEndY = h;
                    
                    // 聚光灯的固定起始位置（不再改变）
                    s.fixedStartX = fixedX + (rotateStartX - fixedX) * 1.0;
                    s.fixedStartY = fixedY + (rotateStartY - fixedY) * 1.0;
                    
                    // [FIX] 重置摇摆参数：从正下方开始，每个聚光灯独立随机
                    s.swingPhase = 0; // 从正下方开始
                    s.swingSpeed = 0.03 + Math.random() * 0.04; // 随机速度 (0.03-0.07)
                    s.swingRange = 0.8 + Math.random() * 0.6; // 随机摇摆幅度 (0.8-1.4弧度)
                }
            } 
            else if (!s.fixed) {
                // === 完全旋转模式（固定位置，疯狂角度摇摆）===
                
                // 确保有固定起始位置和随机参数
                if (!s.fixedStartX) {
                    s.fixedStartX = w/2;
                    s.fixedStartY = -100;
                    s.swingPhase = 0;
                    s.swingSpeed = 0.03 + Math.random() * 0.04;
                    s.swingRange = 0.8 + Math.random() * 0.6;
                }
                
                s.swingPhase += s.swingSpeed;
                
                // 聚光灯位置固定，但照射角度疯狂左右摇摆
                const sx = s.fixedStartX; // 起始位置固定
                const sy = s.fixedStartY; // 起始位置固定
                
                // 计算疯狂摇摆的照射角度
                const swingAngle = Math.sin(s.swingPhase) * s.swingRange; // 大幅度摇摆
                const beamLength = h + 100; // 光束长度
                const ex = sx + Math.sin(swingAngle) * beamLength; // 根据角度计算终点X
                const ey = sy + Math.cos(swingAngle) * beamLength; // 根据角度计算终点Y
                
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
        
        // 3. 闪白效果
        if (dj.bgFlash > 0.01) {
            ctx.fillStyle = `rgba(255, 255, 255, ${dj.bgFlash * 0.4})`;
            ctx.fillRect(0, 0, w, h);
            dj.bgFlash *= 0.85;
        }
        ctx.globalCompositeOperation = 'source-over';
        
        // 4. 绘制自动击鼓的鼓
        this.drawDrum(ctx, w, h, dj);
        
        // 5. 绘制胜利粒子
        this.updateAndDrawParticles(ctx, dj);
        
        // 6. 绘制 PERFECT 文字特效
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
    
    // 颜色插值函数
    interpolateColor: function(color1, color2, t) {
        // 简化版颜色插值，支持 hex 和 hsl
        if (color1.startsWith('#') && color2.startsWith('hsl')) {
            // 从 hex 到 hsl 的过渡，直接返回 hsl（简化处理）
            return color2;
        }
        if (color1.startsWith('hsl') && color2.startsWith('hsl')) {
            // hsl 到 hsl 的插值
            const hsl1 = this.parseHSL(color1);
            const hsl2 = this.parseHSL(color2);
            const h = hsl1.h + (hsl2.h - hsl1.h) * t;
            const s = hsl1.s + (hsl2.s - hsl1.s) * t;
            const l = hsl1.l + (hsl2.l - hsl1.l) * t;
            return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
        }
        // 默认返回目标颜色
        return t > 0.5 ? color2 : color1;
    },
    
    // 解析 HSL 颜色
    parseHSL: function(hslString) {
        const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
            return {
                h: parseInt(match[1]),
                s: parseInt(match[2]),
                l: parseInt(match[3])
            };
        }
        return { h: 0, s: 50, l: 50 }; // 默认值
    },
    
    // 绘制鼓
    drawDrum: function(ctx, w, h, dj) {
        const drumX = w / 2;
        const drumY = h - 80;
        
        // === 【Alpha 0.7.8.3】判定提示灯 - 根据开关决定是否显示 ===
        // 仅当 djDrumIndicatorEnabled 为 true 时才显示提示灯
        if (typeof djDrumIndicatorEnabled !== 'undefined' && djDrumIndicatorEnabled) {
            let canHit = false;
            let indicatorColor = '#FF1744'; // 默认红色（不可击中）
            
            if (typeof SoundEngine !== 'undefined' && SoundEngine.djGame.active) {
                const currentTime = SoundEngine.ctx.currentTime;
                const hitWindow = 0.4; // 【翻倍】400ms 判定窗口
                const beats = SoundEngine.djGame.challengeBeats;
                
                // 检查是否有节拍在判定窗口内
                for (let beat of beats) {
                    if (!beat.hit && !beat.missed) {
                        const timeDiff = Math.abs(currentTime - beat.time);
                        if (timeDiff <= hitWindow) {
                            canHit = true;
                            indicatorColor = '#00E676'; // 绿色（可击中）
                            break;
                        }
                    }
                }
            }
            
            // 绘制提示灯（鼓上方）
            const indicatorY = drumY - 60;
            const indicatorSize = 15;
            
            // 外圈光晕
            ctx.shadowBlur = 20;
            ctx.shadowColor = indicatorColor;
            ctx.fillStyle = indicatorColor;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(drumX, indicatorY, indicatorSize + 10, 0, Math.PI * 2);
            ctx.fill();
            
            // 内圈实心
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
        }
        
        // 鼓的缩放动画
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
    
    // 更新并绘制粒子
    updateAndDrawParticles: function(ctx, dj) {
        // 1. 更新和绘制击中粒子
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
        
        // 2. 更新和绘制波纹扩散效果
        if (dj.ripples) {
            for (let i = dj.ripples.length - 1; i >= 0; i--) {
                const ripple = dj.ripples[i];
                
                // 更新波纹
                ripple.radius += 4; // 扩散速度
                ripple.life -= 0.02;
                ripple.alpha = ripple.life * 0.8;
                
                if (ripple.life <= 0 || ripple.radius >= ripple.maxRadius) {
                    dj.ripples.splice(i, 1);
                    continue;
                }
                
                // 绘制波纹（三层同心圆）
                ctx.globalAlpha = ripple.alpha;
                
                // 外层波纹（最淡）
                ctx.strokeStyle = `rgba(0, 230, 118, ${ripple.alpha * 0.3})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 中层波纹
                ctx.strokeStyle = `rgba(0, 230, 118, ${ripple.alpha * 0.6})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                
                // 内层波纹（最亮）
                ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius * 0.4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.globalAlpha = 1.0;
    },

    // =========================================
    // 💰 流金特效系统 (Golden Rain Effect)
    // =========================================
    
    // 强制停止流金特效
    forceStopGolden: function() {
        if (this.state && this.state.golden) {
            this.state.golden = null;
        }
        if (this.state) {
            this.state.celebrationType = null;
        }
        console.log('[FX] 流金特效已强制清理');
    },
    
    // 流金特效主渲染函数
    renderGoldenRain: function(ctx, w, h, now) {
        const golden = this.state.golden;
        if (!golden) return;
        
        try {
            // 1. 绘制华丽背景渐变
            this.renderGoldenBackground(ctx, w, h, now);
            
            // 2. 绘制暖色探照灯
            this.renderGoldenSpotlights(ctx, w, h, now, golden);
            
            // 3. 更新和生成彩带碎纸（恢复）
            this.updateStreamersAndConfetti(ctx, w, h, now, golden);
            
            // 4. 绘制彩带和碎纸（恢复）
            this.renderStreamersAndConfetti(ctx, golden);
            
            // 5. 更新和生成金币（优化版）
            this.updateCoins(ctx, w, h, now, golden);
            
            // 6. 绘制金币
            this.renderCoins(ctx, golden, now);
            
            // 7. 绘制收集粒子效果
            this.renderGoldenParticles(ctx, golden);
            
        } catch (error) {
            console.error('[Golden] 渲染子系统错误:', error);
            // 如果出错，至少显示一个简单的金色背景
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(0, 0, w, h);
        }
    },
    
    // 绘制华丽背景
    renderGoldenBackground: function(ctx, w, h, now) {
        // 深色背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);
        
        // 金色渐变覆盖
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.05)');
        gradient.addColorStop(1, 'rgba(184, 134, 11, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    },
    
    // 绘制暖色探照灯 - 真正固定版
    renderGoldenSpotlights: function(ctx, w, h, now, golden) {
        ctx.globalCompositeOperation = 'lighter';
        
        golden.spotlights.forEach((spotlight, index) => {
            // 更新探照灯角度（左右扫射）
            spotlight.angle += spotlight.speed;
            
            // 【真正固定】光源位置和屏幕入射点都固定！
            const isLeft = index === 0;
            const lightSourceX = isLeft ? -w * 0.2 : w * 1.2; // 固定光源X
            const lightSourceY = -h * 0.1; // 固定光源Y
            
            // 【真正固定】屏幕入射点也固定！不再计算！
            const startX = isLeft ? 0 : w; // 固定入射X
            const startY = 0; // 固定入射Y - 从最顶部射入！
            
            // 【只改变照射角度】：光源固定，入射点固定，只有照射终点变化
            const sweepRange = 0.4; // 扫射范围
            const baseDirection = isLeft ? 0.6 : -0.6; // 基础照射角度
            const swayAngle = Math.sin(spotlight.angle) * sweepRange + baseDirection;
            
            // 计算聚光灯照射区域 - 只有终点变化
            const beamDistance = Math.max(w, h) * 1.8;
            const beamWidth = w * 0.4; // 聚光灯宽度
            
            // 光束中心点 - 基于固定入射点和变化角度
            const centerX = startX + Math.sin(swayAngle) * beamDistance;
            const centerY = startY + Math.cos(swayAngle) * beamDistance;
            
            // 光束左右边界点
            const leftX = centerX - Math.cos(swayAngle) * beamWidth;
            const leftY = centerY + Math.sin(swayAngle) * beamWidth;
            const rightX = centerX + Math.cos(swayAngle) * beamWidth;
            const rightY = centerY - Math.sin(swayAngle) * beamWidth;
            
            // 绘制完整的聚光灯锥形
            const grd = ctx.createLinearGradient(startX, startY, centerX, centerY);
            grd.addColorStop(0, `${spotlight.color}${Math.floor(spotlight.intensity * 255).toString(16).padStart(2, '0')}`);
            grd.addColorStop(0.3, `${spotlight.color}A0`);
            grd.addColorStop(0.7, `${spotlight.color}60`);
            grd.addColorStop(1, `${spotlight.color}20`);
            
            // 绘制聚光灯主体 - 一个完整的锥形
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(leftX, leftY);
            ctx.lineTo(rightX, rightY);
            ctx.closePath();
            ctx.fill();
            
            // 聚光灯中心的强光带
            const centerGrd = ctx.createLinearGradient(startX, startY, centerX, centerY);
            centerGrd.addColorStop(0, `rgba(255, 255, 255, ${spotlight.intensity * 0.6})`);
            centerGrd.addColorStop(0.4, `${spotlight.color}80`);
            centerGrd.addColorStop(1, 'rgba(0,0,0,0)');
            
            const centerWidth = beamWidth * 0.3; // 中心强光宽度
            const centerLeftX = centerX - Math.cos(swayAngle) * centerWidth;
            const centerLeftY = centerY + Math.sin(swayAngle) * centerWidth;
            const centerRightX = centerX + Math.cos(swayAngle) * centerWidth;
            const centerRightY = centerY - Math.sin(swayAngle) * centerWidth;
            
            ctx.fillStyle = centerGrd;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(centerLeftX, centerLeftY);
            ctx.lineTo(centerRightX, centerRightY);
            ctx.closePath();
            ctx.fill();
            
            // 聚光灯边缘的柔和渐变
            const edgeGrd = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, beamWidth);
            edgeGrd.addColorStop(0, 'rgba(0,0,0,0)');
            edgeGrd.addColorStop(0.7, 'rgba(0,0,0,0)');
            edgeGrd.addColorStop(0.9, `${spotlight.color}30`);
            edgeGrd.addColorStop(1, `${spotlight.color}10`);
            
            ctx.fillStyle = edgeGrd;
            ctx.beginPath();
            ctx.arc(centerX, centerY, beamWidth, 0, Math.PI * 2);
            ctx.fill();
            
            // 大地反射效果
            if (centerY > h * 0.7) { // 只有当光束照到屏幕下方时才显示反射
                const reflectionGrd = ctx.createRadialGradient(centerX, h, 0, centerX, h, beamWidth * 0.8);
                reflectionGrd.addColorStop(0, `${spotlight.color}40`);
                reflectionGrd.addColorStop(0.5, `${spotlight.color}20`);
                reflectionGrd.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = reflectionGrd;
                ctx.beginPath();
                ctx.arc(centerX, h, beamWidth * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.globalCompositeOperation = 'source-over';
    },
    
    // 更新彩带和碎纸
    updateStreamersAndConfetti: function(ctx, w, h, now, golden) {
        // 只有在金币总数未达到上限时才生成彩带
        if (golden.totalCoins < golden.maxCoins && now - golden.lastStreamerTime > golden.streamerInterval) {
            golden.lastStreamerTime = now;
            
            // 播放彩带喷射音效
            if (typeof SoundEngine !== 'undefined') {
                SoundEngine.playStreamerBlast();
            }
            
            // 【暴力升级】三点同时爆发：左、中、右
            this.createStreamers(golden, w, h, 'left');   // 左侧爆发
            this.createStreamers(golden, w, h, 'center'); // 中央爆发
            this.createStreamers(golden, w, h, 'right');  // 右侧爆发
            
            // 生成更多碎纸
            this.createConfetti(golden, w, h);
            this.createConfetti(golden, w, h); // 双倍碎纸
        }
        
        // 更新现有彩带
        for (let i = golden.streamers.length - 1; i >= 0; i--) {
            const streamer = golden.streamers[i];
            
            // 物理更新
            streamer.x += streamer.vx;
            streamer.y += streamer.vy;
            streamer.vy += 0.1; // 重力
            streamer.vx *= 0.98; // 空气阻力
            streamer.rotation += streamer.rotSpeed;
            streamer.life -= 0.005;
            
            // 移除过期彩带
            if (streamer.life <= 0 || streamer.y > h + 50) {
                golden.streamers.splice(i, 1);
            }
        }
        
        // 更新碎纸
        for (let i = golden.confetti.length - 1; i >= 0; i--) {
            const conf = golden.confetti[i];
            
            conf.x += conf.vx;
            conf.y += conf.vy;
            conf.vy += 0.08; // 重力
            conf.vx *= 0.99; // 空气阻力
            conf.rotation += conf.rotSpeed;
            conf.life -= 0.008;
            
            if (conf.life <= 0 || conf.y > h + 50) {
                golden.confetti.splice(i, 1);
            }
        }
    },
    
    // 创建彩带 - 修正版
    createStreamers: function(golden, w, h, side) {
        const count = 20 + Math.random() * 15; // 暴增数量 (20-35 每个发射点)
        let startX, targetX, baseAngle, startY;
        
        // 根据发射点确定位置和方向
        if (side === 'left') {
            startX = -100; // 更远的起始位置
            startY = h * 0.85;
            targetX = w * 0.7; // 朝向右侧
            baseAngle = Math.atan2(-h * 0.4, targetX - startX);
        } else if (side === 'right') {
            startX = w + 100;
            startY = h * 0.85;
            targetX = w * 0.3; // 朝向左侧
            baseAngle = Math.atan2(-h * 0.4, targetX - startX);
        } else { // center - 修正从底部发射
            startX = w * 0.5;
            startY = h + 20; // 从屏幕底部外侧发射
            targetX = w * 0.5; // 垂直向上
            baseAngle = -Math.PI / 2; // 垂直向上
        }
        
        for (let i = 0; i < count; i++) {
            // 更大的角度变化，营造爆发感
            const angleVariation = (Math.random() - 0.5) * 1.8; // 更大的扩散角度
            const angle = baseAngle + angleVariation;
            
            const speed = 8 + Math.random() * 10; // 更强的初始速度 (8-18)
            
            golden.streamers.push({
                x: startX + (Math.random() - 0.5) * 200, // 更大的起始位置变化
                y: startY + (Math.random() - 0.5) * 50,  // 减少高度变化，确保从底部
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                length: 25 + Math.random() * 50, // 更大的长度变化 (25-75)
                width: 3 + Math.random() * 5,   // 更大的宽度变化 (3-8)
                color: this.getRandomStreamerColor(),
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2, // 更快的旋转
                life: 1.0,
                // 彩带类型分布：更多飘带
                type: Math.random() > 0.2 ? 'ribbon' : 'streamer' // 80% 飘带
            });
        }
    },
    
    // 创建碎纸
    createConfetti: function(golden, w, h) {
        const count = 20 + Math.random() * 10;
        
        for (let i = 0; i < count; i++) {
            const side = Math.random() > 0.5 ? 'left' : 'right';
            const startX = side === 'left' ? -30 : w + 30;
            const targetX = w * 0.5;
            const startY = h * 0.8;
            
            const angle = Math.atan2(-h * 0.6, targetX - startX) + (Math.random() - 0.5) * 1.0;
            const speed = 6 + Math.random() * 3;
            
            golden.confetti.push({
                x: startX + (Math.random() - 0.5) * 80,
                y: startY + (Math.random() - 0.5) * 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color: this.getRandomConfettiColor(),
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                life: 1.0
            });
        }
    },
    
    // 获取随机彩带颜色
    getRandomStreamerColor: function() {
        const colors = [
            '#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB', '#00CED1',
            '#FF69B4', '#32CD32', '#FF4500', '#DA70D6', '#00FA9A', '#FF8C00',
            '#BA55D3', '#20B2AA', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 获取随机碎纸颜色
    getRandomConfettiColor: function() {
        const colors = ['#FFD700', '#FFA500', '#FF69B4', '#00FA9A', '#87CEEB', '#DDA0DD'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 渲染彩带和碎纸 - 恢复简洁材质
    renderStreamersAndConfetti: function(ctx, golden) {
        // 渲染彩带
        golden.streamers.forEach(streamer => {
            ctx.save();
            ctx.translate(streamer.x, streamer.y);
            ctx.rotate(streamer.rotation);
            ctx.globalAlpha = streamer.life;
            
            if (streamer.type === 'ribbon') {
                // 飘带类型：柔软曲线，简洁材质
                ctx.fillStyle = streamer.color;
                ctx.beginPath();
                ctx.moveTo(-streamer.length / 2, -streamer.width / 2);
                ctx.quadraticCurveTo(0, -streamer.width, streamer.length / 2, -streamer.width / 2);
                ctx.quadraticCurveTo(0, streamer.width, -streamer.length / 2, streamer.width / 2);
                ctx.closePath();
                ctx.fill();
                
                // 简单高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(-streamer.length / 2, -streamer.width / 4, streamer.length, streamer.width / 2);
            } else {
                // 传统长条彩带
                ctx.fillStyle = streamer.color;
                ctx.fillRect(-streamer.length / 2, -streamer.width / 2, streamer.length, streamer.width);
                
                // 简单边框
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(-streamer.length / 2, -streamer.width / 2, streamer.length, streamer.width);
            }
            
            ctx.restore();
        });
        
        // 渲染碎纸
        golden.confetti.forEach(conf => {
            ctx.save();
            ctx.translate(conf.x, conf.y);
            ctx.rotate(conf.rotation);
            ctx.globalAlpha = conf.life;
            
            // 随机形状的碎纸
            if (Math.random() > 0.5) {
                // 方形碎纸
                ctx.fillStyle = conf.color;
                ctx.fillRect(-conf.size / 2, -conf.size / 2, conf.size, conf.size);
            } else {
                // 圆形碎纸
                ctx.fillStyle = conf.color;
                ctx.beginPath();
                ctx.arc(0, 0, conf.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 简单高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(-conf.size / 4, -conf.size / 4, conf.size / 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        ctx.globalAlpha = 1.0;
    },
    
    // 更新金币系统
    updateCoins: function(ctx, w, h, now, golden) {
        // 只有在未达到最大金币数时才生成新金币
        if (golden.totalCoins < golden.maxCoins && now - golden.lastCoinTime > golden.coinInterval) {
            golden.lastCoinTime = now;
            golden.totalCoins++;
            
            // 优化安全区域：避开屏幕中央胜利弹窗区域
            let coinX;
            const centerStart = w * 0.35; // 中央区域开始
            const centerEnd = w * 0.65;   // 中央区域结束
            
            // 随机选择左侧或右侧安全区域
            if (Math.random() > 0.5) {
                // 左侧安全区域 (15% - 35%)
                coinX = w * 0.15 + Math.random() * (centerStart - w * 0.15);
            } else {
                // 右侧安全区域 (65% - 85%)
                coinX = centerEnd + Math.random() * (w * 0.85 - centerEnd);
            }
            
            golden.coins.push({
                x: coinX,
                y: -30,
                vx: (Math.random() - 0.5) * 0.5, // 减少水平漂移
                vy: 1.3, // 固定下落速度 1.3
                rotation: 0,
                rotSpeed: 0.05, // 固定旋转速度
                size: 30, // 固定大小 30px
                life: 1.0,
                collected: false,
                glowPhase: Math.random() * Math.PI * 2
            });
        }
        
        // 更新现有金币
        for (let i = golden.coins.length - 1; i >= 0; i--) {
            const coin = golden.coins[i];
            
            if (!coin.collected) {
                // 物理更新（更慢）
                coin.x += coin.vx;
                coin.y += coin.vy;
                coin.vy += 0.01; // 非常轻微的重力加速度
                coin.rotation += coin.rotSpeed;
                coin.glowPhase += 0.08; // 更慢的发光动画
                
                // 移除超出屏幕的金币
                if (coin.y > h + 100) {
                    golden.coins.splice(i, 1);
                }
            } else {
                // 收集动画
                coin.size *= 1.1;
                coin.life -= 0.05;
                
                if (coin.life <= 0) {
                    golden.coins.splice(i, 1);
                }
            }
        }
    },
    
    // 渲染金币
    renderCoins: function(ctx, golden, now) {
        golden.coins.forEach(coin => {
            if (coin.collected) {
                // 收集动画：放大消散
                ctx.save();
                ctx.translate(coin.x, coin.y);
                ctx.scale(coin.size / 20, coin.size / 20);
                ctx.globalAlpha = coin.life;
                
                // 光芒效果
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
                grd.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                grd.addColorStop(0.5, 'rgba(255, 215, 0, 0.6)');
                grd.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            } else {
                // 正常金币渲染
                ctx.save();
                ctx.translate(coin.x, coin.y);
                ctx.rotate(coin.rotation);
                
                // 外发光
                const glowIntensity = 0.3 + Math.sin(coin.glowPhase) * 0.2;
                ctx.shadowBlur = 15;
                ctx.shadowColor = `rgba(255, 215, 0, ${glowIntensity})`;
                
                // 金币主体
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, coin.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 内圈装饰
                ctx.fillStyle = '#FFA500';
                ctx.beginPath();
                ctx.arc(0, 0, coin.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                
                // 高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(-coin.size * 0.3, -coin.size * 0.3, coin.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                // 金币符号
                ctx.fillStyle = '#B8860B';
                ctx.font = `bold ${coin.size * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('¥', 0, 0);
                
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        });
    },
    
    // 金币点击检测（在鼠标事件中调用）
    checkCoinClick: function(mouseX, mouseY) {
        if (!this.state.golden) return false;
        
        const golden = this.state.golden;
        let hitCoin = false;
        
        golden.coins.forEach(coin => {
            if (!coin.collected) {
                const distance = Math.hypot(mouseX - coin.x, mouseY - coin.y);
                if (distance < coin.size) {
                    // 金币被点击
                    coin.collected = true;
                    golden.collectedCoins++;
                    hitCoin = true;
                    
                    // 播放收集音效
                    if (typeof SoundEngine !== 'undefined') {
                        SoundEngine.playCoinCollect();
                    }
                    
                    // 创建收集粒子效果
                    this.createCoinCollectParticles(golden, coin.x, coin.y);
                }
            }
        });
        
        return hitCoin;
    },
    
    // 创建金币收集粒子效果
    createCoinCollectParticles: function(golden, x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            golden.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: '#FFD700',
                size: 3 + Math.random() * 2
            });
        }
    },
    
    // 渲染收集粒子效果
    renderGoldenParticles: function(ctx, golden) {
        for (let i = golden.particles.length - 1; i >= 0; i--) {
            const particle = golden.particles[i];
            
            // 更新粒子
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // 重力
            particle.life -= 0.02;
            
            if (particle.life <= 0) {
                golden.particles.splice(i, 1);
                continue;
            }
            
            // 渲染粒子
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    renderFireworks: function(ctx, w, h, now) {
        const fw = this.state.fireworks;
        
        // 固定频率发射火箭（每秒3枚）
        if (!fw.lastLaunchTime) fw.lastLaunchTime = now;
        if (now - fw.lastLaunchTime >= fw.launchInterval) {
            fw.lastLaunchTime = now;
            
            const hue = Math.floor(Math.random() * 360);
            
            // 计算朝向鼠标的方向
            let targetX = this.mouse.active ? this.mouse.x : w / 2;
            let targetY = this.mouse.active ? this.mouse.y : h * 0.3;
            
            // 随机起始位置（屏幕底部）
            const startX = Math.random() * w;
            const startY = h + 10;
            
            // 计算方向向量
            const dx = targetX - startX;
            const dy = targetY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 归一化并设置速度（朝向鼠标）
            const speed = 12 * 1.44;  // 提速 44% (1.2 * 1.2)
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            
            // 记录目标爆炸位置（鼠标附近随机范围）
            const explodeRadius = 120;  // 缩减20% (150 * 0.8)
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
                explodeX: explodeX,  // 目标爆炸位置
                explodeY: explodeY
            });
            
            // 移除发射音效，改为在爆炸时播放
        }
        
        // 渲染火箭
        ctx.globalCompositeOperation = 'lighter';
        for (let i = fw.rockets.length - 1; i >= 0; i--) {
            let r = fw.rockets[i];
            
            // 更新位置（不再受鼠标吸引，保持直线飞行）
            r.x += r.vx; 
            r.y += r.vy; 
            r.vy += 0.144;  // 提速 44% (0.12 * 1.2) - 轻微重力
            r.vx *= 0.99;  // 轻微空气阻力
            
            // 更新轨迹
            r.trail.push({x: r.x, y: r.y}); 
            if (r.trail.length > 12) r.trail.shift();
            
            // 优化：使用纯色代替 gradient
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
            
            // 检查是否到达目标爆炸位置
            let detonate = false;
            const distToTarget = Math.hypot(r.explodeX - r.x, r.explodeY - r.y);
            
            // 强制爆炸条件：
            // 1. 飞到画面顶部（防止飞过屏幕）
            if (r.y <= 10) {
                detonate = true;
            }
            // 2. 当接近目标位置时爆炸（50px范围内）
            else if (distToTarget < 50) {
                detonate = true;
            }
            // 3. 或者速度变慢时爆炸（到达顶点）
            else if (r.vy >= -0.5) {
                detonate = true;
            }
            // 4. 或者飞出屏幕左右边界时移除
            else if (r.x < -50 || r.x > w + 50) {
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
            
            // 闪光效果（优化：移除 gradient）
            if (p.isFlash) { 
                p.life -= p.decay; 
                if (p.life <= 0) { 
                    fw.explosions.splice(i, 1); 
                    continue; 
                }
                
                const rad = p.size * p.life;
                if (rad > 0) {
                    // 使用纯色圆形代替 gradient
                    ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${p.life * 0.6})`;
                    ctx.beginPath(); 
                    ctx.arc(p.x, p.y, rad, 0, Math.PI*2); 
                    ctx.fill();
                    
                    // 添加内圈高亮
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
            p.vy += 0.0432;  // 提速 44% (0.036 * 1.2)
            p.life -= p.decay; 
            
            if (p.life <= 0) { 
                fw.explosions.splice(i, 1); 
                continue; 
            }
            
            // 优化：简化颜色计算
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
        // 播放烟花爆炸音效
        if (typeof SoundEngine !== 'undefined') SoundEngine.playFireworkBlast();
        
        // 闪光效果
        this.state.fireworks.explosions.push({ 
            x: x, 
            y: y, 
            isFlash: true, 
            hue: hue, 
            size: 100, 
            life: 1.0, 
            decay: 0.1 
        });
        
        // 优化：减少粒子数量（从 60-100 降到 50-70）
        const count = 50 + Math.random() * 20; 
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2; 
            const speed = (Math.random() * 4 + 1) * 1.44;  // 提速 44% (1.2 * 1.2)
            this.state.fireworks.explosions.push({ 
                x: x, 
                y: y, 
                isFlash: false, 
                vx: Math.cos(angle) * speed, 
                vy: Math.sin(angle) * speed, 
                hue: hue + (Math.random() - 0.5) * 40, 
                size: Math.random() * 3 + 2, 
                life: 1.0, 
                decay: 0.01 + Math.random() * 0.015  // 加快衰减
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
        
        // 能量波动效果（电流强度变化）
        const energyPulse = Math.sin(elapsed * 0.008) * 0.3 + 0.7; // 0.4 到 1.0
        const flicker = 0.8 + Math.random() * 0.2;
        const combinedIntensity = energyPulse * flicker;
        
        const drawPath = (pathData, width, color, blur, alpha) => {
            ctx.beginPath(); ctx.moveTo(pathData.main[0].x, pathData.main[0].y);
            pathData.main.forEach(p => ctx.lineTo(p.x, p.y));
            pathData.branches.forEach(branch => { ctx.moveTo(branch[0].x, branch[0].y); branch.forEach(p => ctx.lineTo(p.x, p.y)); });
            ctx.lineWidth = width; ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.shadowColor = blur ? '#03a9f4' : 'transparent'; ctx.shadowBlur = blur; ctx.stroke();
        };
        
        // 1. 环境电离效果（外层光晕）
        drawPath(data, 12, '#00B0FF', 50, 0.2 * combinedIntensity);
        
        // 2. 主闪电路径（三层）
        drawPath(data, 6, '#00B0FF', 40, 0.4 * combinedIntensity); 
        drawPath(data, 3, '#40C4FF', 20, 0.8 * combinedIntensity); 
        drawPath(data, 1.5, '#FFFFFF', 0, 1.0 * combinedIntensity);
        
        // 3. 电流粒子（沿路径移动）
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
            
            // 粒子大小随位置变化
            const size = 3 + Math.sin(offset * Math.PI * 2) * 2;
            
            // 绘制粒子
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
        
        // 4. 电弧爆发（在分支点）
        if (Math.random() > 0.7) { // 30% 机率出现
            data.branches.forEach((branch, idx) => {
                if (Math.random() > 0.5) return; // 每个分支 50% 机率
                
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
        
        // 5. 能量核心闪光（随机在主路径上）
        if (Math.random() > 0.6) { // 40% 机率
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
        
        // 重置状态
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
        
        // 优化：减少 gradient 创建，使用缓存
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
        
        // 优化：减少 shadowBlur 使用
        ctx.lineWidth = 10; 
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.4)'; 
        ctx.shadowColor = '#FF6F00'; 
        ctx.shadowBlur = 15; // 从 25 降到 15
        ctx.stroke();
        
        ctx.lineWidth = 6; 
        ctx.strokeStyle = this._goldGradientCache.grad; 
        ctx.shadowBlur = 0; // 移除第二次 shadowBlur
        ctx.stroke();
        
        // 优化：减少粒子的 shadowBlur
        ctx.shadowBlur = 0; // 关闭 shadow
        this.state.lineParticles.forEach(p => {
            p.t += p.speed; 
            if(p.t > 1) p.t = 0;
            
            const twinkle = Math.abs(Math.sin(elapsed * p.blinkSpeed * 2));
            if (twinkle < 0.2) return;
            
            const px = start.x + (end.x - start.x) * p.t + p.offset;
            const py = start.y + (end.y - start.y) * p.t + p.offset;
            const size = p.size * twinkle * 1.5;
            
            // 使用纯色代替 shadow，性能更好
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
        
        // 优化：减少 shadowBlur
        ctx.shadowBlur = 10; // 从 20 降到 10
        ctx.shadowColor = '#ea80fc';
        ctx.beginPath(); 
        ctx.moveTo(start.x, start.y); 
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 4; 
        ctx.strokeStyle = 'rgba(224, 64, 251, 0.3)'; 
        ctx.stroke();
        
        // 优化：减少随机计算，使用预计算的偏移
        const segments = 12;
        const dx = (end.x - start.x) / segments;
        const dy = (end.y - start.y) / segments;
        
        // 使用固定的随机种子，避免每帧重新计算
        const frameOffset = Math.floor(elapsed / 100) % 4; // 每 100ms 变化一次
        
        ctx.shadowBlur = 0; // 关闭 shadow 以提升性能
        ctx.beginPath();
        for (let i = 0; i < segments; i++) {
            const sX = start.x + dx * i;
            const sY = start.y + dy * i;
            const eX = start.x + dx * (i+1);
            const eY = start.y + dy * (i+1);
            
            // 优化：使用简单的偏移模式代替随机
            let offsetX = 0, offsetY = 0;
            if ((i + frameOffset) % 3 === 0) { 
                offsetX = ((i % 2) - 0.5) * 10; 
                offsetY = ((i % 3) - 1) * 10; 
            }
            
            ctx.moveTo(sX + offsetX, sY + offsetY); 
            ctx.lineTo(eX + offsetX, eY + offsetY);
        }
        
        // 优化：使用固定颜色，避免每帧随机
        ctx.lineWidth = 2; 
        ctx.strokeStyle = Math.floor(elapsed / 200) % 2 === 0 ? '#00e5ff' : '#d500f9';
        ctx.stroke();
        
        // 优化：简化 runner 动画，移除 save/restore
        const runnerT = (elapsed * 0.0048) % 1;  // 提速 20% (0.004 * 1.2)
        const rx = start.x + (end.x - start.x) * runnerT;
        const ry = start.y + (end.y - start.y) * runnerT;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        // 使用简单的矩形代替变换
        ctx.fillStyle = '#fff'; 
        ctx.shadowBlur = 8; // 从 15 降到 8
        ctx.shadowColor = '#fff';
        
        // 手动计算旋转后的矩形顶点，避免 save/restore
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