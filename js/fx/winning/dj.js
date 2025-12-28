// ================= DJ 节奏特效模块 (DJ FX) =================

const DJFX = {
    state: {
        celebrationType: null,
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
    },
    screenShake: null,
    _lastHitTime: 0,
    _lastWidth: 0,
    _lastHeight: 0,

    start() {
        console.log('[DJ] 启动 DJ 模式');
        this.state.celebrationType = 'dj';

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
        if (window.VisualFX && window.VisualFX.canvas) {
            window.VisualFX.canvas.style.pointerEvents = 'auto';
            console.log('[DJ] Canvas pointerEvents 设为 auto');
            console.log('[DJ] Canvas 当前样式:', window.getComputedStyle(window.VisualFX.canvas).pointerEvents);
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
    },

    handleClick(x, y, e) {
        // 维持旧逻辑：只在挑战阶段响应
        const dj = this.state.dj;
        if (dj.phase !== 'challenge') return false;
        this.handleDrumHit(e);
        return true;
    },

    render(ctx, w, h, now) {
        this._lastWidth = w;
        this._lastHeight = h;

        const shakeOffset = this.updateScreenShake(now);
        if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
            ctx.save();
            ctx.translate(shakeOffset.x, shakeOffset.y);
        }

        this.renderDJGame(ctx, w, h, now);

        if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
            ctx.restore();
        }
    },

    reset() {
        if (typeof SoundEngine !== 'undefined' && SoundEngine.stopDJGame) {
            SoundEngine.stopDJGame();
        }

        // 强制清理 DJ 特效，防止崩溃和内存泄漏
        this.forceStopDJ();
    },

    // 强制停止 DJ 特效的专用函数
    forceStopDJ: function() {
        // 1. 强制重置 DJ 状态
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

        // 4. 恢复技能与悔棋按钮显示（避免 DJ 结束后消失）
        const skillBtn = document.getElementById('skillBtn');
        if (skillBtn) {
            skillBtn.style.display = '';
        }
        const undoBtn = document.querySelector('[onclick="undoMove()"]');
        if (undoBtn) {
            undoBtn.style.display = '';
        }
        
        console.log('[FX] DJ特效已强制清理');
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
        const w = this._lastWidth || (window.VisualFX && window.VisualFX.canvas ? window.VisualFX.canvas.width : window.innerWidth);
        const h = this._lastHeight || (window.VisualFX && window.VisualFX.canvas ? window.VisualFX.canvas.height : window.innerHeight);
        const drumX = w / 2;
        const drumY = h - 80;
        
        // === 屏幕震动效果 ===
        this.triggerScreenShake(8, 200); // 强度8，持续200ms
        
        // 创建爆发粒子
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (2 + Math.random() * 4) * 1.2;  // 提速20%
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
        const w = this._lastWidth || (window.VisualFX && window.VisualFX.canvas ? window.VisualFX.canvas.width : window.innerWidth);
        const h = this._lastHeight || (window.VisualFX && window.VisualFX.canvas ? window.VisualFX.canvas.height : window.innerHeight);
        dj.missText = {
            x: w / 2,
            y: h / 4, // 【修复】移到画面上方1/4，避免被弹窗遮住
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
        const w = this._lastWidth || (window.VisualFX && window.VisualFX.canvas ? window.VisualFX.canvas.width : window.innerWidth);
        const h = this._lastHeight || (window.VisualFX && window.VisualFX.canvas ? window.VisualFX.canvas.height : window.innerHeight);
        dj.perfectText = {
            x: w / 2,
            y: h / 4, // 与 MISS 等高，避免被弹窗遮住
            alpha: 0,
            scale: 0.5,
            life: 1.0
        };
        
        // === 聚光灯渐变过渡系统 ===
        dj.transitionStartTime = performance.now();
        dj.transitionDuration = 2000; // 2秒过渡时间
        
        // 初始化过渡状态：从固定位置开始
        dj.spotlights = [
            { 
                x: 0.2, 
                fixed: true, 
                color: '#B3E5FC',
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
            this.drawHoloText(ctx, 'MISS', miss.x, miss.y, miss.scale, miss.alpha, '#ff1744', '#ff6b6b', now);
            
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
            
            this.drawHoloText(ctx, 'MISS', miss.x, miss.y, miss.scale, miss.alpha, '#ff1744', '#ff6b6b', now);
        }
    },

    // 赛博全息文字渲染（用于 PERFECT / MISS）
    drawHoloText: function(ctx, text, x, y, scale, alpha, mainColor, accentColor, now) {
        const t = (now || performance.now()) * 0.001;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        ctx.font = '700 72px "Segoe UI", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(text);
        const w = metrics.width + 26;
        const h = 72;

        // 1) 稳定主体：高对比霓虹填充
        ctx.shadowBlur = 18;
        ctx.shadowColor = mainColor;
        ctx.fillStyle = mainColor;
        ctx.fillText(text, 0, 0);

        // 2) 边缘材质：金属质感描边 + 外侧微光
        ctx.shadowBlur = 0;
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.strokeText(text, 0, 0);
        ctx.lineWidth = 3;
        ctx.strokeStyle = mainColor;
        ctx.strokeText(text, 0, 0);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = accentColor;
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeText(text, 0, 0);

        // 3) 内发光层：只做亮度闪烁，不做位移
        const flicker = 0.22 + (Math.sin(t * 5.4) + 1) * 0.08;
        ctx.globalCompositeOperation = 'source-atop';
        ctx.shadowBlur = 10;
        ctx.shadowColor = accentColor;
        ctx.globalAlpha = alpha * flicker;
        ctx.fillStyle = accentColor;
        ctx.fillText(text, 0, 0);

        ctx.globalCompositeOperation = 'source-over';

        ctx.restore();
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
                
                s.angle += s.speed * transitionProgress * 0.1; // 大幅减少角度变化
                
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
        
        // 6. 绘制 PERFECT 文字特效 - 永久保留
        if (dj.perfectText) {
            const perfect = dj.perfectText;
            
            // 【永久显示】只在初始化时进行淡入和缩放动画
            if (perfect.alpha < 1.0) {
                perfect.alpha += (1.0 - perfect.alpha) * 0.05;
            }
            if (perfect.scale < 1.2) {
                perfect.scale += (1.2 - perfect.scale) * 0.05;
            }
            // 【永久显示】不再衰减life
            
            this.drawHoloText(ctx, 'PERFECT', perfect.x, perfect.y, perfect.scale, perfect.alpha, '#00e676', '#7cff6b', now);
        }
    },
    
    // 颜色插值函数
    interpolateColor: function(color1, color2, t) {
        // 简化版颜色插值，支持 hex 与 hsl
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
        
        // === 【Alpha 0.7.8.3】判定提示灯 - 根据开关决定是否显示===
        // 仅当 djDrumIndicatorEnabled 不为 true 时才显示提示灯
        if (typeof djDrumIndicatorEnabled !== 'undefined' && djDrumIndicatorEnabled) {
            let canHit = false;
            let indicatorColor = '#FF1744'; // 默认红色（不可击中）
            
            if (typeof SoundEngine !== 'undefined' && SoundEngine.djGame.active) {
                const currentTime = SoundEngine.ctx.currentTime;
                const hitWindow = 0.4; // 【翻倍】200ms 判定窗口
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
            p.vy += 0.24;  // 提速20% (0.2 * 1.2)
            p.life -= 0.024;  // 提速20% (0.02 * 1.2)
            
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
    }
};

if (window.VisualFX && typeof window.VisualFX.register === 'function') {
    window.VisualFX.register('dj', DJFX);
}
