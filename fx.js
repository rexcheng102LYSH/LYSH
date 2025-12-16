// ================= 视觉特效资源与引擎 (Visual Effects) =================

// SVG 图标库 (从 game.js 移出)
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

// 视觉特效引擎 (VisualFX Engine)
const VisualFX = {
    canvas: null,
    ctx: null,
    
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
        if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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

    // === 核心：连珠特效绘制 ===
    drawWinLine: function(lineCells, type) {
        if (!this.ctx || lineCells.length < 2) return;
        
        const points = lineCells.map(p => this.getCoords(p.r, p.c)).filter(p => p);
        if (points.length < 2) return;

        const ctx = this.ctx;
        ctx.save();
        
        if (type === 'default') {
            // 默认：优雅的绿色发光线
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[points.length-1].x, points[points.length-1].y);
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#00e676';
            ctx.shadowColor = '#00e676';
            ctx.shadowBlur = 15;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#fff';
            ctx.shadowBlur = 0;
            ctx.stroke();
        } 
        else if (type === 'lightning') {
            // === ⚡ 宙斯之怒：高级分形闪电 (v0.7.6.3 优化版) ===
            const start = points[0];
            const end = points[points.length-1];
            
            // 1. 中点位移算法 (Midpoint Displacement)
            // displace: 震动幅度，随着递归深度减小
            const createLightningPoints = (p1, p2, displace) => {
                if (displace < 2) return [p1, p2]; // 递归终止条件
                
                let midX = (p1.x + p2.x) / 2;
                let midY = (p1.y + p2.y) / 2;
                
                // 计算垂直于线段的方向向量，确保震动主要发生在垂直方向
                // 这样可以减少闪电在沿线方向的“回缩”，看起来更有冲劲
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                const normalX = -dy / len;
                const normalY = dx / len;

                // 施加偏移 (Range: -0.5 to 0.5 * displace)
                const offset = (Math.random() - 0.5) * displace;
                midX += normalX * offset;
                midY += normalY * offset;
                
                const mid = {x: midX, y: midY};
                
                // 递归：震动幅度衰减 (0.5 是平滑，0.6 是狂暴)
                const seg1 = createLightningPoints(p1, mid, displace * 0.55);
                const seg2 = createLightningPoints(mid, p2, displace * 0.55);
                
                return seg1.concat(seg2.slice(1));
            };

            // 2. 绘制闪电路径
            const drawBolt = (pts, width, alpha) => {
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for(let i=1; i<pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                ctx.lineWidth = width;
                // 电浆色：核心白 -> 外围蓝
                ctx.strokeStyle = `rgba(225, 245, 255, ${alpha})`; 
                ctx.stroke();
            };

            // 3. 生成主干 (降低震动幅度 80 -> 35，防止出界)
            const mainBolt = createLightningPoints(start, end, 35); 

            // 4. 渲染光晕系统 (Bloom)
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Layer 1: 大气辉光 (蓝色光晕)
            ctx.shadowColor = '#00B0FF'; 
            ctx.shadowBlur = 40;
            drawBolt(mainBolt, 6, 0.4); 
            
            // Layer 2: 电离层 (深蓝核心)
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#40C4FF';
            drawBolt(mainBolt, 3, 0.8);

            // Layer 3: 极亮核心 (纯白)
            ctx.shadowBlur = 0; // 核心不发光，保持锐利
            ctx.strokeStyle = '#FFFFFF';
            drawBolt(mainBolt, 1.5, 1.0);

            // 5. 生成分支 (Branches) - 增加细节
            // 只有主干足够长时才生成分支
            const totalDist = Math.hypot(end.x - start.x, end.y - start.y);
            const numBranches = Math.floor(totalDist / 50); // 每50px一个分支几率

            for (let i = 0; i < numBranches; i++) {
                // 随机选择主干上的一个点作为起点
                const idx = Math.floor(Math.random() * (mainBolt.length - 1));
                const root = mainBolt[idx];
                
                // 随机方向
                const angle = Math.random() * Math.PI * 2;
                const branchLen = 20 + Math.random() * 30; // 短分支
                const tip = {
                    x: root.x + Math.cos(angle) * branchLen,
                    y: root.y + Math.sin(angle) * branchLen
                };
                
                // 分支震动幅度小
                const branchPts = createLightningPoints(root, tip, 10);
                
                // 绘制分支 (较细，较暗)
                ctx.shadowBlur = 10;
                drawBolt(branchPts, 1, 0.5);
            }
        }
        else if (type === 'gold') {
            // 金黄：奢华流光
            const start = points[0];
            const end = points[points.length-1];
            const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
            grad.addColorStop(0, 'rgba(255, 215, 0, 0)');
            grad.addColorStop(0.2, 'rgba(255, 215, 0, 1)');
            grad.addColorStop(0.8, 'rgba(255, 223, 0, 1)');
            grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.lineWidth = 10;
            ctx.strokeStyle = grad;
            ctx.shadowColor = '#ffb300';
            ctx.shadowBlur = 25;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // 粒子火花
            ctx.fillStyle = '#fff';
            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
                ctx.fill();
            });
        }
        else if (type === 'future') {
            // 未来：赛博朋克霓虹
            const start = points[0];
            const end = points[points.length-1];
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.lineWidth = 14;
            ctx.strokeStyle = 'rgba(213, 0, 249, 0.3)'; // 外晕
            ctx.shadowColor = '#d500f9';
            ctx.shadowBlur = 20;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ea80fc'; // 核心
            ctx.stroke();
            
            // 连接点方块
            ctx.fillStyle = '#fff';
            points.forEach(p => {
                ctx.fillRect(p.x-3, p.y-3, 6, 6);
            });
        }
        
        ctx.restore();
    }
};