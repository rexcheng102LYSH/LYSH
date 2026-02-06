// ================= 烟花特效模块 (Fireworks FX) =================

const FireworksFX = {
    state: {
        fireworks: null,
        victoryText: null
    },
    mouse: { x: -1000, y: -1000, active: false },
    // 根据当前语言返回胜利字幕
    getVictoryLabel() {
        if (typeof curLangKey === 'string') {
            if (curLangKey === 'zh') return '赢!!!';
            if (curLangKey === 'zh-TW') return '贏!!!';
            if (curLangKey === 'en') return 'VICTORY';
        }
        return 'VICTORY';
    },

    start() {
        this.state.fireworks = {
            rockets: [],
            explosions: [],
            lastLaunchTime: 0,  // 记录上次发射时间
            launchInterval: 1000 / 3  // 每秒3发 = 333.33ms间隔
        };
        // 创建 victory 文本特效（永久显示）
        this.state.victoryText = {
            x: 0,
            y: 0,
            alpha: 0,
            scale: 0.5
        };
    },

    render(ctx, w, h, now) {
        const fw = this.state.fireworks;
        if (!fw) return;

        // 同步鼠标状态（来自核心引擎）
        if (window.VisualFX && window.VisualFX.mouse) {
            this.mouse = window.VisualFX.mouse;
        }

        // 固定频率发射火箭（每秒3发）
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
            const speed = 12 * 1.44;  // 提速44% (1.2 * 1.2)
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
            r.vy += 0.144;  // 提速44% (0.12 * 1.2) - 轻微重力
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
            // 2. 当接近目标位置时爆炸（30px范围内）
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
            p.vy += 0.0432;  // 提速44% (0.036 * 1.2)
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
        
        // 绘制 victory 文本特效（独立样式）
        if (this.state.victoryText) {
            const victory = this.state.victoryText;
            victory.x = w / 2;
            victory.y = h / 4; // 与 DJ 文本保持同高，避免被弹窗遮挡

            if (victory.alpha < 1.0) {
                victory.alpha += (1.0 - victory.alpha) * 0.05;
            }
            if (victory.scale < 1.2) {
                victory.scale += (1.2 - victory.scale) * 0.05;
            }

            ctx.save();
            ctx.translate(victory.x, victory.y);
            ctx.scale(victory.scale, victory.scale);
            ctx.globalAlpha = victory.alpha;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#FFD700';
            ctx.fillText(this.getVictoryLabel(), 0, 0);
            ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';
    },

    explodeFirework(x, y, hue) {
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
        
        // 优化：减少粒子数量（从60-100 降到 50-70）
        const count = 50 + Math.random() * 20; 
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2; 
            const speed = (Math.random() * 4 + 1) * 1.44;  // 提速44% (1.2 * 1.2)
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

    reset() {
        this.state.fireworks = {
            rockets: [],
            explosions: [],
            lastLaunchTime: 0,
            launchInterval: 1000 / 3
        };
        // 停止烟花 BGM，逻辑与 bgm6/bgm5 一致
        if (typeof SoundEngine !== 'undefined' && SoundEngine.fireworksBGM) {
            try {
                SoundEngine.fireworksBGM.pause();
                SoundEngine.fireworksBGM.currentTime = 0;
                SoundEngine.fireworksBGM = null;
            } catch (e) {
                console.warn('[Fireworks] 烟花 BGM 清理异常:', e);
            }
        }
    }
};

if (window.VisualFX && typeof window.VisualFX.register === 'function') {
    window.VisualFX.register('fireworks', FireworksFX);
}



