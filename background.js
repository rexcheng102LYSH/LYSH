/**
 * Project Lysh Visual Engine - Alpha 0.7.4.4
 * 更新内容：
 * 1. 修复春季太阳不可见问题 (Spring Sun Fix)
 * 2. 实装夏季动态特效：烈日、白云、彩虹、绿地、向日葵 (Summer Engine)
 */

window.BackgroundEngine = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    animationId: null,
    activeSeason: 'spring',
    time: 0, // 全局时间变量，用于呼吸效果和云朵移动

    // --- 春季粒子 ---
    drops: [],
    splashes: [],
    numDrops: 120,

    // --- 夏季对象 ---
    clouds: [],
    sunflowers: [],

    init: function() {
        this.canvas = document.getElementById('bgCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // 初始化启动
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
            // 秋冬暂未实装，保持清空
            this.clearCanvas();
        }
    },

    resize: function() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // 调整窗口时重置当前季节元素位置
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
        this.time += 0.01; // 时间流逝
        this.clearCanvas();

        if (this.activeSeason === 'spring') {
            this.updateSpring();
            this.drawSpring();
        } else if (this.activeSeason === 'summer') {
            this.updateSummer();
            this.drawSummer();
        }

        this.animationId = requestAnimationFrame(() => this.loop());
    },

    // =========================================
    // 🌸 春季逻辑 (Spring Logic) - 太阳雨
    // =========================================
    initSpring: function() {
        this.drops = [];
        for (let i = 0; i < this.numDrops; i++) this.drops.push(this.newDrop());
        this.splashes = [];
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

    updateSpring: function() {
        // 雨滴逻辑
        for (let i = 0; i < this.drops.length; i++) {
            const d = this.drops[i];
            d.y += d.speed;
            if (d.y > this.height) {
                this.createSplash(d.x, this.height);
                this.drops[i] = this.newDrop();
                this.drops[i].y = -this.drops[i].length;
            }
        }
        // 水花逻辑
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

    drawSpring: function() {
        // 1. 绘制强化的春日暖阳 (看得见的太阳)
        // 核心：左上角
        const cx = 0; 
        const cy = 0;
        const maxR = Math.max(this.width, this.height) * 0.8;

        // 外发光 (柔和)
        const glow = this.ctx.createRadialGradient(cx, cy, 50, cx, cy, maxR);
        glow.addColorStop(0, 'rgba(255, 255, 220, 0.6)');  // 更亮的中心
        glow.addColorStop(0.2, 'rgba(255, 245, 200, 0.3)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = glow;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 太阳本体 (实心圆球)
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 253, 208, 0.5)'; // 奶黄色半透明实体
        this.ctx.fill();
        
        // 2. 绘制雨滴
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

        // 3. 绘制水花
        this.splashes.forEach(s => {
            this.ctx.fillStyle = `rgba(33, 150, 243, ${s.life})`;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    },

    // =========================================
    // 🌻 夏季逻辑 (Summer Logic) - 烈日/云/彩虹/向日葵
    // =========================================
    initSummer: function() {
        // 1. 初始化云朵 (3-5朵)
        this.clouds = [];
        const cloudCount = 4;
        for(let i=0; i<cloudCount; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.3), // 只在天上
                size: 0.5 + Math.random() * 0.5,
                speed: 0.2 + Math.random() * 0.3
            });
        }

        // 2. 初始化向日葵 (根据屏幕宽度计算数量)
        this.sunflowers = [];
        const flowerCount = Math.floor(this.width / 60); 
        for(let i=0; i<flowerCount; i++) {
            this.sunflowers.push({
                x: (i * 60) + (Math.random() * 20),
                y: this.height - 20, // 地面位置
                height: 40 + Math.random() * 40,
                swayOffset: Math.random() * Math.PI * 2, // 摇摆相位
                petalColor: Math.random() > 0.5 ? '#FFD700' : '#FFC107'
            });
        }
    },

    updateSummer: function() {
        // 云朵移动
        this.clouds.forEach(c => {
            c.x += c.speed;
            if (c.x > this.width + 100) c.x = -100; // 循环
        });
    },

    drawSummer: function() {
        // 1. 湛蓝天空背景
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#4facfe'); // 亮蓝
        skyGrad.addColorStop(1, '#00f2fe'); // 浅青
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 2. 艳丽烈日 (右上角)
        const sunX = this.width * 0.85;
        const sunY = this.height * 0.15;
        const pulse = Math.sin(this.time * 2) * 5; // 呼吸效果

        // 烈日外晕 (热浪)
        const sunGlow = this.ctx.createRadialGradient(sunX, sunY, 40, sunX, sunY, 200 + pulse);
        sunGlow.addColorStop(0, 'rgba(255, 160, 0, 0.8)');
        sunGlow.addColorStop(0.4, 'rgba(255, 215, 0, 0.4)');
        sunGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
        this.ctx.fillStyle = sunGlow;
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, 300, 0, Math.PI*2);
        this.ctx.fill();

        // 烈日核心
        this.ctx.fillStyle = '#FFF59D'; // 白金核心
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'orange';
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, 50, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0; // 重置阴影

        // 3. 跨屏彩虹
        this.ctx.save();
        this.ctx.globalAlpha = 0.4;
        this.ctx.lineWidth = 40;
        // 彩虹路径：左下到右上的大弧线
        const rainbowR = Math.max(this.width, this.height) * 0.8;
        this.ctx.beginPath();
        this.ctx.arc(this.width/2, this.height + 100, rainbowR, Math.PI * 1.1, Math.PI * 1.9);
        
        // 七彩渐变
        const rainGrad = this.ctx.createLinearGradient(0, this.height, this.width, 0);
        rainGrad.addColorStop(0, 'red');
        rainGrad.addColorStop(0.2, 'orange');
        rainGrad.addColorStop(0.4, 'yellow');
        rainGrad.addColorStop(0.6, 'green');
        rainGrad.addColorStop(0.8, 'blue');
        rainGrad.addColorStop(1, 'violet');
        this.ctx.strokeStyle = rainGrad;
        this.ctx.stroke();
        this.ctx.restore();

        // 4. 白云
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(c => {
            this.drawCloud(c.x, c.y, c.size);
        });

        // 5. 绿地
        const groundHeight = 40;
        this.ctx.fillStyle = '#66BB6A'; // 鲜绿
        this.ctx.fillRect(0, this.height - groundHeight, this.width, groundHeight);
        // 草地高光条
        this.ctx.fillStyle = '#81C784';
        this.ctx.fillRect(0, this.height - groundHeight, this.width, 10);

        // 6. 向日葵
        this.sunflowers.forEach(f => {
            this.drawSunflower(f);
        });
    },

    // 辅助：画云朵 (由3个圆组成)
    drawCloud: function(x, y, scale) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
        this.ctx.arc(40, -10, 40, 0, Math.PI * 2);
        this.ctx.arc(80, 0, 30, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    },

    // 辅助：画动态向日葵
    drawSunflower: function(f) {
        const sway = Math.sin(this.time + f.swayOffset) * 5; // 随风摇摆
        const headX = f.x + sway;
        const headY = f.y - f.height;

        // 茎
        this.ctx.strokeStyle = '#388E3C';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(f.x, f.y);
        this.ctx.quadraticCurveTo(f.x, f.y - f.height / 2, headX, headY);
        this.ctx.stroke();

        // 葉子 (簡單畫兩筆)
        this.ctx.beginPath();
        this.ctx.moveTo(f.x, f.y - f.height * 0.4);
        this.ctx.quadraticCurveTo(f.x - 10, f.y - f.height * 0.5, f.x - 15, f.y - f.height * 0.6);
        this.ctx.stroke();

        // 花瓣 (画一圈圆)
        this.ctx.translate(headX, headY);
        this.ctx.fillStyle = f.petalColor;
        for(let i=0; i<8; i++) {
            this.ctx.rotate(Math.PI / 4);
            this.ctx.beginPath();
            this.ctx.ellipse(10, 0, 8, 3, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.resetTransform(); // 重置旋转

        // 花盘 (中心)
        this.ctx.fillStyle = '#5D4037'; // 深褐
        this.ctx.beginPath();
        this.ctx.arc(headX, headY, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }
};

window.addEventListener('load', () => {
    if (window.BackgroundEngine) {
        window.BackgroundEngine.init();
    }
});