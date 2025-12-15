/**
 * Project Lysh Visual Engine - Alpha 0.7.4.3
 * 修复版：显式挂载到 window，确保 game.js 能找到它
 */

// 🔴 关键修改：把 const 改为 window.BackgroundEngine = 
window.BackgroundEngine = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    drops: [],
    splashes: [],
    numDrops: 120, 
    animationId: null,
    activeSeason: 'spring', // 默认季节状态

    init: function() {
        this.canvas = document.getElementById('bgCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // 只有春季才启动特效，其他季节默认静止
        if (this.activeSeason === 'spring') {
            this.createDrops();
            this.start();
        }
    },

    // 切换季节接口
    switchSeason: function(season) {
        this.activeSeason = season;
        
        // 1. 先停止当前的动画循环
        this.stop();

        // 2. 根据季节决定行为
        if (season === 'spring') {
            this.createDrops(); // 重置雨滴
            this.start();       // 启动引擎
        } else {
            // 夏/秋/冬目前没有特效，直接清空画布
            this.clearCanvas();
        }
    },

    resize: function() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        // 如果不是春季，调整窗口大小时也要保持画布干净
        if (this.activeSeason !== 'spring') {
            this.clearCanvas();
        }
    },

    clearCanvas: function() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    },

    createDrops: function() {
        this.drops = [];
        for (let i = 0; i < this.numDrops; i++) {
            this.drops.push(this.newDrop());
        }
    },

    newDrop: function() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height - this.height,
            length: Math.random() * 25 + 15,
            speed: Math.random() * 8 + 8,
            width: Math.random() * 1.5 + 0.5
        };
    },

    createSplash: function(x, y) {
        const count = Math.floor(Math.random() * 3) + 3;
        for(let i=0; i<count; i++) {
            this.splashes.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: -(Math.random() * 3 + 1),
                life: 1.0,
                radius: Math.random() * 1.5 + 0.5
            });
        }
    },

    draw: function() {
        // 每一帧都先清空
        this.clearCanvas();
        
        // --- 1. 绘制左上角“春日暖阳” ---
        const sunRadius = Math.max(this.width, this.height) * 0.9;
        const sunGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, sunRadius);
        sunGrad.addColorStop(0, 'rgba(255, 255, 235, 0.35)'); 
        sunGrad.addColorStop(0.3, 'rgba(255, 245, 210, 0.15)');
        sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');     
        this.ctx.fillStyle = sunGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // --- 2. 绘制雨滴 ---
        this.ctx.lineCap = 'round';
        this.drops.forEach(d => {
            const grad = this.ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.length);
            grad.addColorStop(0, 'rgba(66, 165, 245, 0)');
            grad.addColorStop(1, 'rgba(33, 150, 243, 0.8)');
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = d.width;
            this.ctx.beginPath();
            this.ctx.moveTo(d.x, d.y);
            this.ctx.lineTo(d.x, d.y + d.length);
            this.ctx.stroke();
        });

        // --- 3. 绘制水花 ---
        this.splashes.forEach(s => {
            this.ctx.fillStyle = `rgba(33, 150, 243, ${s.life})`;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    },

    update: function() {
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
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.2;
            s.life -= 0.05;
            if (s.life <= 0) this.splashes.splice(i, 1);
        }
    },

    loop: function() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    start: function() {
        // 防止重复启动
        if (!this.animationId) this.loop();
    },

    stop: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};

window.addEventListener('load', () => {
    // 🔴 关键修改：显式调用 window 下的对象
    if (window.BackgroundEngine) {
        window.BackgroundEngine.init();
    }
});