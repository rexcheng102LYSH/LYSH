/**
 * Project Lysh Visual Engine - Alpha 0.7.4.5 (Rainbow Position Fix)
 * * [彩虹修正] 
 * 保留高饱和度色彩。
 * 暴力下压圆心位置 (cy)，让彩虹只在屏幕下半部分露出拱顶。
 * 调整半径比例，确保它是拱形而非平坡。
 */

window.BackgroundEngine = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    animationId: null,
    activeSeason: 'spring',
    time: 0, 

    // === 统一天体坐标 ===
    sunX: 0,
    sunY: 0,

    // === 粒子/对象 ===
    drops: [],
    splashes: [],
    numDrops: 120,
    clouds: [],

    init: function() {
        this.canvas = document.getElementById('bgCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.switchSeason(this.activeSeason);
    },

    switchSeason: function(season) {
        this.activeSeason = season;
        this.stop();
        this.clearCanvas();
        this.time = 0;

        if (season === 'spring') {
            this.initSpring();
            this.start();
        } else if (season === 'summer') {
            this.initSummer();
            this.start();
        } else {
            this.clearCanvas();
        }
    },

    resize: function() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // 统一太阳位置 (左侧 15%, 上方 18%)
        this.sunX = this.width * 0.15;
        this.sunY = this.height * 0.18;

        if (this.activeSeason === 'spring') {
            this.drops = [];
            this.initSpring();
        } else if (this.activeSeason === 'summer') {
            this.initSummer();
        }
    },

    clearCanvas: function() {
        if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
    },

    start: function() {
        if (!this.animationId) this.loop();
    },

    stop: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    loop: function() {
        this.time += 0.01;
        this.clearCanvas();

        this.drawSkyBackground();

        if (this.activeSeason === 'spring') {
            this.drawSpringSun();
            this.updateClouds();
            this.drawClouds();
            this.updateSpringRain();
            this.drawSpringRain();
        } else if (this.activeSeason === 'summer') {
            // 绘制顺序：彩虹 -> 烈日 -> 云
            this.drawRainbow(); 
            this.drawSummerSun(); 
            this.updateClouds();
            this.drawClouds();
        }

        this.animationId = requestAnimationFrame(() => this.loop());
    },

    // =========================================
    // 🎨 背景绘制
    // =========================================
    drawSkyBackground: function() {
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        if (this.activeSeason === 'spring') {
            grad.addColorStop(0, '#E6E9F0'); 
            grad.addColorStop(1, '#EEF1F5');
        } else if (this.activeSeason === 'summer') {
            grad.addColorStop(0, '#2980B9'); 
            grad.addColorStop(1, '#6DD5FA'); 
        } else {
            grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#eee');
        }
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // =========================================
    // 🌈 终极彩虹 (Lowered Arch)
    // =========================================
    drawRainbow: function() {
        const ctx = this.ctx;
        
        // 1. 半径控制：屏幕宽度的 60%
        // 这保证了它有足够的弧度，是个拱门，不是平地
        const radius = this.width * 0.6;
        
        // 2. 圆心下压：屏幕底部 + 半径的 45%
        // 这意味着圆的大部分都在屏幕下面，只有顶部露出
        // 露出的高度大约是屏幕高度的 30%-40% 左右，正好在下方
        const cx = this.width * 0.5;
        const cy = this.height + (radius * 0.45); 

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // 3. 色彩 (保持你满意的鲜艳度)
        const colors = [
            'hsla(0, 100%, 55%, 0.65)',    // 红
            'hsla(30, 100%, 55%, 0.65)',   // 橙
            'hsla(60, 100%, 55%, 0.65)',   // 黄
            'hsla(120, 100%, 55%, 0.65)',  // 绿
            'hsla(200, 100%, 55%, 0.65)',  // 蓝
            'hsla(270, 100%, 55%, 0.65)',  // 靛
            'hsla(300, 100%, 55%, 0.65)'   // 紫
        ];

        const thickness = 22; 
        
        colors.forEach((color, i) => {
            ctx.beginPath();
            // 完整半圆，确保两端扎地
            ctx.arc(cx, cy, radius - (i * thickness), Math.PI, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            
            // 梦幻光晕
            ctx.shadowColor = color;
            ctx.shadowBlur = 50; 
            
            ctx.stroke();
        });

        ctx.restore();
    },

    // =========================================
    // 🌞 太阳系统 (保持不变)
    // =========================================
    drawSpringSun: function() {
        const ctx = this.ctx;
        const glow = ctx.createRadialGradient(this.sunX, this.sunY, 50, this.sunX, this.sunY, 150);
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(this.sunX, this.sunY, 150, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#FFFDE7'; 
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath(); ctx.arc(this.sunX, this.sunY, 55, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    },

    drawSummerSun: function() {
        const ctx = this.ctx;
        const pulse = Math.sin(this.time * 1.5) * 8; 
        
        const heat = ctx.createRadialGradient(this.sunX, this.sunY, 60, this.sunX, this.sunY, 200 + pulse);
        heat.addColorStop(0, 'rgba(255, 200, 0, 0.4)');
        heat.addColorStop(1, 'rgba(255, 255, 0, 0)');
        ctx.fillStyle = heat;
        ctx.beginPath(); ctx.arc(this.sunX, this.sunY, 300, 0, Math.PI*2); ctx.fill();

        const coreGlow = ctx.createRadialGradient(this.sunX, this.sunY, 50, this.sunX, this.sunY, 120 + pulse * 0.5);
        coreGlow.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        coreGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath(); ctx.arc(this.sunX, this.sunY, 150, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#FFF'; 
        ctx.shadowBlur = 40 + pulse;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath(); ctx.arc(this.sunX, this.sunY, 65, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    },

    // =========================================
    // ☁️ 云朵 (保持不变)
    // =========================================
    createCloud: function(type, randomX) {
        const puffs = [];
        const puffCount = type === 'spring' ? 3 : 6;
        const scaleY = type === 'spring' ? 0.6 : 1.0; 
        
        for(let i=0; i<puffCount; i++) {
            puffs.push({
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 40,
                r: 30 + Math.random() * 30
            });
        }
        return {
            x: randomX ? Math.random() * this.width : -200,
            y: Math.random() * (this.height * 0.35),
            scale: (0.5 + Math.random() * 0.5),
            speed: (type === 'spring' ? 0.1 : 0.3) + Math.random() * 0.2,
            puffs: puffs,
            opacity: type === 'spring' ? 0.4 : 0.9,
            scaleY: scaleY 
        };
    },

    initSpring: function() {
        this.drops = [];
        for (let i = 0; i < this.numDrops; i++) this.drops.push(this.newDrop());
        this.splashes = [];
        this.clouds = [];
        for(let i=0; i<6; i++) this.clouds.push(this.createCloud('spring', true));
    },

    initSummer: function() {
        this.clouds = [];
        for(let i=0; i<5; i++) this.clouds.push(this.createCloud('summer', true));
    },

    updateClouds: function() {
        this.clouds.forEach((c, index) => {
            c.x += c.speed;
            if (c.x > this.width + 200) {
                const type = this.activeSeason === 'spring' ? 'spring' : 'summer';
                this.clouds[index] = this.createCloud(type, false);
            }
        });
    },

    drawClouds: function() {
        const ctx = this.ctx;
        this.clouds.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(c.scale, c.scale * c.scaleY);
            ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
            c.puffs.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        });
    },

    // =========================================
    // 💧 雨水 (保持不变)
    // =========================================
    newDrop: function() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height - this.height,
            length: Math.random() * 25 + 15,
            speed: Math.random() * 8 + 8,
            width: Math.random() * 1.5 + 0.5
        };
    },

    updateSpringRain: function() {
        for (let i = 0; i < this.drops.length; i++) {
            const d = this.drops[i];
            d.y += d.speed;
            if (d.y > this.height) {
                this.createSplash(d.x, this.height);
                this.drops[i] = this.newDrop();
                this.drops[i].y = -this.drops[i].length;
            }
        }
        for (let i = this.splashes.length - 1; i >= 0; i--) {
            const s = this.splashes[i];
            s.x += s.vx; s.y += s.vy; s.vy += 0.2; s.life -= 0.05;
            if (s.life <= 0) this.splashes.splice(i, 1);
        }
    },

    createSplash: function(x, y) {
        const count = Math.floor(Math.random() * 3) + 3;
        for(let i=0; i<count; i++) {
            this.splashes.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: -(Math.random() * 3 + 1),
                life: 1.0, radius: Math.random() * 1.5 + 0.5
            });
        }
    },

    drawSpringRain: function() {
        const ctx = this.ctx;
        ctx.lineCap = 'round';
        this.drops.forEach(d => {
            const grad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.length);
            grad.addColorStop(0, 'rgba(66, 165, 245, 0)');
            grad.addColorStop(1, 'rgba(33, 150, 243, 0.8)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = d.width;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x, d.y + d.length);
            ctx.stroke();
        });
        this.splashes.forEach(s => {
            ctx.fillStyle = `rgba(33, 150, 243, ${s.life})`;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
        });
    }
};

window.addEventListener('load', () => {
    if (window.BackgroundEngine) {
        window.BackgroundEngine.init();
    }
});