// ================= 流金特效模块 (Golden FX) =================

const GoldenFX = {
    state: {
        celebrationType: null,
        golden: null
    },
    _goldImage: null,

    init() {
        // 预加载金币图片（若失败则使用绘制替代）
        if (!this._goldImage) {
            this._goldImage = new Image();
            this._goldImage.onload = () => {
                console.log('[Golden] 金币图片加载完成，尺寸:', this._goldImage.naturalWidth, 'x', this._goldImage.naturalHeight);
            };
            this._goldImage.onerror = () => {
                console.error('[Golden] 金币图片加载失败！');
            };
            this._goldImage.src = 'images/gold.png';
        }
    },

    start() {
        this.init();
        this.state.celebrationType = 'golden';
        console.log('[Golden] 启动流金模式');
        
        this.state.golden = {
            // 探照灯系统- 画面外光源版
            spotlights: [
                { 
                    x: -0.3, y: -0.2, // 画面外左上角
                    angle: 0, speed: 0.008, // 较慢的扫描速度
                    color: '#FFD700',
                    intensity: 0.9 // 高强度
                },
                { 
                    x: 1.3, y: -0.2, // 画面外右上角
                    angle: Math.PI, speed: -0.006, // 反向扫描
                    color: '#FFA500',
                    intensity: 0.8
                }
            ],
            
            // 彩带与碎纸系统（恢复）
            streamers: [],
            confetti: [],
            lastStreamerTime: 0,
            streamerInterval: 1800, // 每1800ms喷射一次（3拍 @ 100BPM）
            
            // 金币雨系统（优化）
            coins: [],
            lastCoinTime: 0,
            coinInterval: 1500, // 【修改】每1.50秒生成一枚金币
            collectedCoins: 0,
            totalCoins: 0, // 已生成的金币总数
            maxCoins: 12, // 最大金币数量
            
            // 粒子效果
            particles: [],
            
            // COMPLETE 文本特效
            completeText: null,
            completeTriggered: false // 【新增】标记COMPLETE 是否已触发
        };
        
        console.log('[Golden] 流金状态初始化完成');
    },

    render(ctx, w, h, now) {
        this.renderGoldenRain(ctx, w, h, now);
    },

    handleClick(x, y) {
        return this.checkCoinClick(x, y);
    },

    reset() {
        this.forceStopGolden();
        this.state.golden = null;
        this.state.celebrationType = null;
    },

    // 强制停止流金特效
    forceStopGolden: function() {
        if (this.state && this.state.golden) {
            this.state.golden = null;
        }
        if (this.state) {
            this.state.celebrationType = null;
        }
        
        // 【新增】清理流金BGM（bgm6.mp3）
        if (typeof SoundEngine !== 'undefined' && SoundEngine.goldenBGM) {
            try {
                SoundEngine.goldenBGM.pause();
                SoundEngine.goldenBGM.currentTime = 0;
                SoundEngine.goldenBGM = null;
                console.log('[FX] 流金 BGM 已清理');
            } catch (e) {
                console.warn('[FX] 流金 BGM 清理异常:', e);
            }
        }
        
        console.log('[FX] 流金特效已强制清理');
    },
    
    // 流金特效主渲染函数
    renderGoldenRain: function(ctx, w, h, now) {
        const golden = this.state.golden;
        if (!golden) return;
        
        try {
            // 1. 绘制华丽背景渐变
            this.renderGoldenBackground(ctx, w, h, now);
            
            // 2. 绘制暖色探照灯
            this.renderGoldenSpotlights(ctx, w, h, now, golden);
            
            // 3. 更新和生成彩带碎纸（恢复）
            this.updateStreamersAndConfetti(ctx, w, h, now, golden);
            
            // 4. 绘制彩带和碎纸（恢复）
            this.renderStreamersAndConfetti(ctx, golden);
            
            // 5. 更新和生成金币（优化版）
            this.updateCoins(ctx, w, h, now, golden);
            
            // 6. 绘制金币
            this.renderCoins(ctx, golden, now);
            
            // 7. 绘制收集粒子效果
            this.renderGoldenParticles(ctx, golden);
            
            // 8. 【新增】绘制COMPLETE 文本特效
            if (golden.completeText) {
                this.renderCompleteText(ctx, w, h, golden);
            }
            
        } catch (error) {
            console.error('[Golden] 渲染子系统错误:', error);
            // 如果出错，至少显示一个简单的金色背景
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(0, 0, w, h);
        }
    },
    
    // 绘制华丽背景
    renderGoldenBackground: function(ctx, w, h, now) {
        // 深色背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);
        
        // 金色渐变覆盖
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.05)');
        gradient.addColorStop(1, 'rgba(184, 134, 11, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    },
    
    // 绘制暖色探照灯- 完全同步版
    renderGoldenSpotlights: function(ctx, w, h, now, golden) {
        ctx.globalCompositeOperation = 'lighter';
        
        golden.spotlights.forEach((spotlight, index) => {
            // 更新探照灯角度（左右扫描）
            spotlight.angle += spotlight.speed;
            
            // 【同步】让探照灯从画面的左上角和右上角射入
            const isLeft = index === 0;
            const startX = isLeft ? 0 : w; // 左上角(0,0) 和 右上角(w,0)
            const startY = 0; // 都从顶部射入
            
            // 【同步】统一的扫描角度计算
            const sweepRange = 0.4; // 扫描范围
            const baseDirection = isLeft ? 0.6 : -0.6; // 基础照射角度
            const swayAngle = Math.sin(spotlight.angle) * sweepRange + baseDirection;
            
            // 【同步】统一的距离参数
            const beamDistance = Math.max(w, h) * 1.5; // 光束长度
            const beamWidth = w * 0.35; // 光束宽度
            
            // 【同步】基于同一个角度计算所有点
            // 光束方向向量（从起点指向光束中心）
            const dirX = Math.sin(swayAngle);
            const dirY = Math.cos(swayAngle);
            
            // 光束垂直方向向量（用于计算左右边界）
            const perpX = -dirY;
            const perpY = dirX;
            
            // 光束中心点
            const centerX = startX + dirX * beamDistance;
            const centerY = startY + dirY * beamDistance;
            
            // 光束左右边界点（使用垂直向量）
            const leftX = centerX + perpX * beamWidth;
            const leftY = centerY + perpY * beamWidth;
            const rightX = centerX - perpX * beamWidth;
            const rightY = centerY - perpY * beamWidth;
            
            // 【同步】渐变也使用同一个方向
            const grd = ctx.createLinearGradient(startX, startY, centerX, centerY);
            grd.addColorStop(0, `${spotlight.color}${Math.floor(spotlight.intensity * 255).toString(16).padStart(2, '0')}`);
            grd.addColorStop(0.3, `${spotlight.color}A0`);
            grd.addColorStop(0.7, `${spotlight.color}60`);
            grd.addColorStop(1, `${spotlight.color}20`);
            
            // 绘制聚光灯主体- 一个完整的锥形
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(leftX, leftY);
            ctx.lineTo(rightX, rightY);
            ctx.closePath();
            ctx.fill();
            
            // 聚光灯中心的强光束
            const centerGrd = ctx.createLinearGradient(startX, startY, centerX, centerY);
            centerGrd.addColorStop(0, `rgba(255, 255, 255, ${spotlight.intensity * 0.6})`);
            centerGrd.addColorStop(0.4, `${spotlight.color}80`);
            centerGrd.addColorStop(1, 'rgba(0,0,0,0)');
            
            const centerWidth = beamWidth * 0.3; // 中心强光宽度
            const centerLeftX = centerX + perpX * centerWidth;
            const centerLeftY = centerY + perpY * centerWidth;
            const centerRightX = centerX - perpX * centerWidth;
            const centerRightY = centerY - perpY * centerWidth;
            
            ctx.fillStyle = centerGrd;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(centerLeftX, centerLeftY);
            ctx.lineTo(centerRightX, centerRightY);
            ctx.closePath();
            ctx.fill();
            
            // 聚光灯边缘的柔和渐变
            const edgeGrd = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, beamWidth);
            edgeGrd.addColorStop(0, 'rgba(0,0,0,0)');
            edgeGrd.addColorStop(0.7, 'rgba(0,0,0,0)');
            edgeGrd.addColorStop(0.9, `${spotlight.color}30`);
            edgeGrd.addColorStop(1, `${spotlight.color}10`);
            
            ctx.fillStyle = edgeGrd;
            ctx.beginPath();
            ctx.arc(centerX, centerY, beamWidth, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.globalCompositeOperation = 'source-over';
    },
    // 更新彩带和碎纸
    updateStreamersAndConfetti: function(ctx, w, h, now, golden) {
        // 彩带永远按节奏发射，不受 COMPLETE 状态影响
        if (now - golden.lastStreamerTime > golden.streamerInterval) {
            golden.lastStreamerTime = now;
            
            // 播放彩带喷射音效
            if (typeof SoundEngine !== 'undefined') {
                SoundEngine.playStreamerBlast();
            }
            
            // 【暴力升级】三点同时爆发：左、中、右
            this.createStreamers(golden, w, h, 'left');   // 左侧爆发
            this.createStreamers(golden, w, h, 'center'); // 中央爆发
            this.createStreamers(golden, w, h, 'right');  // 右侧爆发
            
            // 生成更多碎纸
            this.createConfetti(golden, w, h);
            this.createConfetti(golden, w, h); // 双倍碎纸
        }
        
        // 更新现有彩带
        for (let i = golden.streamers.length - 1; i >= 0; i--) {
            const streamer = golden.streamers[i];
            
            // 物理更新
            streamer.x += streamer.vx;
            streamer.y += streamer.vy;
            streamer.vy += 0.1; // 重力
            streamer.vx *= 0.98; // 空气阻力
            streamer.rotation += streamer.rotSpeed;
            streamer.life -= 0.005;
            
            // 移除过期彩带
            if (streamer.life <= 0 || streamer.y > h + 50) {
                golden.streamers.splice(i, 1);
            }
        }
        
        // 更新碎纸
        for (let i = golden.confetti.length - 1; i >= 0; i--) {
            const conf = golden.confetti[i];
            
            conf.x += conf.vx;
            conf.y += conf.vy;
            conf.vy += 0.08; // 重力
            conf.vx *= 0.99; // 空气阻力
            conf.rotation += conf.rotSpeed;
            conf.life -= 0.008;
            
            if (conf.life <= 0 || conf.y > h + 50) {
                golden.confetti.splice(i, 1);
            }
        }
    },
    
    // 创建彩带 - 修正版
    createStreamers: function(golden, w, h, side) {
        const count = 20 + Math.random() * 15; // 暴增数量 (20-35 每个发射点)
        let startX, targetX, baseAngle, startY;
        
        // 根据发射点确定位置和方向
        if (side === 'left') {
            startX = -100; // 更远的起始位置
            startY = h * 0.85;
            targetX = w * 0.7; // 朝向右侧
            baseAngle = Math.atan2(-h * 0.4, targetX - startX);
        } else if (side === 'right') {
            startX = w + 100;
            startY = h * 0.85;
            targetX = w * 0.3; // 朝向左侧
            baseAngle = Math.atan2(-h * 0.4, targetX - startX);
        } else { // center - 修正从底部发射
            startX = w * 0.5;
            startY = h + 20; // 从屏幕底部外侧发射
            targetX = w * 0.5; // 垂直向上
            baseAngle = -Math.PI / 2; // 垂直向上
        }
        
        for (let i = 0; i < count; i++) {
            // 更大的角度变化，营造爆发感
            const angleVariation = (Math.random() - 0.5) * 1.8; // 更大的扩散角度
            const angle = baseAngle + angleVariation;
            
            const speed = 8 + Math.random() * 10; // 更强的初始速度 (8-18)
            
            golden.streamers.push({
                x: startX + (Math.random() - 0.5) * 200, // 更大的起始位置变化
                y: startY + (Math.random() - 0.5) * 50,  // 减少高度变化，确保从底部
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                length: 25 + Math.random() * 50, // 更大的长度变化 (25-75)
                width: 3 + Math.random() * 5,   // 更大的宽度变化 (3-8)
                color: this.getRandomStreamerColor(),
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2, // 更快的旋转
                life: 1.0,
                // 彩带类型分布：更多飘带
                type: Math.random() > 0.2 ? 'ribbon' : 'streamer' // 80% 飘带
            });
        }
    },
    
    // 创建碎纸
    createConfetti: function(golden, w, h) {
        const count = 20 + Math.random() * 10;
        
        for (let i = 0; i < count; i++) {
            const side = Math.random() > 0.5 ? 'left' : 'right';
            const startX = side === 'left' ? -30 : w + 30;
            const targetX = w * 0.5;
            const startY = h * 0.8;
            
            const angle = Math.atan2(-h * 0.6, targetX - startX) + (Math.random() - 0.5) * 1.0;
            const speed = 6 + Math.random() * 3;
            
            golden.confetti.push({
                x: startX + (Math.random() - 0.5) * 80,
                y: startY + (Math.random() - 0.5) * 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color: this.getRandomConfettiColor(),
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                life: 1.0
            });
        }
    },
    
    // 获取随机彩带颜色
    getRandomStreamerColor: function() {
        const colors = [
            '#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB', '#00CED1',
            '#FF69B4', '#32CD32', '#FF4500', '#DA70D6', '#00FA9A', '#FF8C00',
            '#BA55D3', '#20B2AA', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 获取随机碎纸颜色
    getRandomConfettiColor: function() {
        const colors = ['#FFD700', '#FFA500', '#FF69B4', '#00FA9A', '#87CEEB', '#DDA0DD'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 渲染彩带和碎纸- 恢复简洁材质
    renderStreamersAndConfetti: function(ctx, golden) {
        // 渲染彩带
        golden.streamers.forEach(streamer => {
            ctx.save();
            ctx.translate(streamer.x, streamer.y);
            ctx.rotate(streamer.rotation);
            ctx.globalAlpha = streamer.life;
            
            if (streamer.type === 'ribbon') {
                // 飘带类型：柔软曲线，简洁材质
                ctx.fillStyle = streamer.color;
                ctx.beginPath();
                ctx.moveTo(-streamer.length / 2, -streamer.width / 2);
                ctx.quadraticCurveTo(0, -streamer.width, streamer.length / 2, -streamer.width / 2);
                ctx.quadraticCurveTo(0, streamer.width, -streamer.length / 2, streamer.width / 2);
                ctx.closePath();
                ctx.fill();
                
                // 简单高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(-streamer.length / 2, -streamer.width / 4, streamer.length, streamer.width / 2);
            } else {
                // 传统长条彩带
                ctx.fillStyle = streamer.color;
                ctx.fillRect(-streamer.length / 2, -streamer.width / 2, streamer.length, streamer.width);
                
                // 简单边框
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(-streamer.length / 2, -streamer.width / 2, streamer.length, streamer.width);
            }
            
            ctx.restore();
        });
        
        // 渲染碎纸
        golden.confetti.forEach(conf => {
            ctx.save();
            ctx.translate(conf.x, conf.y);
            ctx.rotate(conf.rotation);
            ctx.globalAlpha = conf.life;
            
            // 随机形状的碎纸
            if (Math.random() > 0.5) {
                // 方形碎纸
                ctx.fillStyle = conf.color;
                ctx.fillRect(-conf.size / 2, -conf.size / 2, conf.size, conf.size);
            } else {
                // 圆形碎纸
                ctx.fillStyle = conf.color;
                ctx.beginPath();
                ctx.arc(0, 0, conf.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 简单高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(-conf.size / 4, -conf.size / 4, conf.size / 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        ctx.globalAlpha = 1.0;
    },
    
    // 更新金币系统
    updateCoins: function(ctx, w, h, now, golden) {
        // 只有在未达到最大金币数时才生成新金币
        if (golden.totalCoins < golden.maxCoins && now - golden.lastCoinTime > golden.coinInterval) {
            golden.lastCoinTime = now;
            golden.totalCoins++;
            
            // 优化安全区域：避开屏幕中央胜利弹窗区域
            let coinX;
            const centerStart = w * 0.35; // 中央区域开始
            const centerEnd = w * 0.65;   // 中央区域结束
            
            // 随机选择左侧或右侧安全区域
            if (Math.random() > 0.5) {
                // 左侧安全区域 (15% - 35%)
                coinX = w * 0.15 + Math.random() * (centerStart - w * 0.15);
            } else {
                // 右侧安全区域 (65% - 85%)
                coinX = centerEnd + Math.random() * (w * 0.85 - centerEnd);
            }
            
            golden.coins.push({
                x: coinX,
                y: -30,
                vx: 0, // 【修改】金币笔直下落，无水平漂移
                vy: 1.8, // 【修改】提升下落速度从1.7 到1.8 (+0.1)
                rotation: 0,
                rotSpeed: 0.05, // 固定旋转速度
                size: 33, // 【修改】固定大小从 30px 增加到33px (+10%)
                life: 1.0,
                collected: false,
                glowPhase: Math.random() * Math.PI * 2,
                
                // 【新增】黄金流星轨迹系统
                trail: [], // 轨迹点历史记录
                trailMaxLength: 60, // 【大幅增加】最大轨迹长度：60个点
                lastTrailTime: now, // 上次记录轨迹的时间
                trailInterval: 8, // 【更密集】每8ms记录一次轨迹点 (125fps)
                
                // 【新增】流星特效参数
                meteorIntensity: 0.8 + Math.random() * 0.4, // 流星强度 (0.8-1.2)
                sparklePhase: Math.random() * Math.PI * 2, // 闪烁相位
                auraSize: 40 + Math.random() * 20 // 光环大小 (40-60px)
            });
        }
        
        // 更新现有金币
        for (let i = golden.coins.length - 1; i >= 0; i--) {
            const coin = golden.coins[i];
            
            if (!coin.collected) {
                // 物理更新 - 恒定速度，无加速度
                coin.x += coin.vx;
                coin.y += coin.vy; // vy 固定为 1.8，不受重力影响
                coin.rotation += coin.rotSpeed;
                coin.glowPhase += 0.08; // 更慢的发光动画
                coin.sparklePhase += 0.12; // 闪烁相位更新
                
                // 【新增】轨迹记录系统- 创造流星尾迹
                if (now - coin.lastTrailTime > coin.trailInterval) {
                    coin.trail.push({
                        x: coin.x,
                        y: coin.y,
                        time: now,
                        intensity: coin.meteorIntensity
                    });
                    
                    // 限制轨迹长度，保持性能
                    if (coin.trail.length > coin.trailMaxLength) {
                        coin.trail.shift(); // 移除最老的轨迹点
                    }
                    
                    coin.lastTrailTime = now;
                }
                
                // 移除超出屏幕的金币
                if (coin.y > h + 100) {
                    golden.coins.splice(i, 1);
                }
            } else {
                // 收集动画
                coin.size *= 1.1;
                coin.life -= 0.05;
                
                if (coin.life <= 0) {
                    golden.coins.splice(i, 1);
                }
            }
        }
        
        // 【新增】检测所有金币是否消失（完成条件）
        if (golden.totalCoins >= golden.maxCoins && golden.coins.length === 0 && !golden.completeTriggered) {
            golden.completeTriggered = true;
            
            // 播放魔法完成音效
            if (typeof SoundEngine !== 'undefined' && SoundEngine.playMagicComplete) {
                SoundEngine.playMagicComplete();
                console.log('[Golden] 魔法完成音效已播放');
            }
            
            // 创建 COMPLETE 文本特效 - 永久显示
            golden.completeText = {
                x: w / 2,
                y: h / 4,
                alpha: 0,
                scale: 0.5,
                targetScale: 1.5
                // 【永久显示】不再有 life 和 vy 属性
            };
            
            console.log('[Golden] COMPLETE 文本已创建，将永久显示');
        }
    },
    
    // 渲染金币 - 黄金流星终极版：璀璨轨迹 + 奢华拖尾 + 珠光宝气
    renderCoins: function(ctx, golden, now) {
        golden.coins.forEach(coin => {
            if (coin.collected) {
                // 收集动画：放大消失
                ctx.save();
                ctx.translate(coin.x, coin.y);
                ctx.scale(coin.size / 20, coin.size / 20);
                ctx.globalAlpha = coin.life;
                
                // 光芒效果
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
                grd.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                grd.addColorStop(0.5, 'rgba(255, 215, 0, 0.6)');
                grd.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            } else {
                // 1. 【璀璨轨迹】绘制壮丽梦幻的流星轨迹
                this.renderGoldenTrail(ctx, coin, now);
                
                // 2. 【奢华光环】绘制稳定的大气光晕
                this.renderGoldenAura(ctx, coin, now);
                
                // 3. 【金币本体】渲染3D翻转的金币主体
                this.renderGoldenCoin(ctx, coin, now);
                
                // 4. 【闪烁粒子】绘制轨迹上的星尘散落
                this.renderTrailSparkles(ctx, coin, now);
            }
        });
    },
    // 【新增】璀璨轨迹渲染- 拟真流星轨迹，头部稍微软化
    renderGoldenTrail: function(ctx, coin, now) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // 计算拟真流星轨迹参数
        const trailLength = 200; // 固定轨迹长度200px
        const maxWidth = 24; // 轨迹最大宽度
        
        // 计算轨迹方向（金币运动的反方向）
        const velocityMagnitude = Math.sqrt(coin.vx * coin.vx + coin.vy * coin.vy);
        if (velocityMagnitude === 0) return; // 如果金币静止，不绘制轨迹
        
        // 标准化速度向量，得到轨迹方向
        const trailDirX = -coin.vx / velocityMagnitude;
        const trailDirY = -coin.vy / velocityMagnitude;
        
        // 轨迹起点：从金币边缘稍微往后一点开始
        const trailStartX = coin.x + trailDirX * coin.size * 0.2;
        const trailStartY = coin.y + trailDirY * coin.size * 0.2;
        
        // 轨迹终点：沿反方向延伸
        const trailEndX = trailStartX + trailDirX * trailLength;
        const trailEndY = trailStartY + trailDirY * trailLength;
        
        // 绘制多层拟真轨迹
        for (let layer = 0; layer < 4; layer++) {
            const layerWidth = maxWidth * (1 - layer * 0.2); // 24px, 19.2px, 14.4px, 9.6px
            const layerAlpha = 0.8 - layer * 0.15; // 0.8, 0.65, 0.5, 0.35
            
            // 创建线性渐变：从轨迹起点到尾部
            const gradient = ctx.createLinearGradient(trailStartX, trailStartY, trailEndX, trailEndY);
            
            if (layer === 0) {
                // 最外层：柔和光晕
                gradient.addColorStop(0, `rgba(255, 255, 255, ${layerAlpha * coin.meteorIntensity})`);
                gradient.addColorStop(0.3, `rgba(255, 230, 150, ${layerAlpha * 0.8 * coin.meteorIntensity})`);
                gradient.addColorStop(0.7, `rgba(255, 180, 80, ${layerAlpha * 0.4 * coin.meteorIntensity})`);
                gradient.addColorStop(1, `rgba(255, 140, 0, 0)`);
            } else if (layer === 1) {
                // 第二层：金色主体
                gradient.addColorStop(0, `rgba(255, 215, 0, ${layerAlpha * coin.meteorIntensity})`);
                gradient.addColorStop(0.4, `rgba(255, 180, 0, ${layerAlpha * 0.7 * coin.meteorIntensity})`);
                gradient.addColorStop(0.8, `rgba(255, 140, 0, ${layerAlpha * 0.3 * coin.meteorIntensity})`);
                gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
            } else if (layer === 2) {
                // 第三层：深金核心
                gradient.addColorStop(0, `rgba(255, 200, 50, ${layerAlpha * coin.meteorIntensity})`);
                gradient.addColorStop(0.5, `rgba(255, 165, 0, ${layerAlpha * 0.6 * coin.meteorIntensity})`);
                gradient.addColorStop(1, `rgba(255, 120, 0, 0)`);
            } else {
                // 内核：亮金线
                gradient.addColorStop(0, `rgba(255, 255, 200, ${layerAlpha * coin.meteorIntensity})`);
                gradient.addColorStop(0.6, `rgba(255, 200, 100, ${layerAlpha * 0.5 * coin.meteorIntensity})`);
                gradient.addColorStop(1, `rgba(255, 150, 50, 0)`);
            }
            
            // 绘制轨迹线条
            ctx.strokeStyle = gradient;
            ctx.lineWidth = layerWidth;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(trailStartX, trailStartY);
            ctx.lineTo(trailEndX, trailEndY);
            ctx.stroke();
        }
        
        // 只在金币周围添加一个很小的柔化光晕，遮住轨迹头部的尖锐边缘
        const softRadius = coin.size * 1.1; // 只比金币大一点点
        const softAlpha = 0.3 * coin.meteorIntensity;
        
        const softGrad = ctx.createRadialGradient(coin.x, coin.y, coin.size * 0.8, coin.x, coin.y, softRadius);
        softGrad.addColorStop(0, `rgba(255, 255, 200, ${softAlpha})`);
        softGrad.addColorStop(0.7, `rgba(255, 215, 100, ${softAlpha * 0.5})`);
        softGrad.addColorStop(1, `rgba(255, 180, 50, 0)`);
        
        ctx.fillStyle = softGrad;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, softRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // 【新增】奢华光环渲染- 稳定的大气光晕
    renderGoldenAura: function(ctx, coin, now) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // 稳定光环强度（移除闪烁）
        const auraRadius = coin.auraSize * 0.8; // 固定强度
        
        // 多层光环效果
        for (let i = 0; i < 4; i++) {
            const radius = auraRadius * (1 - i * 0.2);
            const alpha = (0.6 - i * 0.12) * coin.meteorIntensity; // 稳定透明度
            
            const grd = ctx.createRadialGradient(coin.x, coin.y, 0, coin.x, coin.y, radius);
            
            if (i === 0) {
                // 内核：纯白光芒
                grd.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.7})`);
                grd.addColorStop(0.3, `rgba(255, 215, 0, ${alpha * 0.5})`);
                grd.addColorStop(0.7, `rgba(255, 165, 0, ${alpha * 0.3})`);
                grd.addColorStop(1, `rgba(255, 215, 0, 0)`);
            } else if (i === 1) {
                // 第二层：金色光芒
                grd.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.5})`);
                grd.addColorStop(0.5, `rgba(255, 165, 0, ${alpha * 0.3})`);
                grd.addColorStop(1, `rgba(255, 140, 0, 0)`);
            } else {
                // 外层：暖色扩散
                grd.addColorStop(0, `rgba(255, 200, 100, ${alpha * 0.25})`);
                grd.addColorStop(0.6, `rgba(255, 180, 50, ${alpha * 0.15})`);
                grd.addColorStop(1, `rgba(255, 160, 0, 0)`);
            }
            
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    },
    
    // 【新增】金币本体渲染- 3D翻转效果增强版
    renderGoldenCoin: function(ctx, coin, now) {
        ctx.save();
        ctx.translate(coin.x, coin.y);
        
        // 3D 翻转效果：使用 scaleY(Math.sin(time)) 模拟上下翻转
        const flipTime = now * 0.003 + coin.rotation;
        const scaleY = Math.sin(flipTime);
        const absScaleY = Math.abs(scaleY);
        
        // 应用 3D 上下翻转变换
        ctx.scale(1, scaleY);
        
        // 增强外发光效果
        const glowIntensity = 0.5 + Math.sin(coin.glowPhase) * 0.3;
        ctx.shadowBlur = 25; // 增强模糊半径
        ctx.shadowColor = `rgba(255, 215, 0, ${glowIntensity})`;
        
        // 根据翻转程度调整透明度，营造3D效果
        ctx.globalAlpha = 0.8 + absScaleY * 0.2;
        
        // 渲染金币图片
        if (this._goldImage && this._goldImage.complete && this._goldImage.naturalWidth > 0) {
            const size = coin.size * 2;
            ctx.drawImage(
                this._goldImage,
                -size / 2, -size / 2,
                size, size
            );
        } else {
            // 图片加载失败时的降级渲染
            const size = coin.size * 2;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    },
    
    // 【新增】轨迹闪烁粒子- 金粉散落效果
    renderTrailSparkles: function(ctx, coin, now) {
        if (coin.trail.length < 3) return;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // 在轨迹上随机生成闪烁粒子
        coin.trail.forEach((point, index) => {
            if (index % 3 !== 0) return; // 每个轨迹点生成一个粒子
            
            const age = (now - point.time) / 1000; // 粒子年龄（秒）
            if (age > 0.8) return; // 粒子生命周期0.8秒
            
            const sparkleIntensity = Math.sin(coin.sparklePhase + index) * 0.5 + 0.5;
            const alpha = (1 - age / 0.8) * sparkleIntensity * 0.6;
            
            if (alpha <= 0.05) return;
            
            // 粒子位置微调（模拟散落）
            const offsetX = Math.sin(now * 0.01 + index) * 3;
            const offsetY = Math.cos(now * 0.01 + index) * 2;
            
            const sparkleX = point.x + offsetX;
            const sparkleY = point.y + offsetY;
            const sparkleSize = (2 + Math.sin(coin.sparklePhase + index * 0.5)) * (1 - age / 0.8);
            
            // 绘制闪烁粒子
            const grd = ctx.createRadialGradient(sparkleX, sparkleY, 0, sparkleX, sparkleY, sparkleSize * 2);
            grd.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grd.addColorStop(0.5, `rgba(255, 215, 0, ${alpha * 0.8})`);
            grd.addColorStop(1, `rgba(255, 165, 0, 0)`);
            
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加十字星芒效果
            if (sparkleIntensity > 0.7) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sparkleX - sparkleSize * 1.5, sparkleY);
                ctx.lineTo(sparkleX + sparkleSize * 1.5, sparkleY);
                ctx.moveTo(sparkleX, sparkleY - sparkleSize * 1.5);
                ctx.lineTo(sparkleX, sparkleY + sparkleSize * 1.5);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    },
    
    // 金币点击检测（在鼠标事件中调用）
    checkCoinClick: function(mouseX, mouseY) {
        if (!this.state.golden) return false;
        
        const golden = this.state.golden;
        let hitCoin = false;
        
        golden.coins.forEach(coin => {
            if (!coin.collected) {
                const distance = Math.hypot(mouseX - coin.x, mouseY - coin.y);
                if (distance < coin.size) {
                    // 金币被点击
                    coin.collected = true;
                    golden.collectedCoins++;
                    hitCoin = true;
                    
                    // 播放收集音效
                    if (typeof SoundEngine !== 'undefined') {
                        SoundEngine.playCoinCollect();
                    }
                    
                    // 创建收集粒子效果
                    this.createCoinCollectParticles(golden, coin.x, coin.y);
                }
            }
        });
        
        return hitCoin;
    },
    
    // 创建金币收集粒子效果 - 黄金迷裂版
    createCoinCollectParticles: function(golden, x, y) {
        // === 爆炸冲击波 ===
        golden.particles.push({
            type: 'shockwave',
            x: x,
            y: y,
            radius: 0,
            maxRadius: 80,
            life: 1.0,
            alpha: 0.8
        });
        
        // === 大碎片层（主要视觉冲击）===
        for (let i = 0; i < 12; i++) { // 恢复原来的12个
            const angle = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 12; // 高速射出
            const size = 6 + Math.random() * 8;
            
            golden.particles.push({
                type: 'shard',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                life: 1.0,
                size: size,
                color: Math.random() > 0.3 ? '#FFD700' : '#FFA500' // 亮金/暗金
            });
        }
        
        // === 中碎片层（填充效果）===
        for (let i = 0; i < 15; i++) { // 恢复原来的15个
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 8;
            const size = 3 + Math.random() * 4;
            
            golden.particles.push({
                type: 'fragment',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                size: size,
                color: Math.random() > 0.5 ? '#FFFF00' : '#FFD700'
            });
        }
        
        // === 金粉层（细节丰富）===
        for (let i = 0; i < 25; i++) { // 恢复原来的25个
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            const size = 1 + Math.random() * 2;
            
            golden.particles.push({
                type: 'dust',
                x: x + (Math.random() - 0.5) * 10, // 稍微分散起始位置
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                size: size,
                color: Math.random() > 0.7 ? '#FFFFFF' : '#FFFF88', // 白色闪光/淡金
                sparkle: Math.random() > 0.5 // 闪烁效果
            });
        }
    },
    
    // 渲染收集粒子效果 - 黄金迷裂版
    renderGoldenParticles: function(ctx, golden) {
        for (let i = golden.particles.length - 1; i >= 0; i--) {
            const particle = golden.particles[i];
            
            // === 根据粒子类型进行不同的更新和渲染 ===
            if (particle.type === 'shockwave') {
                // 冲击波扩散
                particle.radius += (particle.maxRadius - particle.radius) * 0.15;
                particle.life -= 0.05;
                particle.alpha = particle.life * 0.8;
                
                if (particle.life <= 0) {
                    golden.particles.splice(i, 1);
                    continue;
                }
                
                // 渲染冲击波
                ctx.save();
                ctx.globalAlpha = particle.alpha;
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 内圈白光
                ctx.globalAlpha = particle.alpha * 0.5;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                
            } else if (particle.type === 'shard') {
                // 大碎片- 锐利碎片（无拖尾）
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.15; // 重力
                particle.vx *= 0.98; // 空气阻力
                particle.rotation += particle.rotationSpeed;
                particle.life -= 0.015;
                
                if (particle.life <= 0) {
                    golden.particles.splice(i, 1);
                    continue;
                }
                
                // 渲染主碎片（不规则形状）
                ctx.save();
                ctx.globalAlpha = particle.life;
                ctx.fillStyle = particle.color;
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                
                // 不规则碎片形状
                ctx.beginPath();
                const size = particle.size * particle.life;
                ctx.moveTo(-size * 0.8, -size * 0.3);
                ctx.lineTo(size * 0.9, -size * 0.1);
                ctx.lineTo(size * 0.6, size * 0.7);
                ctx.lineTo(-size * 0.4, size * 0.8);
                ctx.lineTo(-size * 0.9, size * 0.2);
                ctx.closePath();
                ctx.fill();
                
                // 金属高光边缘
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.globalAlpha = particle.life * 0.6;
                ctx.stroke();
                ctx.restore();
                
            } else if (particle.type === 'fragment') {
                // 中碎片- 保持原来的简洁设计
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.12;
                particle.vx *= 0.99;
                particle.life -= 0.02;
                
                if (particle.life <= 0) {
                    golden.particles.splice(i, 1);
                    continue;
                }
                
                ctx.save();
                ctx.globalAlpha = particle.life;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
            } else if (particle.type === 'dust') {
                // 金粉 - 闪烁和飘散
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.05; // 轻微重力
                particle.vx *= 0.995; // 缓慢减速
                particle.life -= 0.025; // 加快消失速度，控制在500ms内
                
                if (particle.life <= 0) {
                    golden.particles.splice(i, 1);
                    continue;
                }
                
                ctx.save();
                // 闪烁效果
                let alpha = particle.life;
                if (particle.sparkle) {
                    alpha *= 0.5 + 0.5 * Math.sin(Date.now() * 0.02 + particle.x);
                }
                ctx.globalAlpha = alpha;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    },
    
    // 【新增】渲染COMPLETE 文本特效 - 参照流金风格，永久显示
    renderCompleteText: function(ctx, w, h, golden) {
        const complete = golden.completeText;
        if (!complete) return;
        
        // 【永久显示】不再衰减life，只在初始化时进行淡入和缩放动画
        if (complete.alpha < 1.0) {
            complete.alpha = Math.min(1.0, complete.alpha + 0.08); // 淡入
        }
        
        if (complete.scale < complete.targetScale) {
            complete.scale += (complete.targetScale - complete.scale) * 0.1; // 缩放
        }
        
        // 【永久显示】不再更新y 位置，固定在屏幕上方 1/4 处
        // complete.y 保持不变
        
        // 保存 Canvas 状态
        ctx.save();
        ctx.translate(complete.x, complete.y);
        ctx.scale(complete.scale, complete.scale);
        ctx.globalAlpha = complete.alpha;
        
        // 【流金风格】金色渐变 + 发光效果
        // 1. 外层发光光晕
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        
        // 2. 文字主体 - 金色渐变
        const textGradient = ctx.createLinearGradient(-100, -50, 100, 50);
        textGradient.addColorStop(0, '#FFD700');
        textGradient.addColorStop(0.5, '#FFA500');
        textGradient.addColorStop(1, '#FFD700');
        
        ctx.fillStyle = textGradient;
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('COMPLETE', 0, 0);
        
        // 3. 描边 - 深金色边框
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        ctx.strokeText('COMPLETE', 0, 0);
        
        // 4. 内层高光 - 增强闪耀感
        ctx.shadowBlur = 0;
        ctx.globalAlpha = complete.alpha * 0.6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('COMPLETE', 0, -3);
        
        ctx.restore();
    }
};

if (window.VisualFX && typeof window.VisualFX.register === 'function') {
    window.VisualFX.register('golden', GoldenFX);
}

