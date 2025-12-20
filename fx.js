// ================= 视觉特效引擎 (Visual Effects) =================
// [Alpha 0.7.7.9 DJ Full Set]
// - 物理控制: 严格的 display: none 管理
// - DJ 完整逻辑: Challenge -> Void / Party 渲染分支

const VisualFX = {
    canvas: null,
    ctx: null,
    animationId: null,
    
    mouse: { x: -1000, y: -1000, active: false },

    state: {
        active: false,
        startTime: 0,
        
        lineType: null, 
        linePoints: [],
        lineParticles: [],
        lightningData: null,
        
        celebrationType: null, 
        fireworks: { rockets: [], explosions: [] },
        dj: { score: 0, combo: 0, kickScale: 1.0, bgFlash: 0, spotlights: [], particles: [], noteSpeed: 600 }
    },

    init: function() {
        this.canvas = document.getElementById('fxCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            
            // [Fix] 初始状态隐藏 Canvas，防止遮挡主菜单
            this.canvas.style.display = 'none';
            
            document.addEventListener('mousemove', e => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                this.mouse.active = true;
            });
            document.addEventListener('mouseleave', () => { this.mouse.active = false; });
            
            // 绑定 DJ 点击
            document.addEventListener('mousedown', () => {
                if (this.state.celebrationType === 'dj' && typeof SoundEngine !== 'undefined' && SoundEngine.rhythm.phase === 'challenge') {
                    this.handleDrumHit();
                }
            });
        }
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
        }
        // [Fix] 物理隐藏画布
        if (this.canvas) {
            this.canvas.style.display = 'none';
            this.canvas.style.pointerEvents = 'none';
        }

        this.state = {
            active: false,
            startTime: 0,
            lineType: null,
            linePoints: [],
            lineParticles: [],
            lightningData: null,
            celebrationType: null,
            fireworks: { rockets: [], explosions: [] },
            dj: { score: 0, combo: 0, kickScale: 1.0, bgFlash: 0, spotlights: [], particles: [], noteSpeed: 600 }
        };
        
        if (typeof SoundEngine !== 'undefined' && SoundEngine.stopRhythmGame) SoundEngine.stopRhythmGame();
    },

    getCoords: function(r, c) {
        const cell = document.getElementById(`c-${r}-${c}`);
        if (!cell) return null;
        const rect = cell.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    },

    startLoop: function() {
        if (this.animationId) return;
        
        // [Fix] 激活时才显示 Canvas
        if (this.canvas) this.canvas.style.display = 'block';
        
        this.state.active = true;
        this.state.startTime = performance.now();
        const loop = (now) => {
            if (!this.state.active) return;
            this.renderFrame(now);
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    },

    drawWinLine: function(lineCells, type) {
        this.state.lineType = type;
        this.state.linePoints = lineCells.map(p => this.getCoords(p.r, p.c)).filter(p => p);
        this.state.lineParticles = [];
        this.state.lightningData = null;
        if (this.state.linePoints.length < 2) return;
        
        // 连珠模式下禁用点击，确保穿透
        if (this.canvas) this.canvas.style.pointerEvents = 'none';

        if (type === 'lightning') {
            this.state.lightningData = this.generateLightningPath(this.state.linePoints[0], this.state.linePoints[this.state.linePoints.length-1], 35);
        } else if (type === 'default' || type === 'gold') {
            for(let i=0; i<30; i++) {
                this.state.lineParticles.push({ t: Math.random(), offset: (Math.random()-0.5)*20, speed: 0.002+Math.random()*0.005, size: Math.random()*3+1, life: Math.random()*Math.PI*2, blinkSpeed: 0.05+Math.random()*0.1 });
            }
        }
        this.startLoop();
    },

    startCelebration: function(type) {
        if (type === 'default') return; 
        this.state.celebrationType = type;
        
        // [Fix] 动态切换交互模式
        if (this.canvas) {
            if (type === 'dj') {
                this.canvas.style.pointerEvents = 'auto'; // DJ 模式需要点击
            } else {
                this.canvas.style.pointerEvents = 'none'; // 烟花模式需要穿透
            }
        }

        if (type === 'fireworks') {
            this.state.fireworks = { rockets: [], explosions: [] };
        } else if (type === 'dj') {
            this.state.dj.spotlights = Array(6).fill(0).map((_, i) => ({ 
                angle: (Math.PI / 6) * i + Math.PI, 
                speed: (Math.random() - 0.5) * 0.02, 
                color: `hsl(${Math.random()*360}, 80%, 60%)` 
            }));
            if (typeof SoundEngine !== 'undefined') SoundEngine.startRhythmGame();
        }
        this.startLoop();
    },

    renderFrame: function(now) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const elapsed = now - this.state.startTime;

        ctx.clearRect(0, 0, w, h);

        if (this.state.lineType && this.state.linePoints.length >= 2) {
            // DJ Void 模式下隐藏连珠
            if (!(this.state.celebrationType === 'dj' && typeof SoundEngine !== 'undefined' && SoundEngine.rhythm.phase === 'void')) {
                const type = this.state.lineType;
                const pts = this.state.linePoints;
                if (type === 'default') this.renderDefaultLine(pts, elapsed);
                else if (type === 'lightning') this.renderLightning(pts, this.state.lightningData, elapsed);
                else if (type === 'gold') this.renderGold(pts, elapsed);
                else if (type === 'future') this.renderFuture(pts, elapsed);
            }
        }

        if (this.state.celebrationType === 'fireworks') {
            this.renderFireworks(ctx, w, h);
        } else if (this.state.celebrationType === 'dj') {
            this.renderDJGame(ctx, w, h, now);
        }
    },

    // DJ Game Logic
    handleDrumHit: function() {
        const result = SoundEngine.checkRhythmHit();
        const dj = this.state.dj;
        dj.kickScale = 0.8;
        if (result === 'perfect') {
            dj.combo++;
            dj.bgFlash = 1.0;
            dj.kickScale = 1.4;
            SoundEngine.playKick();
            const w = this.canvas.width;
            const h = this.canvas.height;
            this.createDJParticles(w/2, h-80, '#fff', 20);
        }
    },
    
    createDJParticles: function(x, y, color, count) {
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.state.dj.particles.push({ x: x, y: y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, color: color, life: 1.0, decay: 0.05 });
        }
    },

    renderDJGame: function(ctx, w, h, now) {
        const dj = this.state.dj;
        const phase = (typeof SoundEngine !== 'undefined') ? SoundEngine.rhythm.phase : 'idle';
        const audioTime = (typeof SoundEngine !== 'undefined') ? SoundEngine.ctx.currentTime : 0;
        
        if (phase === 'void') {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#333'; ctx.font = 'bold 100px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText("MISS", w/2, h/2);
            return;
        }

        if (phase === 'party') {
            this.renderSpotlights(ctx, w, h);
            if (dj.bgFlash > 0.01) { ctx.fillStyle = `rgba(255, 255, 255, ${dj.bgFlash * 0.2})`; ctx.fillRect(0, 0, w, h); dj.bgFlash *= 0.9; }
            this.renderDrum(ctx, w, h);
            this.renderParticles(ctx);
            ctx.fillStyle = `hsla(${now * 0.1}, 100%, 50%, 1)`; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center'; ctx.fillText("PARTY TIME!", w/2, h/2 - 100);
            return;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, w, h);
        this.renderSpotlights(ctx, w, h);
        if (dj.bgFlash > 0.01) { ctx.fillStyle = `rgba(255, 255, 255, ${dj.bgFlash * 0.3})`; ctx.fillRect(0, 0, w, h); dj.bgFlash *= 0.8; }

        const notes = (typeof SoundEngine !== 'undefined') ? SoundEngine.rhythm.notes : [];
        const drumX = w / 2; const drumY = h - 80;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(0, drumY); ctx.lineTo(w, drumY); ctx.stroke();

        for (let i = 0; i < notes.length; i++) {
            const noteTime = notes[i];
            const timeDiff = noteTime - audioTime;
            if (timeDiff < -0.2) continue; 
            if (timeDiff > 2.0) continue; 
            const side = (i % 2 === 0) ? -1 : 1; 
            const dist = timeDiff * dj.noteSpeed;
            const x = drumX + side * dist;
            const color = (i % 2 === 0) ? '#00e5ff' : '#ff4081';
            ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(x, drumY, 20, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        }

        this.renderDrum(ctx, w, h);
        this.renderParticles(ctx);
        if (dj.combo > 0) { ctx.fillStyle = '#ffea00'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText(`${dj.combo} COMBO!`, drumX, drumY - 80); }
    },
    
    renderDrum: function(ctx, w, h) {
        const dj = this.state.dj;
        const drumX = w / 2; const drumY = h - 80;
        dj.kickScale += (1.0 - dj.kickScale) * 0.2;
        const radius = 40 * dj.kickScale;
        ctx.shadowBlur = 20; ctx.shadowColor = '#00e676'; ctx.fillStyle = 'rgba(30, 30, 30, 0.9)'; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(drumX, drumY, radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 16px Arial'; ctx.fillText('CLICK', drumX, drumY);
    },
    
    renderSpotlights: function(ctx, w, h) {
        const dj = this.state.dj;
        ctx.globalCompositeOperation = 'lighter';
        dj.spotlights.forEach(s => {
            s.angle += s.speed;
            const sx = w/2 + Math.cos(s.angle) * w * 0.2; 
            const sy = -50; 
            const ex = w/2 + Math.sin(s.angle * 1.5) * w; 
            const ey = h + 100;
            const grd = ctx.createLinearGradient(sx, sy, ex, ey);
            grd.addColorStop(0, s.color); grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex - 100, ey); ctx.lineTo(ex + 100, ey); ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
    },
    
    renderParticles: function(ctx) {
        const dj = this.state.dj;
        for (let i = dj.particles.length - 1; i >= 0; i--) {
            let p = dj.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= p.decay;
            if (p.life <= 0) { dj.particles.splice(i, 1); continue; }
            ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },

    renderFireworks: function(ctx, w, h) {
        const fw = this.state.fireworks;
        if (Math.random() < 0.025) { 
            const hue = Math.floor(Math.random() * 360);
            fw.rockets.push({ x: Math.random() * w, y: h + 10, vx: (Math.random() - 0.5) * 4 + (w/2 - Math.random()*w) * 0.003, vy: -(Math.random() * 4 + 8), hue: hue, trail: [] });
            if (typeof SoundEngine !== 'undefined') SoundEngine.playFireworkLaunch();
        }
        for (let i = fw.rockets.length - 1; i >= 0; i--) {
            let r = fw.rockets[i];
            if (this.mouse.active) {
                const dx = this.mouse.x - r.x; const dy = this.mouse.y - r.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 80) { const force = 0.3; r.vx += (dx / dist) * force + (Math.random()-0.5) * 0.3; r.vy += (dy / dist) * force + (Math.random()-0.5) * 0.3; }
            }
            r.x += r.vx; r.y += r.vy; r.vy += 0.1; r.vx *= 0.98; 
            r.trail.push({x: r.x, y: r.y}); if (r.trail.length > 12) r.trail.shift();
            ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 5; ctx.beginPath();
            if (r.trail.length > 1) { ctx.moveTo(r.trail[0].x, r.trail[0].y); for(let k=1; k<r.trail.length; k++) ctx.lineTo(r.trail[k].x, r.trail[k].y); } else { ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y+5); }
            const gradient = ctx.createLinearGradient(r.x, r.y, r.trail[0]?.x || r.x, r.trail[0]?.y || r.y);
            gradient.addColorStop(0, '#fff'); gradient.addColorStop(1, `hsla(${r.hue}, 100%, 60%, 0)`);
            ctx.strokeStyle = gradient; ctx.stroke();
            let detonate = false; if (r.vy >= -0.5) detonate = true;
            if (this.mouse.active) { const dToMouse = Math.hypot(this.mouse.x - r.x, this.mouse.y - r.y); if (dToMouse < 80) detonate = true; }
            if (detonate) { this.explodeFirework(r.x, r.y, r.hue); fw.rockets.splice(i, 1); }
        }
        for (let i = fw.explosions.length - 1; i >= 0; i--) {
            let p = fw.explosions[i];
            if (p.isFlash) { p.life -= p.decay; if (p.life <= 0) { fw.explosions.splice(i, 1); continue; } const rad = p.size * p.life; if (rad > 0) { const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad); grd.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); grd.addColorStop(1, `hsla(${p.hue}, 100%, 60%, 0)`); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI*2); ctx.fill(); } continue; }
            p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.vy += 0.03; p.life -= p.decay; 
            if (p.life <= 0) { fw.explosions.splice(i, 1); continue; }
            ctx.globalCompositeOperation = 'lighter';
            let lightness = 50, saturation = 100; if (p.life > 0.7) { lightness = 90; saturation = 50; } else if (p.life > 0.4) { lightness = 60; saturation = 100; } else { lightness = 40; } 
            const flicker = 0.5 + Math.random() * 0.5; const size = p.size * p.life * flicker;
            ctx.fillStyle = `hsla(${p.hue}, ${saturation}%, ${lightness}%, ${p.life})`; ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    },
    
    explodeFirework: function(x, y, hue) {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playFireworkBlast(Math.random());
        this.state.fireworks.explosions.push({ x: x, y: y, isFlash: true, hue: hue, size: 100, life: 1.0, decay: 0.1 });
        const count = 60 + Math.random() * 40; 
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 4 + 1; 
            this.state.fireworks.explosions.push({ x: x, y: y, isFlash: false, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, hue: hue + (Math.random() - 0.5) * 40, size: Math.random() * 3 + 2, life: 1.0, decay: 0.005 + Math.random() * 0.01 });
        }
    },

    renderDefaultLine: function(points, elapsed) {
        const ctx = this.ctx; const start = points[0], end = points[points.length-1];
        const breath = (Math.sin(elapsed * 0.005) + 1) * 0.5; 
        ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 6 + breath * 4; ctx.strokeStyle = '#00e676'; ctx.shadowColor = '#69f0ae'; ctx.shadowBlur = 15 + breath * 10; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = '#e8f5e9'; ctx.shadowBlur = 0; ctx.stroke();
        ctx.fillStyle = '#b9f6ca';
        this.state.lineParticles.forEach(p => {
            p.t += p.speed; if(p.t > 1) p.t = 0; const px = start.x + (end.x - start.x) * p.t; const py = start.y + (end.y - start.y) * p.t;
            ctx.globalAlpha = (Math.sin(elapsed * p.blinkSpeed + p.life) + 1) * 0.5; ctx.beginPath(); ctx.arc(px, py + p.offset - (elapsed * 0.02), p.size, 0, Math.PI*2); ctx.fill();
        });
    },

    renderLightning: function(points, data, elapsed) {
        const ctx = this.ctx; if (!data || Math.random() > 0.85) return; 
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const drawPath = (pathData, width, color, blur, alpha) => {
            ctx.beginPath(); ctx.moveTo(pathData.main[0].x, pathData.main[0].y);
            pathData.main.forEach(p => ctx.lineTo(p.x, p.y));
            pathData.branches.forEach(branch => { ctx.moveTo(branch[0].x, branch[0].y); branch.forEach(p => ctx.lineTo(p.x, p.y)); });
            ctx.lineWidth = width; ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.shadowColor = blur ? '#03a9f4' : 'transparent'; ctx.shadowBlur = blur; ctx.stroke();
        };
        const flicker = 0.8 + Math.random() * 0.2;
        drawPath(data, 6, '#00B0FF', 40, 0.4 * flicker); drawPath(data, 3, '#40C4FF', 20, 0.8 * flicker); drawPath(data, 1.5, '#FFFFFF', 0, 1.0 * flicker); ctx.globalAlpha = 1; 
    },

    generateLightningPath: function(start, end, displace) {
        const createPts = (p1, p2, dis) => {
            if (dis < 2) return [p1, p2];
            let midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
            const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.sqrt(dx*dx + dy*dy);
            const normalX = -dy / len, normalY = dx / len;
            const offset = (Math.random() - 0.5) * dis;
            midX += normalX * offset; midY += normalY * offset; const mid = {x: midX, y: midY};
            return createPts(p1, mid, dis * 0.55).concat(createPts(mid, p2, dis * 0.55).slice(1));
        };
        const main = createPts(start, end, displace); const branches = []; const totalDist = Math.hypot(end.x - start.x, end.y - start.y); const numBranches = Math.floor(totalDist / 50);
        for (let i = 0; i < numBranches; i++) {
            const idx = Math.floor(Math.random() * (main.length - 1)); const root = main[idx]; const angle = Math.random() * Math.PI * 2; const len = 20 + Math.random() * 30; const tip = { x: root.x + Math.cos(angle) * len, y: root.y + Math.sin(angle) * len }; branches.push(createPts(root, tip, 10));
        }
        return { main, branches };
    },

    renderGold: function(points, elapsed) {
        const ctx = this.ctx; const start = points[0], end = points[points.length-1]; const shift = (elapsed * 0.0015) % 1; 
        const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        grad.addColorStop(0, '#FFC107'); grad.addColorStop(Math.max(0, shift - 0.15), '#FFD54F'); grad.addColorStop(shift, '#FFFFFF'); grad.addColorStop(Math.min(1, shift + 0.15), '#FFD54F'); grad.addColorStop(1, '#FFC107');
        ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255, 193, 7, 0.4)'; ctx.shadowColor = '#FF6F00'; ctx.shadowBlur = 25; ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = grad; ctx.shadowBlur = 5; ctx.stroke();
        this.state.lineParticles.forEach(p => {
            const twinkle = Math.abs(Math.sin(elapsed * p.blinkSpeed * 2)); if (twinkle < 0.2) return;
            const px = start.x + (end.x - start.x) * p.t + p.offset; const py = start.y + (end.y - start.y) * p.t + p.offset;
            ctx.fillStyle = '#FFF'; ctx.shadowBlur = 10; ctx.shadowColor = '#FFF'; const size = p.size * twinkle * 1.5;
            ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI*2); ctx.fill();
        });
    },

    renderFuture: function(points, elapsed) {
        const ctx = this.ctx; const start = points[0], end = points[points.length-1];
        ctx.shadowBlur = 20; ctx.shadowColor = '#ea80fc'; ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(224, 64, 251, 0.3)'; ctx.stroke();
        const segments = 12, dx = (end.x - start.x) / segments, dy = (end.y - start.y) / segments;
        ctx.beginPath();
        for (let i = 0; i < segments; i++) {
            const sX = start.x + dx * i, sY = start.y + dy * i, eX = start.x + dx * (i+1), eY = start.y + dy * (i+1);
            let offsetX = 0, offsetY = 0; if (Math.random() > 0.85) { offsetX = (Math.random() - 0.5) * 15; offsetY = (Math.random() - 0.5) * 15; }
            ctx.moveTo(sX + offsetX, sY + offsetY); ctx.lineTo(eX + offsetX, eY + offsetY);
        }
        ctx.lineWidth = 2; ctx.strokeStyle = Math.random() > 0.5 ? '#00e5ff' : '#d500f9'; ctx.stroke();
        const runnerT = (elapsed * 0.004) % 1; const rx = start.x + (end.x - start.x) * runnerT, ry = start.y + (end.y - start.y) * runnerT;
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 15;
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(Math.atan2(end.y - start.y, end.x - start.x)); ctx.fillRect(-10, -3, 20, 6); ctx.restore();
    }
};