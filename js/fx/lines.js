// ================= 连珠特效模块 (Winning Lines FX) =================

const LinesFX = {
    state: {
        lineType: null,
        linePoints: [],
        lineParticles: [],
        lightningData: null,
        startTime: 0
    },
    _goldGradientCache: null,

    // 获取棋盘坐标
    getCoords: function(r, c) {
        const cell = document.getElementById(`c-${r}-${c}`);
        if (!cell) return null;
        const rect = cell.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    },

    start: function(lineCells, type) {
        // 兼容可能的新命名
        if (type === 'simple') type = 'default';
        if (type === 'neon') type = 'future';

        this.state.lineType = type;
        this.state.linePoints = lineCells.map(p => this.getCoords(p.r, p.c)).filter(p => p);
        this.state.lineParticles = [];
        this.state.lightningData = null;
        this.state.startTime = performance.now();

        if (this.state.linePoints.length < 2) return;

        if (type === 'lightning') {
            this.state.lightningData = this.generateLightningPath(
                this.state.linePoints[0],
                this.state.linePoints[this.state.linePoints.length - 1],
                35
            );
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
    },

    render: function(ctx, w, h, now) {
        if (!this.state.lineType || this.state.linePoints.length < 2) return;
        const elapsed = now - this.state.startTime;
        const pts = this.state.linePoints;

        if (this.state.lineType === 'default') this.renderDefaultLine(ctx, pts, elapsed);
        else if (this.state.lineType === 'lightning') this.renderLightning(ctx, pts, this.state.lightningData, elapsed);
        else if (this.state.lineType === 'gold') this.renderGold(ctx, pts, elapsed);
        else if (this.state.lineType === 'future') this.renderFuture(ctx, pts, elapsed);
    },

    reset: function() {
        this.state.lineType = null;
        this.state.linePoints = [];
        this.state.lineParticles = [];
        this.state.lightningData = null;
        this.state.startTime = 0;
        this._goldGradientCache = null;
    },

    renderDefaultLine: function(ctx, points, elapsed) {
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
            ctx.beginPath(); ctx.arc(px, py + p.offset - (elapsed * 0.024), p.size, 0, Math.PI*2); ctx.fill();  // 提速20% (0.02 * 1.2)
        });
        ctx.globalAlpha = 1;
    },

    renderLightning: function(ctx, points, data, elapsed) {
        if (!data || Math.random() > 0.85) return;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        
        // 能量波动效果（电流强度变化）
        const energyPulse = Math.sin(elapsed * 0.008) * 0.3 + 0.7; // 0.4 - 1.0
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
        if (Math.random() > 0.7) { // 30% 概率出现
            data.branches.forEach((branch, idx) => {
                if (Math.random() > 0.5) return; // 每个分支 50% 概率
                
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
        if (Math.random() > 0.6) { // 40% 概率
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

    renderGold: function(ctx, points, elapsed) {
        const start = points[0], end = points[points.length-1];
        const shift = (elapsed * 0.0018) % 1;  // 提速20% (0.0015 * 1.2)
        
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
        ctx.shadowBlur = 15; // 从25 降到 15
        ctx.stroke();
        
        ctx.lineWidth = 6;
        ctx.strokeStyle = this._goldGradientCache.grad;
        ctx.shadowBlur = 0; // 移除第二次shadowBlur
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

    renderFuture: function(ctx, points, elapsed) {
        const start = points[0], end = points[points.length-1];
        
        // 优化：减少 shadowBlur
        ctx.shadowBlur = 10; // 从20 降到 10
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
        const frameOffset = Math.floor(elapsed / 100) % 4; // 每100ms 变化一次
        
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
        const runnerT = (elapsed * 0.0048) % 1;  // 提速20% (0.004 * 1.2)
        const rx = start.x + (end.x - start.x) * runnerT;
        const ry = start.y + (end.y - start.y) * runnerT;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        
        // 使用简单的矩形代替变换
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 8; // 从15 降到 8
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

if (window.VisualFX && typeof window.VisualFX.register === 'function') {
    window.VisualFX.register('lines', LinesFX);
}
