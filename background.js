/**
 * Project Lysh Visual Engine - Alpha 0.7.8.2
 * * [新增特性] 环境音效联动
 * 1. 春季：调用 SoundEngine.playAmbient() 播放雨声。
 * 2. 夏/秋/冬：调用 SoundEngine.stopAmbient() 停止雨声。
 * * [视觉保持] 完美保留 0.7.4.9 的所有视觉效果 (春日天光、极夜冬雪、上暖下冷秋色)。
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

    // === 粒子/对象 (全季节公用池) ===
    drops: [],
    splashes: [],
    numDrops: 120,
    clouds: [],
    leaves: [],
    snowflakes: [],

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

        // 核心改动：音频联动
        if (typeof SoundEngine !== 'undefined') {
            if (season === 'spring') {
                SoundEngine.playAmbient(); // 播放雨声
            } else {
                SoundEngine.stopAmbient(); // 停止雨声
            }
        }

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

        // 重置当前季节逻辑
        if (this.activeSeason === 'spring') this.initSpring();
        else if (this.activeSeason === 'summer') this.initSummer();
        else if (this.activeSeason === 'autumn') this.initAutumn();
        else if (this.activeSeason === 'winter') this.initWinter();
    },

    clearCanvas: function() {
        if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
    },

    start: function() {
        // 由 FrameRateController 統一管理，不再自己調用 loop
        // 但需要確保 FrameRateController 已經啟動
        if (typeof FrameRateController !== 'undefined' && !FrameRateController.animationId) {
            FrameRateController.start();
        }
    },

    stop: function() {
        // 由 FrameRateController 統一管理，不停止全局循環
    },

    loop: function() {
        this.time += 0.012;  // 提速 20% (0.01 * 1.2)
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
            this.drawSpringSun(); 
            this.drawSnowGround(); 
            this.updateWinterSnow();
            this.drawWinterSnow();
        }
        
        // 移除 requestAnimationFrame 調用，由 FrameRateController 統一管理
    },

    // =========================================
    // 🎨 背景绘制 (Sky Background)
    // =========================================
    drawSkyBackground: function() {
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        if (this.activeSeason === 'spring') {
            // 春：清晨天光
            grad.addColorStop(0, '#A1C4FD'); 
            grad.addColorStop(1, '#F1F2F6');
        } else if (this.activeSeason === 'summer') {
            // 夏：正午湛蓝
            grad.addColorStop(0, '#2980B9'); 
            grad.addColorStop(1, '#6DD5FA'); 
        } else if (this.activeSeason === 'autumn') {
            // 秋：傍晚 (上暖下冷)
            grad.addColorStop(0, '#FF512F'); 
            grad.addColorStop(0.4, '#DD2476');
            grad.addColorStop(1, '#2c3e50'); 
        } else if (this.activeSeason === 'winter') {
            // 冬：黑夜 (极夜蓝)
            grad.addColorStop(0, '#0f172a'); 
            grad.addColorStop(0.6, '#1e293b');
            grad.addColorStop(1, '#64748b'); 
        } else {
            grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#eee');
        }
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // =========================================
    // 🌞 太阳系统 (The Sun)
    // =========================================
    drawSpringSun: function() {
        const ctx = this.ctx;
        // 广域晨光
        const glow = ctx.createRadialGradient(this.sunX, this.sunY, 60, this.sunX, this.sunY, 300);
        glow.addColorStop(0, 'rgba(255, 238, 88, 0.35)'); 
        glow.addColorStop(0.5, 'rgba(255, 241, 118, 0.15)'); 
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');   
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(this.sunX, this.sunY, 300, 0, Math.PI*2); ctx.fill();

        // 内部高光
        const coreGlow = ctx.createRadialGradient(this.sunX, this.sunY, 50, this.sunX, this.sunY, 120);
        coreGlow.addColorStop(0, 'rgba(255, 215, 0, 0.25)'); 
        coreGlow.addColorStop(1, 'rgba(255, 255, 224, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath(); ctx.arc(this.sunX, this.sunY, 120, 0, Math.PI*2); ctx.fill();

        // 太阳本体
        ctx.fillStyle = '#FFF9C4'; 
        ctx.shadowBlur = 25; 
        ctx.shadowColor = '#FDD835'; 
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
    // 🍁 秋叶系统
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
            vx: (Math.random() - 0.5) * 1.5 * 1.2,  // 提速 20%
            vy: (1 + Math.random() * 1.5) * 1.2,  // 提速 20%
            rotation: Math.random() * Math.PI * 2, 
            rotSpeed: (Math.random() - 0.5) * 0.05 * 1.2,  // 提速 20%
            flip: 0, 
            flipSpeed: (0.02 + Math.random() * 0.03) * 1.2,  // 提速 20%
            color: Math.random() > 0.6 ? '#D84315' : (Math.random() > 0.5 ? '#EF6C00' : '#FF8F00'), 
            state: 'falling', 
            life: 1.0 
        };
    },

    updateAutumnLeaves: function() {
        if (Math.random() < 0.03) this.leaves.push(this.createLeaf(false));

        for (let i = this.leaves.length - 1; i >= 0; i--) {
            let l = this.leaves[i];
            l.x += l.vx + Math.sin(this.time + l.y * 0.01) * 0.5;
            l.y += l.vy;
            l.rotation += l.rotSpeed;
            l.flip += l.flipSpeed;

            if (l.y > this.height + 20) { 
                this.leaves.splice(i, 1);
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
    // ❄️ 冬雪系统
    // =========================================
    initWinter: function() {
        this.snowflakes = [];
        for(let i=0; i<150; i++) this.snowflakes.push(this.createSnowflake(true));
    },

    createSnowflake: function(randomY) {
        const z = Math.random(); 
        return {
            x: Math.random() * this.width,
            y: randomY ? Math.random() * this.height : -10,
            z: z,
            size: 2 + z * 3, 
            speed: (0.5 + z * 1.5) * 1.2,  // 提速 20%
            sway: Math.random() * Math.PI * 2, 
            swayAmp: (0.5 + Math.random() * 1.0) * 1.2,  // 提速 20%
            opacity: 0.4 + z * 0.5 
        };
    },

    updateWinterSnow: function() {
        this.snowflakes.forEach(s => {
            s.y += s.speed;
            s.sway += 0.024;  // 提速 20% (0.02 * 1.2)
            s.x += Math.sin(s.sway) * s.swayAmp; 
            if (s.y > this.height) Object.assign(s, this.createSnowflake(false));
        });
    },

    drawWinterSnow: function() {
        const ctx = this.ctx;
        ctx.fillStyle = '#fff';
        this.snowflakes.forEach(s => {
            ctx.beginPath();
            ctx.globalAlpha = s.opacity;
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0; 
    },

    drawSnowGround: function() {
        const ctx = this.ctx;
        ctx.fillStyle = '#f1f5f9'; 
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(0, this.height - 40);
        ctx.bezierCurveTo(this.width * 0.3, this.height - 60, this.width * 0.7, this.height - 20, this.width, this.height - 40);
        ctx.lineTo(this.width, this.height);
        ctx.fill();
    },

    // =========================================
    // ☁️ 云朵 (通用)
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
            speed: (speedBase + Math.random() * 0.1) * 1.2,  // 提速 20%
            puffs: puffs,
            opacity: opacity,
            scaleY: scaleY,
            color: color,
            type: type
        };
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

    // =========================================
    // 💧 雨水 & 🌈 彩虹
    // =========================================
    initSpring: function() {
        this.drops = [];
        for (let i = 0; i < this.numDrops; i++) this.drops.push(this.newDrop());
        this.splashes = [];
        this.clouds = [];
        for(let i=0; i<6; i++) this.clouds.push(this.createCloud('spring', true));
    },

    newDrop: function() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height - this.height,
            length: Math.random() * 25 + 15,
            speed: (Math.random() * 8 + 8) * 1.2,  // 提速 20%
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
            s.x += s.vx; s.y += s.vy; s.vy += 0.24; s.life -= 0.06;  // 提速 20%
            if (s.life <= 0) this.splashes.splice(i, 1);
        }
    },

    createSplash: function(x, y) {
        const count = Math.floor(Math.random() * 3) + 3;
        for(let i=0; i<count; i++) {
            this.splashes.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 4 * 1.2,  // 提速 20%
                vy: -(Math.random() * 3 + 1) * 1.2,  // 提速 20%
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
    },

    initSummer: function() {
        this.clouds = [];
        for(let i=0; i<5; i++) this.clouds.push(this.createCloud('summer', true));
    },

    drawRainbow: function() {
        const ctx = this.ctx;
        const radius = this.width * 0.6;
        const cx = this.width * 0.5;
        const cy = this.height + (radius * 0.45); 

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

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
            ctx.arc(cx, cy, radius - (i * thickness), Math.PI, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.shadowColor = color; 
            ctx.shadowBlur = 50; 
            ctx.stroke();
        });

        ctx.restore();
    }
};

// 移除自動初始化，改由 game.js 在 FrameRateController 初始化後調用
// window.addEventListener('load', () => {
//     if (window.BackgroundEngine) {
//         window.BackgroundEngine.init();
//     }
// });