// ================= 视觉特效资源与引擎 (Visual Effects) =================

// SVG 图标库
const SKILL_ICONS = {
    double: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13l-5-5L15 2l5 5-10 6z"/><path d="M14 17l-5-5L19 6l5 5-10 6z"/><path d="M4 22l6-6"/></svg>',
    voodoo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 13s1.5 1.5 3 0 3 0"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>',
    move_self: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="3"/><path d="M8 12h11"/><path d="M16 9l3 3-3 3"/></svg>',
    move_enemy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M12 12l9 9"/><path d="M16 16l5 5"/></svg>',
    zone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>',
    bomb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="13" r="9"/><path d="M11 4v-1"/><path d="M11 4h2"/><path d="M22 2l-3 3"/><path d="M14.5 9.5L19 5"/></svg>',
    god_hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>',
    chaos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="12" cy="12" r="1"/></svg>',
    short_battle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><line x1="8" y1="8" x2="4" y2="4"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v-3a3 3 0 0 1 3-3h13m-3-3l3 3-3 3"/><path d="M20 12v3a3 3 0 0 1-3 3H4m3 3l-3-3 3-3"/></svg>'
};

// 视觉特效引擎 (VisualFX Engine) - Alpha 0.7.6.4 (Animated)
const VisualFX = {
    canvas: null,
    ctx: null,
    animationId: null,
    particles: [], // 粒子池
    
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

    // === 绘图入口 ===
    drawWinLine: function(lineCells, type) {
        if (!this.ctx || lineCells.length < 2) return;
        this.clear(); // 停止旧动画

        const points = lineCells.map(p => this.getCoords(p.r, p.c)).filter(p => p);
        if (points.length < 2) return;

        // 启动动画循环
        this.startAnimation(points, type);
    },

    // === 动画控制器 ===
    startAnimation: function(points, type) {
        let startTime = performance.now();
        
        // 预处理：如果是闪电，生成一次路径数据（保持 0.7.6.3 的形态）
        let lightningData = null;
        if (type === 'lightning') {
            lightningData = this.generateLightningPath(points[0], points[points.length-1], 35);
        }

        // 预处理：初始化粒子
        if (type === 'default' || type === 'gold') {
            for(let i=0; i<30; i++) { // 增加粒子数量
                this.particles.push({
                    t: Math.random(), 
                    offset: (Math.random() - 0.5) * 20, // 扩散范围
                    speed: 0.002 + Math.random() * 0.005,
                    size: Math.random() * 3 + 1,
                    life: Math.random() * Math.PI * 2,
                    blinkSpeed: 0.05 + Math.random() * 0.1
                });
            }
        }

        const loop = (now) => {
            const elapsed = now - startTime;
            if (elapsed > 2000) return; // 2秒后自动结束

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (type === 'default') this.renderDefault(points, elapsed);
            else if (type === 'lightning') this.renderLightning(points, lightningData, elapsed);
            else if (type === 'gold') this.renderGold(points, elapsed);
            else if (type === 'future') this.renderFuture(points, elapsed);

            this.animationId = requestAnimationFrame(loop);
        };
        
        this.animationId = requestAnimationFrame(loop);
    },

    // --- 1. 默认 (森之灵) ---
    renderDefault: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0];
        const end = points[points.length-1];
        
        // 呼吸线
        const breath = (Math.sin(elapsed * 0.005) + 1) * 0.5; 
        
        ctx.lineCap = 'round';
        // 辉光
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 6 + breath * 4;
        ctx.strokeStyle = '#00e676';
        ctx.shadowColor = '#69f0ae';
        ctx.shadowBlur = 15 + breath * 10;
        ctx.stroke();
        
        // 核心
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#e8f5e9';
        ctx.shadowBlur = 0;
        ctx.stroke();

        // 漂浮孢子
        ctx.fillStyle = '#b9f6ca';
        this.particles.forEach(p => {
            p.t += p.speed; // 沿线移动
            if(p.t > 1) p.t = 0;
            
            const px = start.x + (end.x - start.x) * p.t;
            const py = start.y + (end.y - start.y) * p.t;
            
            // 垂直漂浮 (上升感)
            const floatY = p.offset - (elapsed * 0.02); 
            
            const alpha = (Math.sin(elapsed * p.blinkSpeed + p.life) + 1) * 0.5;
            
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(px, py + floatY, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    },

    // --- 2. 闪电 (宙斯之怒 - 完美复刻版) ---
    renderLightning: function(points, data, elapsed) {
        const ctx = this.ctx;
        
        // 频闪特效：偶尔消失，模拟真实雷电的视觉残留
        if (Math.random() > 0.85) return; 

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const drawPath = (pathData, width, color, blur, alpha) => {
            ctx.beginPath();
            ctx.moveTo(pathData.main[0].x, pathData.main[0].y);
            pathData.main.forEach(p => ctx.lineTo(p.x, p.y));
            
            // 绘制分支
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

        // 完美复刻 0.7.6.3 的三层渲染 + 动态透明度抖动
        const flicker = 0.8 + Math.random() * 0.2;

        // Layer 1: 大气辉光 (Atmosphere)
        drawPath(data, 6, '#00B0FF', 40, 0.4 * flicker);
        
        // Layer 2: 电离层 (Ionization)
        drawPath(data, 3, '#40C4FF', 20, 0.8 * flicker);

        // Layer 3: 极亮核心 (Core)
        drawPath(data, 1.5, '#FFFFFF', 0, 1.0 * flicker);
        
        ctx.globalAlpha = 1; // 重置
    },

    // 生成闪电几何数据 (复用 0.7.6.3 算法)
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

        const main = createPts(start, end, displace); // displace 35, 收束不越界
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

    // --- 3. 金黄 (财宝流光) ---
    renderGold: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0];
        const end = points[points.length-1];

        // 动态流光：光带快速扫过
        const shift = (elapsed * 0.0015) % 1; 
        const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        
        grad.addColorStop(0, '#FFC107'); // 深金
        // 高光带
        grad.addColorStop(Math.max(0, shift - 0.15), '#FFD54F');
        grad.addColorStop(shift, '#FFFFFF'); // 纯白高光
        grad.addColorStop(Math.min(1, shift + 0.15), '#FFD54F');
        grad.addColorStop(1, '#FFC107');

        ctx.lineCap = 'round';
        
        // 辉光层
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.4)';
        ctx.shadowColor = '#FF6F00';
        ctx.shadowBlur = 25;
        ctx.stroke();

        // 实体层
        ctx.lineWidth = 6;
        ctx.strokeStyle = grad;
        ctx.shadowBlur = 5;
        ctx.stroke();

        // 十字星光粒子 (Star Sparkles)
        this.particles.forEach(p => {
            const twinkle = Math.abs(Math.sin(elapsed * p.blinkSpeed * 2));
            if (twinkle < 0.2) return;

            const t = p.t; 
            const px = start.x + (end.x - start.x) * t + p.offset;
            const py = start.y + (end.y - start.y) * t + p.offset;

            ctx.fillStyle = '#FFF';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFF';
            
            // 绘制四角星
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

    // --- 4. 未来 (信号干扰) ---
    renderFuture: function(points, elapsed) {
        const ctx = this.ctx;
        const start = points[0];
        const end = points[points.length-1];
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ea80fc';
        
        // 1. 基础激光束
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(224, 64, 251, 0.3)';
        ctx.stroke();

        // 2. Glitch 故障线段
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
            // 随机故障位移
            if (Math.random() > 0.85) { 
                offsetX = (Math.random() - 0.5) * 15;
                offsetY = (Math.random() - 0.5) * 15;
            }

            ctx.moveTo(sX + offsetX, sY + offsetY);
            ctx.lineTo(eX + offsetX, eY + offsetY);
        }
        ctx.lineWidth = 2;
        // 颜色在青色和紫色之间剧烈切换
        ctx.strokeStyle = Math.random() > 0.5 ? '#00e5ff' : '#d500f9';
        ctx.stroke();

        // 3. 数据包传输 (高速移动的矩形)
        const speed = 0.004;
        const runnerT = (elapsed * speed) % 1;
        const rx = start.x + (end.x - start.x) * runnerT;
        const ry = start.y + (end.y - start.y) * runnerT;
        
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
        // 绘制长条形数据包
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(Math.atan2(end.y - start.y, end.x - start.x));
        ctx.fillRect(-10, -3, 20, 6);
        ctx.restore();
    }
};