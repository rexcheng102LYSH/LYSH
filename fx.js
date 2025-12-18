// ================= 视觉特效引擎 (Visual Effects) =================

/**
 * [Alpha 0.7.7.7] Infrastructure Fix
 * - Removed all Icon Data (Now powered by assets.js)
 * - Strictly handles Particle/Canvas/Logic only.
 */

const VisualFX = {
    canvas: null,
    ctx: null,
    animationId: null,
    particles: [], 
    
    init: function() {
        this.canvas = document.getElementById('fxCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }
    },

    resize: function() {
        if (!this.canvas) return;
        const wrapper = document.querySelector('.board-wrapper');
        if (wrapper) {
            this.canvas.width = wrapper.offsetWidth;
            this.canvas.height = wrapper.offsetHeight;
        }
    },

    clear: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = [];
    },

    getCoords: function(r, c) {
        const cell = document.getElementById(`c-${r}-${c}`);
        const wrapper = document.querySelector('.board-wrapper');
        if (!cell || !wrapper) return null;
        const cRect = cell.getBoundingClientRect();
        const wRect = wrapper.getBoundingClientRect();
        return {
            x: cRect.left - wRect.left + cRect.width / 2,
            y: cRect.top - wRect.top + cRect.height / 2
        };
    },

    drawWinLine: function(lineCells, type) {
        if (!this.ctx || lineCells.length < 2) return;
        this.clear();
        const points = lineCells.map(p => this.getCoords(p.r, p.c)).filter(p => p);
        if (points.length < 2) return;
        this.startAnimation(points, type);
    },

    startAnimation: function(points, type) {
        let startTime = performance.now();
        let lightningData = null;
        if (type === 'lightning') {
            lightningData = this.generateLightningPath(points[0], points[points.length-1], 35);
        }
        if (type === 'default' || type === 'gold') {
            for(let i=0; i<30; i++) {
                this.particles.push({
                    t: Math.random(), 
                    offset: (Math.random() - 0.5) * 20, 
                    speed: 0.002 + Math.random() * 0.005,
                    size: Math.random() * 3 + 1,
                    life: Math.random() * Math.PI * 2,
                    blinkSpeed: 0.05 + Math.random() * 0.1
                });
            }
        }

        const loop = (now) => {
            const elapsed = now - startTime;
            if (elapsed > 2000) return; 
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (type === 'default') this.renderDefault(points, elapsed);
            else if (type === 'lightning') this.renderLightning(points, lightningData, elapsed);
            else if (type === 'gold') this.renderGold(points, elapsed);
            else if (type === 'future') this.renderFuture(points, elapsed);

            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    },

    renderDefault: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0];
        const end = points[points.length-1];
        const breath = (Math.sin(elapsed * 0.005) + 1) * 0.5; 
        
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 6 + breath * 4;
        ctx.strokeStyle = '#00e676';
        ctx.shadowColor = '#69f0ae';
        ctx.shadowBlur = 15 + breath * 10;
        ctx.stroke();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#e8f5e9';
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.fillStyle = '#b9f6ca';
        this.particles.forEach(p => {
            p.t += p.speed;
            if(p.t > 1) p.t = 0;
            const px = start.x + (end.x - start.x) * p.t;
            const py = start.y + (end.y - start.y) * p.t;
            const floatY = p.offset - (elapsed * 0.02); 
            const alpha = (Math.sin(elapsed * p.blinkSpeed + p.life) + 1) * 0.5;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(px, py + floatY, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    },

    renderLightning: function(points, data, elapsed) {
        const ctx = this.ctx;
        if (Math.random() > 0.85) return; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const drawPath = (pathData, width, color, blur, alpha) => {
            ctx.beginPath();
            ctx.moveTo(pathData.main[0].x, pathData.main[0].y);
            pathData.main.forEach(p => ctx.lineTo(p.x, p.y));
            pathData.branches.forEach(branch => {
                ctx.moveTo(branch[0].x, branch[0].y);
                branch.forEach(p => ctx.lineTo(p.x, p.y));
            });
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = blur ? '#03a9f4' : 'transparent';
            ctx.shadowBlur = blur;
            ctx.stroke();
        };
        const flicker = 0.8 + Math.random() * 0.2;
        drawPath(data, 6, '#00B0FF', 40, 0.4 * flicker);
        drawPath(data, 3, '#40C4FF', 20, 0.8 * flicker);
        drawPath(data, 1.5, '#FFFFFF', 0, 1.0 * flicker);
        ctx.globalAlpha = 1; 
    },

    generateLightningPath: function(start, end, displace) {
        const createPts = (p1, p2, dis) => {
            if (dis < 2) return [p1, p2];
            let midX = (p1.x + p2.x) / 2;
            let midY = (p1.y + p2.y) / 2;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const normalX = -dy / len;
            const normalY = dx / len;
            const offset = (Math.random() - 0.5) * dis;
            midX += normalX * offset;
            midY += normalY * offset;
            const mid = {x: midX, y: midY};
            const seg1 = createPts(p1, mid, dis * 0.55);
            const seg2 = createPts(mid, p2, dis * 0.55);
            return seg1.concat(seg2.slice(1));
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
        const start = points[0];
        const end = points[points.length-1];
        const shift = (elapsed * 0.0015) % 1; 
        const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        grad.addColorStop(0, '#FFC107'); 
        grad.addColorStop(Math.max(0, shift - 0.15), '#FFD54F');
        grad.addColorStop(shift, '#FFFFFF'); 
        grad.addColorStop(Math.min(1, shift + 0.15), '#FFD54F');
        grad.addColorStop(1, '#FFC107');
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.4)';
        ctx.shadowColor = '#FF6F00';
        ctx.shadowBlur = 25;
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.strokeStyle = grad;
        ctx.shadowBlur = 5;
        ctx.stroke();
        this.particles.forEach(p => {
            const twinkle = Math.abs(Math.sin(elapsed * p.blinkSpeed * 2));
            if (twinkle < 0.2) return;
            const t = p.t; 
            const px = start.x + (end.x - start.x) * t + p.offset;
            const py = start.y + (end.y - start.y) * t + p.offset;
            ctx.fillStyle = '#FFF';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFF';
            const size = p.size * twinkle * 1.5;
            ctx.beginPath();
            ctx.moveTo(px, py - size);
            ctx.quadraticCurveTo(px, py, px + size, py);
            ctx.quadraticCurveTo(px, py, px, py + size);
            ctx.quadraticCurveTo(px, py, px - size, py);
            ctx.quadraticCurveTo(px, py, px, py - size);
            ctx.fill();
        });
    },

    renderFuture: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0];
        const end = points[points.length-1];
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ea80fc';
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(224, 64, 251, 0.3)';
        ctx.stroke();
        const segments = 12;
        const dx = (end.x - start.x) / segments;
        const dy = (end.y - start.y) / segments;
        ctx.beginPath();
        for (let i = 0; i < segments; i++) {
            const sX = start.x + dx * i;
            const sY = start.y + dy * i;
            const eX = start.x + dx * (i+1);
            const eY = start.y + dy * (i+1);
            let offsetX = 0, offsetY = 0;
            if (Math.random() > 0.85) { 
                offsetX = (Math.random() - 0.5) * 15;
                offsetY = (Math.random() - 0.5) * 15;
            }
            ctx.moveTo(sX + offsetX, sY + offsetY);
            ctx.lineTo(eX + offsetX, eY + offsetY);
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = Math.random() > 0.5 ? '#00e5ff' : '#d500f9';
        ctx.stroke();
        const speed = 0.004;
        const runnerT = (elapsed * speed) % 1;
        const rx = start.x + (end.x - start.x) * runnerT;
        const ry = start.y + (end.y - start.y) * runnerT;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(Math.atan2(end.y - start.y, end.x - start.x));
        ctx.fillRect(-10, -3, 20, 6);
        ctx.restore();
    }
};