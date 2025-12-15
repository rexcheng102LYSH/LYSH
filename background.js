/**
 * Project Lysh Visual Engine - Alpha 0.7.4.7 (Winter Snow)
 * * [冬雪实装]
 * 1. 太阳：沿用春日暖阳参数 (奶黄+柔光)，在冷色背景下提供温暖对比。
 * 2. 天空：极夜蓝 (Deep Night Blue) -> 雾霾蓝渐变，高对比度。
 * 3. 雪花：静谧垂直飘落，带轻微正弦摇摆，三层景深 (大小/速度/模糊)。
 * 4. 积雪：屏幕底部绘制起伏的白色雪堆，模拟积雪地面。
 * * [其他] 保留春夏秋所有特效逻辑。
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
    leaves: [],
    snowflakes: [], // 冬雪数组

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

        // 清空所有对象
        this.drops = [];
        this.splashes = [];
        this.clouds = [];
        this.leaves = [];
        this.snowflakes = [];

        if (season === 'spring') {
            this.initSpring();
            this.start();
        } else if (season === 'summer') {
            this.initSummer();
            this.start();
        } else if (season === 'autumn') {
            this.initAutumn();
            this.start();
        } else if (season === 'winter') {
            this.initWinter();
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

        if (this.activeSeason === 'spring') this.initSpring();
        else if (this.activeSeason === 'summer') this.initSummer();
        else if (this.activeSeason === 'autumn') this.initAutumn();
        else if (this.activeSeason === 'winter') this.initWinter();
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
            this.drawRainbow(); 
            this.drawSummerSun(); 
            this.updateClouds();
            this.drawClouds();
        } else if (this.activeSeason === 'autumn') {
            this.drawAutumnSun();   
            this.updateClouds();    
            this.drawClouds();      
            this.updateAutumnLeaves(); 
            this.drawAutumnLeaves();   
        } else if (this.activeSeason === 'winter') {
            // 冬：暖阳 -> 积雪 -> 雪花
            // 直接复用春日暖阳 (你要求的健康太阳)
            this.drawSpringSun(); 
            this.drawSnowGround(); // 积雪地面
            this.updateWinterSnow();
            this.drawWinterSnow();
        }

        this.animationId = requestAnimationFrame(() => this.loop());
    },

    // =========================================
    // 🎨 背景绘制 (Sky Background)
    // =========================================
    drawSkyBackground: function() {
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        if (this.activeSeason === 'spring') {
            grad.addColorStop(0, '#E6E9F0'); 
            grad.addColorStop(1, '#EEF1F5');
        } else if (this.activeSeason === 'summer') {
            grad.addColorStop(0, '#2980B9'); 
            grad.addColorStop(1, '#6DD5FA'); 
        } else if (this.activeSeason === 'autumn') {
            grad.addColorStop(0, '#FF512F'); // 暖顶
            grad.addColorStop(0.4, '#DD2476');
            grad.addColorStop(1, '#2c3e50'); // 冷底 (保留你的A/B选择)
        } else if (this.activeSeason === 'winter') {
            // 冬：极夜蓝 -> 雾霾蓝
            grad.addColorStop(0, '#0f172a'); // 深沉的午夜蓝
            grad.addColorStop(0.6, '#1e293b');
            grad.addColorStop(1, '#64748b'); // 底部的灰蓝色，衔接积雪
        } else {
            grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#eee');
        }
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // =========================================
    // ❄️ 冬雪系统 (Winter Engine)
    // =========================================
    initWinter: function() {
        this.snowflakes = [];
        const count = 150; // 雪花数量
        for(let i=0; i<count; i++) {
            this.snowflakes.push(this.createSnowflake(true));
        }
    },

    createSnowflake: function(randomY) {
        // 景深逻辑：z 越大，离镜头越近 (更大、更快、更透)
        const z = Math.random(); 
        return {
            x: Math.random() * this.width,
            y: randomY ? Math.random() * this.height : -10,
            z: z,
            size: 2 + z * 3, // 2px ~ 5px
            speed: 0.5 + z * 1.5, // 近处快，远处慢
            sway: Math.random() * Math.PI * 2, // 摇摆相位
            swayAmp: 0.5 + Math.random() * 1.0, // 摇摆幅度
            opacity: 0.4 + z * 0.5 // 近处实，远处虚
        };
    },

    updateWinterSnow: function() {
        this.snowflakes.forEach(s => {
            s.y += s.speed;
            s.sway += 0.02; // 缓慢摇摆频率
            s.x += Math.sin(s.sway) * s.swayAmp; // 正弦波飘落

            // 循环 (落到积雪层下方重置)
            // 积雪层大约在 height - 30 左右
            if (s.y > this.height) {
                // 重置到顶部
                Object.assign(s, this.createSnowflake(false));
            }
        });
    },

    drawWinterSnow: function() {
        const ctx = this.ctx;
        ctx.fillStyle = '#fff';
        
        this.snowflakes.forEach(s => {
            ctx.beginPath();
            ctx.globalAlpha = s.opacity;
            // 简单的圆形雪花 (性能最好)
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0; // 重置
    },

    // 绘制积雪地面 (Decor)
    drawSnowGround: function() {
        const ctx = this.ctx;
        ctx.fillStyle = '#f1f5f9'; // 略带冷色的白
        
        // 画一个起伏的白色小山丘
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(0, this.height - 40);
        
        // 贝塞尔曲线模拟雪堆
        ctx.bezierCurveTo(
            this.width * 0.3, this.height - 60, 
            this.width * 0.7, this.height - 20, 
            this.width, this.height - 40
        );
        
        ctx.lineTo(this.width, this.height);
        ctx.fill();
    },

    // =========================================
    // 🌞 太阳系统 (复用)
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

    drawAutumnSun: function() {
        const ctx = this.ctx;
        const glow = ctx.createRadialGradient(this.sunX, this.sunY, 60, this.sunX, this.sunY, 250);
        glow.addColorStop(0, 'rgba(255, 140, 0, 0.4)'); 
        glow.addColorStop(0.5, 'rgba(200, 50, 50, 0.2)'); 
        glow.addColorStop(1, 'rgba(100, 0, 100, 0)');     
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(this.sunX, this.sunY, 300, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#FFB74D'; 
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#E64A19'; 
        ctx.beginPath(); ctx.arc(this.sunX, this.sunY, 60, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    },

    // =========================================
    // 🍁 秋叶系统 (保持 0.7.4.7 上暖下冷配色)
    // =========================================
    initAutumn: function() {
        this.leaves = [];
        for(let i=0; i<30; i++) this.leaves.push(this.createLeaf(true));
        this.clouds = [];
        for(let i=0; i<6; i++) this.clouds.push(this.createCloud('autumn', true));
    },

    createLeaf: function(randomY) {
        return {
            x: Math.random() * this.width,
            y: randomY ? Math.random() * (this.height - 50) : -20, 
            size: 8 + Math.random() * 8,       
            vx: (Math.random() - 0.5) * 1.5,   
            vy: 1 + Math.random() * 1.5,       
            rotation: Math.random() * Math.PI * 2, 
            rotSpeed: (Math.random() - 0.5) * 0.05, 
            flip: 0, 
            flipSpeed: 0.02 + Math.random() * 0.03, 
            color: Math.random() > 0.6 ? '#D84315' : (Math.random() > 0.5 ? '#EF6C00' : '#FF8F00'), 
            state: 'falling', 
            life: 1.0 
        };
    },

    updateAutumnLeaves: function() {
        if (Math.random() < 0.03) this.leaves.push(this.createLeaf(false));
        for (let i = this.leaves.length - 1; i >= 0; i--) {
            let l = this.leaves[i];
            if (l.state === 'falling') {
                l.x += l.vx + Math.sin(this.time + l.y * 0.01) * 0.5;
                l.y += l.vy;
                l.rotation += l.rotSpeed;
                l.flip += l.flipSpeed;
                if (l.y > this.height - 25) { 
                    l.state = 'landed';
                    l.y = this.height - 25 + Math.random() * 15; 
                }
            } else {
                l.life -= 0.003; 
                if (l.life <= 0) this.leaves.splice(i, 1);
            }
        }
    },

    drawAutumnLeaves: function() {
        const ctx = this.ctx;
        this.leaves.forEach(l => {
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.rotation);
            const flipScale = Math.sin(l.flip); 
            ctx.scale(flipScale, 1);
            ctx.globalAlpha = l.life;
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.moveTo(0, -l.size);
            ctx.lineTo(l.size * 0.3, -l.size * 0.3);
            ctx.lineTo(l.size, -l.size * 0.5);
            ctx.lineTo(l.size * 0.5, 0);
            ctx.lineTo(l.size, l.size * 0.5);
            ctx.lineTo(0, l.size * 0.3); 
            ctx.lineTo(-l.size, l.size * 0.5);
            ctx.lineTo(-l.size * 0.5, 0);
            ctx.lineTo(-l.size, -l.size * 0.5);
            ctx.lineTo(-l.size * 0.3, -l.size * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    },

    // =========================================
    // ☁️ 云朵 & 其他
    // =========================================
    createCloud: function(type, randomX) {
        const puffs = [];
        let puffCount = 5, scaleY = 1.0, color = '255, 255, 255', opacity = 0.8;
        let speedBase = 0.2;

        if (type === 'spring') {
            puffCount = 3; scaleY = 0.6; opacity = 0.4; speedBase = 0.1;
        } else if (type === 'summer') {
            puffCount = 6; scaleY = 1.0; opacity = 0.9; speedBase = 0.3;
        } else if (type === 'autumn') {
            puffCount = 8; scaleY = 0.4; color = '255, 160, 122'; opacity = 0.35; speedBase = 0.05; 
        }
        
        for(let i=0; i<puffCount; i++) {
            puffs.push({
                x: (Math.random() - 0.5) * (type==='autumn' ? 150 : 100), 
                y: (Math.random() - 0.5) * 40,
                r: 30 + Math.random() * 30
            });
        }
        return {
            x: randomX ? Math.random() * this.width : -250,
            y: Math.random() * (this.height * 0.4),
            scale: (0.5 + Math.random() * 0.5) * (type==='autumn'?1.5:1), 
            speed: speedBase + Math.random() * 0.1,
            puffs: puffs,
            opacity: opacity,
            scaleY: scaleY,
            color: color,
            type: type
        };
    },

    initSpring: function() {
        this.drops = []; for (let i = 0; i < this.numDrops; i++) this.drops.push(this.newDrop()); this.splashes = [];
        this.clouds = []; for(let i=0; i<6; i++) this.clouds.push(this.createCloud('spring', true));
    },

    initSummer: function() {
        this.clouds = []; for(let i=0; i<5; i++) this.clouds.push(this.createCloud('summer', true));
    },

    updateClouds: function() {
        this.clouds.forEach((c, index) => {
            c.x += c.speed;
            if (c.x > this.width + 300) {
                const type = this.activeSeason;
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
            const col = c.color || '255, 255, 255';
            ctx.fillStyle = `rgba(${col}, ${c.opacity})`;
            c.puffs.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        });
    },

    drawRainbow: function() {
        const ctx = this.ctx;
        const radius = this.width * 0.6;
        const cx = this.width * 0.5;
        const cy = this.height + (radius * 0.45); 
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        const colors = ['hsla(0, 100%, 55%, 0.65)','hsla(30, 100%, 55%, 0.65)','hsla(60, 100%, 55%, 0.65)','hsla(120, 100%, 55%, 0.65)','hsla(200, 100%, 55%, 0.65)','hsla(270, 100%, 55%, 0.65)','hsla(300, 100%, 55%, 0.65)'];
        const thickness = 22; 
        colors.forEach((color, i) => {
            ctx.beginPath();
            ctx.arc(cx, cy, radius - (i * thickness), Math.PI, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.shadowColor = color; ctx.shadowBlur = 50; 
            ctx.stroke();
        });
        ctx.restore();
    },

    newDrop: function() { return { x: Math.random() * this.width, y: Math.random() * this.height - this.height, length: Math.random() * 25 + 15, speed: Math.random() * 8 + 8, width: Math.random() * 1.5 + 0.5 }; },
    updateSpringRain: function() { for (let i = 0; i < this.drops.length; i++) { const d = this.drops[i]; d.y += d.speed; if (d.y > this.height) { this.createSplash(d.x, this.height); this.drops[i] = this.newDrop(); this.drops[i].y = -this.drops[i].length; } } for (let i = this.splashes.length - 1; i >= 0; i--) { const s = this.splashes[i]; s.x += s.vx; s.y += s.vy; s.vy += 0.2; s.life -= 0.05; if (s.life <= 0) this.splashes.splice(i, 1); } },
    createSplash: function(x, y) { const count = Math.floor(Math.random() * 3) + 3; for(let i=0; i<count; i++) { this.splashes.push({ x: x, y: y, vx: (Math.random() - 0.5) * 4, vy: -(Math.random() * 3 + 1), life: 1.0, radius: Math.random() * 1.5 + 0.5 }); } },
    drawSpringRain: function() { const ctx = this.ctx; ctx.lineCap = 'round'; this.drops.forEach(d => { const grad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.length); grad.addColorStop(0, 'rgba(66, 165, 245, 0)'); grad.addColorStop(1, 'rgba(33, 150, 243, 0.8)'); ctx.strokeStyle = grad; ctx.lineWidth = d.width; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.length); ctx.stroke(); }); this.splashes.forEach(s => { ctx.fillStyle = `rgba(33, 150, 243, ${s.life})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); }); }
};

window.addEventListener('load', () => {
    if (window.BackgroundEngine) {
        window.BackgroundEngine.init();
    }
});