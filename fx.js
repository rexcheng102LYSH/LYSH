// ================= 视觉特效资源与引擎 (Visual Effects & Art Assets) =================

/**
 * [Alpha 0.7.7.2] Vector Art Library
 * Introduction of Classic Black & White Stones (Vectorized).
 * High-contrast, scalable, and crash-proof (No ID conflicts).
 */

// 1. 棋子皮肤库 (The Pieces)
const PIECE_ICONS = {
    // 经典黑子：纯矢量，带高光
    classic_black: `
        <svg viewBox="0 0 512 512" fill="none" class="piece-svg">
            <circle cx="256" cy="256" r="230" fill="#111"/>
            <path d="M256 50 Q380 50 450 150" stroke="white" stroke-width="10" stroke-opacity="0.1" fill="none"/>
            <circle cx="180" cy="180" r="60" fill="white" fill-opacity="0.1"/>
        </svg>
    `,
    
    // 经典白子：纯矢量，带阴影
    classic_white: `
        <svg viewBox="0 0 512 512" fill="none" class="piece-svg">
            <circle cx="256" cy="256" r="230" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
            <circle cx="256" cy="256" r="210" fill="white"/>
            <path d="M100 400 Q256 500 412 400" stroke="#ccc" stroke-width="10" stroke-opacity="0.2" fill="none"/>
        </svg>
    `,

    // 自然落叶：纯色填充，无渐变
    nature_maple: `
        <svg viewBox="0 0 512 512" fill="none" class="piece-svg maple-piece">
            <g>
                <path d="M256 32 C250 32 230 80 220 110 C180 100 120 80 110 90 C105 95 120 140 130 160 C90 150 40 130 30 140 C20 150 60 200 80 220 C50 210 20 200 10 215 C0 230 50 260 80 280 C60 290 20 310 30 330 C40 350 90 320 120 300 C110 340 100 400 110 410 C120 420 150 360 170 320 C180 360 190 420 200 430 C210 440 230 380 240 340 L250 480 C252 490 260 490 262 480 L272 340 C282 380 302 440 312 430 C322 420 332 360 342 320 C362 360 392 420 402 410 C412 400 402 340 392 300 C422 320 472 350 482 330 C492 310 452 290 432 280 C462 260 512 230 502 215 C492 200 462 210 432 220 C452 200 492 150 482 140 C472 130 422 150 382 160 C392 140 407 95 402 90 C392 80 332 100 292 110 C282 80 262 32 256 32 Z" 
                fill="#d32f2f" stroke="#8e0000" stroke-width="12" stroke-linejoin="round"/>
                <path d="M256 480 L256 180 M256 300 L180 240 M256 300 L332 240 M180 240 L130 180 M332 240 L382 180" 
                stroke="#8e0000" stroke-width="8" stroke-linecap="round"/>
            </g>
        </svg>
    `,
    
    // 自然生辉：纯色填充，无渐变
    nature_sun: `
        <svg viewBox="0 0 512 512" fill="none" class="piece-svg sun-piece">
            <g>
                <path d="M256 20 L256 80 M256 432 L256 492 M492 256 L432 256 M80 256 L20 256 
                         M422 90 L380 132 M132 380 L90 422 
                         M422 422 L380 380 M132 132 L90 90" 
                      stroke="#fbc02d" stroke-width="40" stroke-linecap="round"/>
                <circle cx="256" cy="256" r="130" fill="#fbc02d" stroke="#f57f17" stroke-width="10"/>
                <circle cx="256" cy="256" r="100" stroke="#fff" stroke-width="8" stroke-opacity="0.6" fill="none"/>
            </g>
        </svg>
    `
};

// 2. 技能图标库 (Skill Icons - High Fidelity)
const SKILL_ICONS = {
    double: '<svg viewBox="0 0 64 64" fill="none"><circle cx="24" cy="24" r="14" fill="#E0E0E0" stroke="currentColor" stroke-width="3"/><circle cx="40" cy="40" r="14" fill="currentColor" stroke="white" stroke-width="3"/><path d="M48 20 L56 12 M52 24 L58 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    voodoo: '<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="36" r="18" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="3"/><circle cx="26" cy="32" r="2" fill="currentColor"/><path d="M36 30 L40 34 M36 34 L40 30" stroke="currentColor" stroke-width="2"/><path d="M26 44 Q32 48 38 44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 10 L24 24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="10" cy="10" r="3" fill="currentColor"/></svg>',
    move_self: '<svg viewBox="0 0 64 64" fill="none"><circle cx="20" cy="32" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/><path d="M32 32 L46 32" stroke="currentColor" stroke-width="3" marker-end="url(#arrow)"/><circle cx="50" cy="32" r="10" fill="currentColor"/><path d="M44 26 L50 32 L44 38" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    move_enemy: '<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="42" r="10" stroke="currentColor" stroke-width="3"/><path d="M16 10 L24 28 M48 10 L40 28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M20 28 Q32 36 44 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    zone: '<svg viewBox="0 0 64 64" fill="none"><rect x="12" y="12" width="40" height="40" rx="4" stroke="currentColor" stroke-width="3"/><path d="M25 12 V52 M39 12 V52 M12 25 H52 M12 39 H52" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.5"/><rect x="26" y="26" width="12" height="12" fill="currentColor"/></svg>',
    bomb: '<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="38" r="16" fill="currentColor"/><path d="M32 22 V14 M32 14 Q42 14 46 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M46 16 L50 12 M50 20 L54 22 M44 10 L46 6" stroke="#ff5252" stroke-width="2"/></svg>',
    god_hand: '<svg viewBox="0 0 64 64" fill="none"><path d="M32 54 V40 M20 30 Q20 10 32 10 Q44 10 44 30" stroke="currentColor" stroke-width="3"/><path d="M20 30 L20 40 Q20 46 26 46 H38 Q44 46 44 40 L44 30" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="24" r="4" fill="currentColor"/></svg>',
    chaos: '<svg viewBox="0 0 64 64" fill="none"><path d="M32 6 L56 18 V46 L32 58 L8 46 V18 Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" fill="currentColor" fill-opacity="0.1"/><path d="M32 6 V30 M56 18 L32 30 L8 18" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="18" r="2" fill="currentColor"/><circle cx="20" cy="36" r="2" fill="currentColor"/><circle cx="44" cy="36" r="2" fill="currentColor"/></svg>',
    short_battle: '<svg viewBox="0 0 64 64" fill="none"><path d="M12 52 L52 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M12 12 L52 52" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M10 48 L16 54 M48 10 L54 16" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M10 16 L16 10 M48 54 L54 48" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>',
    swap: '<svg viewBox="0 0 64 64" fill="none"><path d="M16 32 A 16 16 0 0 1 48 32" stroke="currentColor" stroke-width="3" fill="none" marker-end="url(#arrow)"/><path d="M48 32 A 16 16 0 0 1 16 32" stroke="currentColor" stroke-width="3" fill="none" transform="rotate(180 32 32)"/><path d="M44 26 L48 32 L44 38" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 38 L16 32 L20 26" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

// 视觉特效引擎 (VisualFX Engine) - Alpha 0.7.7.2
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

    // --- Renderers ---
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