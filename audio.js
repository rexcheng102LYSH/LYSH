// ================= 音频引擎 (Audio Engine) =================
// [Alpha 0.7.8.2]
// - DJ 三阶段系统：挑战、失败、胜利
// - 实现 playKick (强劲底鼓) 与 playMiss (失误音效)
// - 内置挑战旋律与胜利旋律

const SoundEngine = {
    ctx: null, 
    isMuted: false, 
    isPlaying: false,
    
    musicVolume: 0.5, 
    sfxVolume: 1.0,
    ambientVolume: 1.0, 
    
    currentTrack: 'origin', 
    bgmTimeout: null,
    
    mp3Audio: null,
    ambientAudio: null, 
    isCritical: false,

    // [New] DJ 节奏游戏状态 - 三阶段系统
    djGame: {
        active: false,
        phase: 'idle', // 'challenge', 'fail', 'victory'
        startTime: 0,
        beatDuration: 0.6, // 100 BPM
        nextNoteTime: 0,
        noteIndex: 0,
        schedulerID: null,
        
        // 挑战阶段数据
        challengeBeats: [], // 需要玩家击打的节拍时间点
        totalBeats: 8, // 总共8个节拍
        hitBeats: 0, // 成功击中的节拍数
        missedBeats: 0, // 错过的节拍数
        
        // 胜利阶段数据
        victoryStartTime: 0,
        autoKickInterval: null
    },

    init: function() { 
        if (this.ctx) return; 
        const AC = window.AudioContext || window.webkitAudioContext; 
        this.ctx = new AC(); 
        this.startBGM();
        if (window.BackgroundEngine && window.BackgroundEngine.activeSeason === 'spring') {
            this.playAmbient();
        }
    },
    
    toggle: function() { 
        if (!this.ctx) this.init(); 
        this.isMuted = !this.isMuted; 
        document.querySelector('.sound-toggle').innerText = this.isMuted ? '🔇' : '🎵'; 
        if (this.isMuted) {
            this.stopBGM();
            this.stopAmbient();
            this.stopDJGame(); // 確保 DJ 遊戲也被靜音
        } else {
            this.startBGM();
            if (window.BackgroundEngine && window.BackgroundEngine.activeSeason === 'spring') {
                this.playAmbient();
            }
        }
    },

    setMusicVolume: function(v) {
        this.musicVolume = v;
        if(this.mp3Audio) this.mp3Audio.volume = v;
    },

    setAmbientVolume: function(v) {
        this.ambientVolume = v;
        if (this.ambientAudio) this.ambientAudio.volume = v;
    },

    setCritical: function(critical) {
        this.isCritical = critical;
    },

    // =========================================
    // 🎹 基础合成器
    // =========================================
    
    playNote: function(freq, duration, type, volume, attack=0.01, release=0.1, detune=0) {
        if (this.isMuted || !this.ctx || volume <= 0) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const now = this.ctx.currentTime;
        
        o.type = type;
        o.frequency.setValueAtTime(freq, now);
        if (detune !== 0) o.detune.setValueAtTime(detune, now);
        
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(volume, now + attack); 
        g.gain.exponentialRampToValueAtTime(0.001, now + duration + release); 
        
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start();
        o.stop(now + duration + release + 0.1);
        return o; 
    },

    playNoise: function(duration, volume, filterType='lowpass', filterFreq=1000) {
        if (this.isMuted || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2; 
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; 
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start();
        noise.stop(this.ctx.currentTime + duration + 0.1);
        return { noise, filter, gain };
    },

    // =========================================
    // 🥁 DJ 节奏游戏专用音效
    // =========================================

    // 1. 强劲底鼓 (Kick) - 完美判定时触发
    playKick: function() {
        if (this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;
        
        // 低频冲击
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
        g.gain.setValueAtTime(1.0 * this.sfxVolume, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(t);
        o.stop(t + 0.5);

        // 增加一点高频 Click 增加打击感
        this.playNoise(0.05, 0.3 * this.sfxVolume, 'highpass', 4000);
    },

    // 2. 失误音效 (Miss) - 尴尬的走调/弱音
    playMiss: function() {
        if (this.isMuted || !this.ctx) return;
        // 类似弹簧或者错误的闷响
        this.playNote(100, 0.2, 'sawtooth', 0.1 * this.sfxVolume, 0.01, 0.2, -500); 
    },

    // =========================================
    // 🎵 DJ 三階段系統
    // =========================================
    
    // 啟動 DJ 挑戰模式
    startDJChallenge: function() {
        if (this.isMuted || !this.ctx) return;
        this.stopBGM();
        
        const dj = this.djGame;
        dj.active = true;
        dj.phase = 'challenge';
        dj.startTime = this.ctx.currentTime;
        dj.noteIndex = 0;
        dj.hitBeats = 0;
        dj.missedBeats = 0;
        dj.challengeBeats = [];
        
        // 生成8个节拍的挑战时间点
        for (let i = 0; i < dj.totalBeats; i++) {
            dj.challengeBeats.push({
                time: dj.startTime + 1.0 + (i * dj.beatDuration), // 1秒延遲開始
                hit: false,
                missed: false
            });
        }
        
        dj.nextNoteTime = dj.startTime + 0.1;
        this.djScheduler();
        
        // 播放挑戰旋律
        this.playChallengemelody();
    },
    
    // DJ 调度器
    djScheduler: function() {
        // [CRITICAL FIX] 超级安全的 DJ 调度器 - 防止所有可能的崩溃
        const dj = this.djGame;
        
        // [CRITICAL FIX] 多层安全检查，防止访问未定义的对象
        if (!dj || typeof dj !== 'object') {
            console.warn('[DJ调度器] djGame 对象不存在，停止调度');
            return;
        }
        
        if (!dj.active || dj.phase !== 'challenge') {
            if (dj.schedulerID) {
                clearTimeout(dj.schedulerID);
                dj.schedulerID = null;
            }
            return;
        }
        
        // [CRITICAL FIX] 安全检查音频上下文
        if (!this.ctx || typeof this.ctx.currentTime !== 'number') {
            console.warn('[DJ调度器] 音频上下文异常，停止调度');
            if (dj.schedulerID) {
                clearTimeout(dj.schedulerID);
                dj.schedulerID = null;
            }
            return;
        }
        
        try {
            const currentTime = this.ctx.currentTime;
            const lookahead = 0.1;
            
            // [CRITICAL FIX] 安全检查挑战节拍数组
            if (!dj.challengeBeats || !Array.isArray(dj.challengeBeats)) {
                console.warn('[DJ调度器] 挑战节拍数据异常，停止调度');
                return;
            }
            
            // [CRITICAL FIX] 安全检查是否有节拍被错过
            let shouldFail = false;
            dj.challengeBeats.forEach(beat => {
                if (beat && typeof beat.time === 'number' && 
                    !beat.hit && !beat.missed && 
                    currentTime > beat.time + 0.4) {
                    
                    beat.missed = true;
                    if (typeof dj.missedBeats === 'number') {
                        dj.missedBeats++;
                    } else {
                        dj.missedBeats = 1;
                    }
                    
                    shouldFail = true;
                    
                    // 安全调用回调函数
                    try {
                        if (typeof window.djMissCallback === 'function') {
                            window.djMissCallback();
                        }
                    } catch (callbackError) {
                        console.warn('[DJ调度器] MISS 回调错误:', callbackError);
                    }
                }
            });
            
            if (shouldFail) {
                // 延迟触发失败，让 MISS 文字有时间显示
                setTimeout(() => {
                    try {
                        if (dj.schedulerID) {
                            clearTimeout(dj.schedulerID);
                            dj.schedulerID = null;
                        }
                        this.startDJFailure();
                    } catch (failureError) {
                        console.error('[DJ调度器] 失败处理错误:', failureError);
                    }
                }, 100);
                return;
            }
            
            // [CRITICAL FIX] 安全的节拍调度 - 避免无限循环
            this.safeScheduleBeats(dj, currentTime, lookahead);
            
            // [CRITICAL FIX] 安全检查挑战完成状态
            let allBeatsHit = true;
            for (let beat of dj.challengeBeats) {
                if (!beat || !beat.hit) {
                    allBeatsHit = false;
                    break;
                }
            }
            
            if (allBeatsHit) {
                if (dj.schedulerID) {
                    clearTimeout(dj.schedulerID);
                    dj.schedulerID = null;
                }
                // 全部击中，进入胜利阶段
                try {
                    this.startDJVictory();
                } catch (victoryError) {
                    console.error('[DJ调度器] 胜利处理错误:', victoryError);
                }
                return;
            }
            
            // [CRITICAL FIX] 安全的递归调度
            if (dj.active && dj.phase === 'challenge') {
                dj.schedulerID = setTimeout(() => {
                    try {
                        this.djScheduler();
                    } catch (recursiveError) {
                        console.error('[DJ调度器] 递归调度错误:', recursiveError);
                        // 停止调度，防止无限错误
                        if (dj.schedulerID) {
                            clearTimeout(dj.schedulerID);
                            dj.schedulerID = null;
                        }
                    }
                }, 25);
            }
            
        } catch (schedulerError) {
            console.error('[DJ调度器] 整体错误:', schedulerError);
            // 清理调度器，防止继续出错
            if (dj && dj.schedulerID) {
                clearTimeout(dj.schedulerID);
                dj.schedulerID = null;
            }
        }
    },
    
    // [NEW] 安全的节拍调度函数 - 防止无限循环
    safeScheduleBeats: function(dj, currentTime, lookahead) {
        try {
            // [CRITICAL FIX] 限制调度次数，防止无限循环
            let scheduleCount = 0;
            const maxSchedules = 5; // 最多一次调度5个节拍
            
            while (scheduleCount < maxSchedules && 
                   typeof dj.nextNoteTime === 'number' && 
                   dj.nextNoteTime < currentTime + lookahead) {
                
                // [CRITICAL FIX] 安全检查时间合理性
                if (dj.nextNoteTime > currentTime + 10) {
                    console.warn('[DJ调度器] nextNoteTime 异常，重置时间');
                    dj.nextNoteTime = currentTime;
                    break;
                }
                
                try {
                    this.playBackgroundBeat(dj.nextNoteTime, dj.noteIndex || 0);
                } catch (beatError) {
                    console.warn('[DJ调度器] 背景节拍播放错误:', beatError);
                }
                
                // 安全更新时间和索引
                if (typeof dj.beatDuration === 'number' && dj.beatDuration > 0) {
                    dj.nextNoteTime += dj.beatDuration;
                } else {
                    dj.nextNoteTime += 0.6; // 默认节拍间隔
                }
                
                if (typeof dj.noteIndex === 'number') {
                    dj.noteIndex++;
                } else {
                    dj.noteIndex = 1;
                }
                
                scheduleCount++;
            }
        } catch (scheduleError) {
            console.error('[DJ调度器] 节拍调度错误:', scheduleError);
        }
    },
    
    // 玩家击鼓判定
    djPlayerHit: function() {
        // [CRITICAL FIX] 超级安全的玩家击鼓判定 - 防止所有可能的崩溃
        const dj = this.djGame;
        
        // [CRITICAL FIX] 多层安全检查
        if (!dj || typeof dj !== 'object') {
            console.log('[DJ判定] djGame 对象不存在');
            return false;
        }
        
        if (!dj.active || dj.phase !== 'challenge') {
            console.log('[DJ判定] 游戏未激活或不在挑战阶段');
            return false;
        }
        
        // [CRITICAL FIX] 安全检查音频上下文
        if (!this.ctx || typeof this.ctx.currentTime !== 'number') {
            console.log('[DJ判定] 音频上下文异常');
            return false;
        }
        
        try {
            const currentTime = this.ctx.currentTime;
            const hitWindow = 0.4; // 【翻倍】前后各 400ms 判定窗口
            
            console.log('[DJ判定] 点击时间:', currentTime.toFixed(3));
            
            // [CRITICAL FIX] 安全检查挑战节拍数组
            if (!dj.challengeBeats || !Array.isArray(dj.challengeBeats)) {
                console.log('[DJ判定] 挑战节拍数据异常');
                return false;
            }
            
            // 寻找最近的未击中节拍
            let nearestBeat = null;
            let nearestDiff = Infinity;
            
            for (let beat of dj.challengeBeats) {
                // [CRITICAL FIX] 安全检查每个节拍对象
                if (!beat || typeof beat.time !== 'number' || beat.hit || beat.missed) {
                    continue;
                }
                
                const timeDiff = Math.abs(currentTime - beat.time);
                console.log('[DJ判定] 节拍时间:', beat.time.toFixed(3), '差距:', timeDiff.toFixed(3));
                
                if (timeDiff < nearestDiff) {
                    nearestDiff = timeDiff;
                    nearestBeat = beat;
                }
            }
            
            // 如果没有节拍接近，算提前点击 = MISS
            if (!nearestBeat) {
                console.log('[DJ判定] ❌ 没有节拍接近 → MISS');
                this.handleDJMiss(dj);
                return false;
            }
            
            // 计算相对时间（负数 = 提前，正数 = 延迟）
            const timeDiff = currentTime - nearestBeat.time;
            
            console.log('[DJ判定] 最近节拍:', nearestBeat.time.toFixed(3), '相对时间:', timeDiff.toFixed(3), '判定窗口:', hitWindow);
            
            // 判定窗口：前后各 400ms
            if (Math.abs(timeDiff) <= hitWindow) {
                // 成功击中！
                console.log('[DJ判定] ✅ 成功击中！');
                nearestBeat.hit = true;
                
                // 安全更新击中计数
                if (typeof dj.hitBeats === 'number') {
                    dj.hitBeats++;
                } else {
                    dj.hitBeats = 1;
                }
                
                // 安全播放击鼓音效
                try {
                    this.playKick();
                } catch (kickError) {
                    console.warn('[DJ判定] 击鼓音效播放错误:', kickError);
                }
                
                return true;
            }
            
            // 超出判定窗口 = MISS
            console.log('[DJ判定] ❌ 超出判定窗口 → MISS');
            this.handleDJMiss(dj);
            return false;
            
        } catch (hitError) {
            console.error('[DJ判定] 击鼓判定错误:', hitError);
            return false;
        }
    },
    
    // [NEW] 安全的 MISS 处理函数
    handleDJMiss: function(dj) {
        try {
            // 安全播放 MISS 音效
            try {
                this.playMiss();
            } catch (missAudioError) {
                console.warn('[DJ判定] MISS 音效播放错误:', missAudioError);
            }
            
            // 安全更新错过计数
            if (typeof dj.missedBeats === 'number') {
                dj.missedBeats++;
            } else {
                dj.missedBeats = 1;
            }
            
            // 安全调用 MISS 回调
            try {
                if (typeof window.djMissCallback === 'function') {
                    window.djMissCallback();
                }
            } catch (missCallbackError) {
                console.warn('[DJ判定] MISS 回调错误:', missCallbackError);
            }
            
            // 安全停止调度器并触发失败
            try {
                if (dj.schedulerID) {
                    clearTimeout(dj.schedulerID);
                    dj.schedulerID = null;
                }
                this.startDJFailure();
            } catch (failureError) {
                console.error('[DJ判定] 失败处理错误:', failureError);
            }
            
        } catch (missHandleError) {
            console.error('[DJ判定] MISS 处理整体错误:', missHandleError);
        }
    },
    
    // 挑戰階段旋律（电音前奏 + 副歌预告 - 5秒，8拍，100 BPM）
    playChallengemelody: function() {
        const startTime = this.ctx.currentTime + 1.0;
        const beatDuration = 0.6; // 100 BPM = 600ms per beat
        
        // === 第1層：Sub Bass 基础（保持电音根基）===
        for (let i = 0; i < 8; i++) {
            const t = startTime + (i * beatDuration);
            const freq = 50 + (i * 3); // 50Hz → 71Hz 渐进
            this.playNote(freq, 0.4, 'sine', 0.5 * this.musicVolume, 0.01, 0.3);
            
            if (i % 2 === 0) {
                this.playNote(freq * 2, 0.2, 'sawtooth', 0.3 * this.musicVolume, 0.01, 0.15);
            }
        }
        
        // === 第2層：Catchy Hook 主旋律（副歌预告）===
        const hookMelody = [
            // 第一句 (0-1.2秒): C-E-G 上行
            {freq: 523.25, time: 0.0, duration: 0.3},   // C5
            {freq: 659.25, time: 0.3, duration: 0.3},   // E5
            {freq: 783.99, time: 0.6, duration: 0.6},   // G5 (延长)
            
            // 第二句 (1.2-2.4秒): G-F-E-D 下行
            {freq: 783.99, time: 1.2, duration: 0.2},   // G5
            {freq: 698.46, time: 1.4, duration: 0.2},   // F5
            {freq: 659.25, time: 1.6, duration: 0.2},   // E5
            {freq: 587.33, time: 1.8, duration: 0.6},   // D5 (延长)
            
            // 第三句 (2.4-3.6秒): C-D-E-F 上行递进
            {freq: 523.25, time: 2.4, duration: 0.2},   // C5
            {freq: 587.33, time: 2.6, duration: 0.2},   // D5
            {freq: 659.25, time: 2.8, duration: 0.2},   // E5
            {freq: 698.46, time: 3.0, duration: 0.6},   // F5 (延长)
            
            // 第四句 (3.6-4.8秒): 高潮预告 G-A-B-C
            {freq: 783.99, time: 3.6, duration: 0.15},  // G5
            {freq: 880.00, time: 3.75, duration: 0.15}, // A5
            {freq: 987.77, time: 3.9, duration: 0.15},  // B5
            {freq: 1046.50, time: 4.05, duration: 0.75} // C6 (最终预告)
        ];
        
        hookMelody.forEach(note => {
            const t = startTime + note.time;
            // 主旋律 - 使用 square 波形，电音感十足
            this.playNote(note.freq, note.duration, 'square', 0.25 * this.musicVolume, 0.01, 0.2);
            // 八度和声 - 增加丰富度
            this.playNote(note.freq * 2, note.duration * 0.7, 'triangle', 0.12 * this.musicVolume, 0.01, 0.15);
            // 低八度支撑
            this.playNote(note.freq * 0.5, note.duration, 'sawtooth', 0.08 * this.musicVolume, 0.02, 0.18);
        });
        
        // === 第3層：Arp 装饰（快速琶音装饰）===
        const arpNotes = [261.63, 329.63, 392.00, 523.25]; // C Major 四音
        for (let i = 0; i < 16; i++) {
            const t = startTime + (i * 0.3);
            const freq = arpNotes[i % 4] * (1 + Math.floor(i / 8)); // 每8个音符升八度
            this.playNote(freq, 0.1, 'triangle', 0.06 * this.musicVolume, 0.005, 0.08);
        }
        
        // === 第4層：Vocal Chop 效果（模拟人声切片）===
        const vocalChops = [
            {freq: 440.00, time: 0.5, duration: 0.08},   // A4
            {freq: 523.25, time: 1.1, duration: 0.08},   // C5
            {freq: 659.25, time: 1.7, duration: 0.08},   // E5
            {freq: 783.99, time: 2.3, duration: 0.08},   // G5
            {freq: 880.00, time: 2.9, duration: 0.08},   // A5
            {freq: 1046.50, time: 3.5, duration: 0.08},  // C6
            {freq: 1318.51, time: 4.1, duration: 0.08}   // E6
        ];
        
        vocalChops.forEach(chop => {
            const t = startTime + chop.time;
            // 使用 bandpass 滤波器模拟人声频段
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(chop.freq, t);
            
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, t);
            filter.Q.value = 8;
            
            gain.gain.setValueAtTime(0.15 * this.musicVolume, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + chop.duration);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + chop.duration);
        });
        
        // === 第5層：Filter Sweep 张力建立===
        const filterSweep = this.ctx.createOscillator();
        const filterGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        filterSweep.type = 'sawtooth';
        filterSweep.frequency.setValueAtTime(65.41, startTime); // C2
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, startTime);
        filter.frequency.exponentialRampToValueAtTime(6000, startTime + 4.8);
        filter.Q.value = 12;
        
        filterGain.gain.setValueAtTime(0, startTime);
        filterGain.gain.linearRampToValueAtTime(0.3 * this.musicVolume, startTime + 2.0);
        filterGain.gain.linearRampToValueAtTime(0.5 * this.musicVolume, startTime + 4.5);
        filterGain.gain.exponentialRampToValueAtTime(0.01, startTime + 4.8);
        
        filterSweep.connect(filter);
        filter.connect(filterGain);
        filterGain.connect(this.ctx.destination);
        
        filterSweep.start(startTime);
        filterSweep.stop(startTime + 4.8);
        
        // === 第6層：极简节拍（为玩家交互留空间）===
        for (let i = 0; i < 8; i++) {
            const t = startTime + (i * beatDuration);
            if (i % 2 === 1) {
                this.playNoise(0.03, 0.1 * this.musicVolume, 'highpass', 12000);
            }
        }
    },
    
    // 背景節奏（Bass + Hi-hat）
    playBackgroundBeat: function(time, index) {
        // Bass on every beat
        if (index % 2 === 0) {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(65.41, time); // C2
            g.gain.setValueAtTime(0.2 * this.musicVolume, time);
            g.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            o.connect(g);
            g.connect(this.ctx.destination);
            o.start(time);
            o.stop(time + 0.35);
        }
        
        // Hi-hat on off-beats
        if (index % 2 === 1) {
            const bufferSize = this.ctx.sampleRate * 0.05;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(8000, time);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.08 * this.musicVolume, time);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(time);
        }
    },
    
    // 失败阶段：沉默与虚无
    startDJFailure: function() {
        const dj = this.djGame;
        dj.phase = 'fail';
        dj.active = false;
        
        // 【修复】播放明显的失败音效
        // 低沉的下降音阶 + 不和谐音
        const now = this.ctx.currentTime;
        
        // 第1层：下降音阶（C -> G -> C低八度）
        this.playNote(261.63, 0.3, 'sawtooth', 0.4 * this.musicVolume, 0.05, 0.2, now);
        this.playNote(196.00, 0.3, 'sawtooth', 0.4 * this.musicVolume, 0.05, 0.2, now + 0.15);
        this.playNote(130.81, 0.6, 'sawtooth', 0.5 * this.musicVolume, 0.1, 0.4, now + 0.3);
        
        // 第2层：不和谐的噪音
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 3);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2 * this.musicVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        
        // 通知 fx.js 进入失败阶段
        if (typeof window.djFailCallback === 'function') {
            window.djFailCallback();
        }
    },
    
    // 勝利階段：自動擊鼓 + 勝利旋律
    startDJVictory: function() {
        const dj = this.djGame;
        dj.phase = 'victory';
        dj.victoryStartTime = this.ctx.currentTime;
        
        // 播放勝利旋律
        this.playVictoryMelody();
        
        // 自動擊鼓（每0.6秒一次）
        let kickCount = 0;
        dj.autoKickInterval = setInterval(() => {
            if (kickCount < 12) { // 持續12次擊鼓
                this.playKick();
                kickCount++;
                // 通知 fx.js 自動擊鼓
                if (typeof window.djAutoKickCallback === 'function') {
                    window.djAutoKickCallback();
                }
            } else {
                clearInterval(dj.autoKickInterval);
            }
        }, 600);
        
        // 通知 fx.js 進入勝利狀態
        if (typeof window.djVictoryCallback === 'function') {
            window.djVictoryCallback();
        }
    },
    
    // 勝利旋律（副歌爆发 + 狂欢高潮 - 7秒，12拍，100 BPM）
    playVictoryMelody: function() {
        const startTime = this.ctx.currentTime;
        const beatDuration = 0.6; // 100 BPM = 600ms per beat
        
        // === 第1層：Hardstyle Kick 基础（保持电音根基）===
        for (let i = 0; i < 12; i++) {
            const t = startTime + (i * beatDuration);
            
            const kick = this.ctx.createOscillator();
            const kickGain = this.ctx.createGain();
            const kickFilter = this.ctx.createBiquadFilter();
            
            kick.type = 'sine';
            kick.frequency.setValueAtTime(65, t);
            kick.frequency.exponentialRampToValueAtTime(0.1, t + 0.25);
            
            kickFilter.type = 'lowpass';
            kickFilter.frequency.setValueAtTime(250, t);
            kickFilter.Q.value = 0.8;
            
            kickGain.gain.setValueAtTime(1.0 * this.musicVolume, t);
            kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
            
            kick.connect(kickFilter);
            kickFilter.connect(kickGain);
            kickGain.connect(this.ctx.destination);
            kick.start(t);
            kick.stop(t + 0.25);
        }
        
        // === 第2層：Super Saw 副歌（完整副歌爆发）===
        const chorusMelody = [
            // 第一轮副歌 (0-2.4秒): 完整 Hook 旋律
            {freq: 1046.50, time: 0.0, duration: 0.3},   // C6 - 副歌开始！
            {freq: 1318.51, time: 0.3, duration: 0.3},   // E6
            {freq: 1567.98, time: 0.6, duration: 0.6},   // G6 (延长)
            {freq: 1567.98, time: 1.2, duration: 0.2},   // G6
            {freq: 1396.91, time: 1.4, duration: 0.2},   // F6
            {freq: 1318.51, time: 1.6, duration: 0.2},   // E6
            {freq: 1174.66, time: 1.8, duration: 0.6},   // D6 (延长)
            
            // 第二轮副歌 (2.4-4.8秒): 高八度变化
            {freq: 2093.00, time: 2.4, duration: 0.2},   // C7 - 更高！
            {freq: 2349.32, time: 2.6, duration: 0.2},   // D7
            {freq: 2637.02, time: 2.8, duration: 0.2},   // E7
            {freq: 2793.83, time: 3.0, duration: 0.6},   // F7 (延长)
            {freq: 3135.96, time: 3.6, duration: 0.15},  // G7
            {freq: 3520.00, time: 3.75, duration: 0.15}, // A7
            {freq: 3951.07, time: 3.9, duration: 0.15},  // B7
            {freq: 4186.01, time: 4.05, duration: 0.75}, // C8 (高潮)
            
            // 第三轮副歌 (4.8-7.2秒): 终极狂欢
            {freq: 4186.01, time: 4.8, duration: 0.2},   // C8
            {freq: 5274.04, time: 5.0, duration: 0.2},   // E8
            {freq: 6271.93, time: 5.2, duration: 0.3},   // G8
            {freq: 8372.02, time: 5.5, duration: 0.3},   // C9 - 接近极限
            {freq: 7040.00, time: 5.8, duration: 0.2},   // A8
            {freq: 6271.93, time: 6.0, duration: 0.2},   // G8
            {freq: 5274.04, time: 6.2, duration: 0.2},   // E8
            {freq: 8372.02, time: 6.4, duration: 0.8}    // C9 - 终极收尾
        ];
        
        chorusMelody.forEach(note => {
            const t = startTime + note.time;
            // Super Saw 主旋律（多层锯齿波叠加）
            this.playNote(note.freq, note.duration, 'sawtooth', 0.3 * this.musicVolume, 0.002, 0.2);
            this.playNote(note.freq * 1.01, note.duration, 'sawtooth', 0.25 * this.musicVolume, 0.002, 0.2); // 轻微失谐
            this.playNote(note.freq * 0.99, note.duration, 'sawtooth', 0.25 * this.musicVolume, 0.002, 0.2); // 轻微失谐
            
            // 低八度支撑
            this.playNote(note.freq * 0.5, note.duration, 'sawtooth', 0.15 * this.musicVolume, 0.005, 0.18);
            
            // 高频装饰
            this.playNote(note.freq * 2, note.duration * 0.5, 'triangle', 0.08 * this.musicVolume, 0.001, 0.1);
        });
        
        // === 第3層：Counter Melody 对位旋律===
        const counterMelody = [
            {freq: 783.99, time: 0.15, duration: 0.25},  // G5
            {freq: 880.00, time: 0.45, duration: 0.25},  // A5
            {freq: 987.77, time: 0.75, duration: 0.45},  // B5
            {freq: 659.25, time: 1.35, duration: 0.25},  // E5
            {freq: 698.46, time: 1.65, duration: 0.25},  // F5
            {freq: 523.25, time: 1.95, duration: 0.45},  // C5
            
            {freq: 1567.98, time: 2.55, duration: 0.25}, // G6
            {freq: 1760.00, time: 2.85, duration: 0.25}, // A6
            {freq: 1975.53, time: 3.15, duration: 0.45}, // B6
            {freq: 1318.51, time: 3.75, duration: 0.25}, // E6
            {freq: 1396.91, time: 4.05, duration: 0.25}, // F6
            {freq: 1046.50, time: 4.35, duration: 0.45}, // C6
            
            {freq: 3135.96, time: 4.95, duration: 0.25}, // G7
            {freq: 3520.00, time: 5.25, duration: 0.25}, // A7
            {freq: 3951.07, time: 5.55, duration: 0.35}, // B7
            {freq: 2637.02, time: 5.95, duration: 0.25}, // E7
            {freq: 2793.83, time: 6.25, duration: 0.25}, // F7
            {freq: 2093.00, time: 6.55, duration: 0.65}  // C7
        ];
        
        counterMelody.forEach(note => {
            const t = startTime + note.time;
            this.playNote(note.freq, note.duration, 'square', 0.12 * this.musicVolume, 0.01, 0.15);
        });
        
        // === 第4層：Pluck 节奏（短促拨弦音色）===
        for (let i = 0; i < 24; i++) {
            const t = startTime + (i * 0.3);
            const pluckFreqs = [261.63, 329.63, 392.00, 523.25]; // C Major
            const freq = pluckFreqs[i % 4] * (1 + Math.floor(i / 12)); // 每12个音符升八度
            
            // 短促的 Pluck 音色
            const pluck = this.ctx.createOscillator();
            const pluckGain = this.ctx.createGain();
            const pluckFilter = this.ctx.createBiquadFilter();
            
            pluck.type = 'triangle';
            pluck.frequency.setValueAtTime(freq, t);
            
            pluckFilter.type = 'highpass';
            pluckFilter.frequency.setValueAtTime(800, t);
            pluckFilter.Q.value = 2;
            
            pluckGain.gain.setValueAtTime(0.15 * this.musicVolume, t);
            pluckGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            
            pluck.connect(pluckFilter);
            pluckFilter.connect(pluckGain);
            pluckGain.connect(this.ctx.destination);
            pluck.start(t);
            pluck.stop(t + 0.1);
        }
        
        // === 第5層：Breakdown 桥段（中间情绪转换）===
        setTimeout(() => {
            // 在第6拍创造一个短暂的 Breakdown
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    // 反向 Reverb 效果
                    const breakdown = this.ctx.createOscillator();
                    const breakdownGain = this.ctx.createGain();
                    breakdown.type = 'sine';
                    breakdown.frequency.setValueAtTime(1046.50 * (i + 1), this.ctx.currentTime);
                    breakdownGain.gain.setValueAtTime(0, this.ctx.currentTime);
                    breakdownGain.gain.linearRampToValueAtTime(0.2 * this.musicVolume, this.ctx.currentTime + 0.3);
                    breakdownGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
                    breakdown.connect(breakdownGain);
                    breakdownGain.connect(this.ctx.destination);
                    breakdown.start();
                    breakdown.stop(this.ctx.currentTime + 0.6);
                }, i * 200);
            }
        }, 3000);
        
        // === 第6層：超密集电子鼓点===
        for (let i = 0; i < 24; i++) {
            const t = startTime + (i * 0.3);
            
            // Snare on off-beats
            if (i % 2 === 1) {
                this.playNoise(0.08, 0.4 * this.musicVolume, 'bandpass', 2800);
            }
            
            // Hi-hat 超密集
            this.playNoise(0.04, 0.15 * this.musicVolume, 'highpass', 14000);
            
            // Crash 每8拍
            if (i % 8 === 0) {
                this.playNoise(0.5, 0.6 * this.musicVolume, 'highpass', 6000);
            }
        }
        

    },
    
    // 停止 DJ 游戏
    stopDJGame: function() {
        const dj = this.djGame;
        if (!dj) return;
        
        console.log('[DJ] 开始停止 DJ 游戏，当前阶段:', dj.phase);
        
        // [CRITICAL FIX] 彻底停止所有 DJ 音频和定时器
        // 1. 立即标记为非活动状态，防止新的音频节点创建
        dj.active = false;
        
        // 2. 停止所有正在播放的音频节点
        if (this.ctx && this.ctx.state === 'running') {
            try {
                // [CRITICAL FIX] 创建一个短暂的静音来"冲洗"音频管道
                const silencer = this.ctx.createGain();
                silencer.gain.setValueAtTime(0, this.ctx.currentTime);
                silencer.connect(this.ctx.destination);
                // 立即断开，只是为了触发音频图的更新
                setTimeout(() => {
                    try {
                        silencer.disconnect();
                    } catch (e) {
                        // 忽略断开连接的错误
                    }
                }, 10);
            } catch (e) {
                console.log('[DJ] 音频清理异常:', e);
            }
        }
        
        // 3. [CRITICAL FIX] 强制清理所有计时器，防止内存泄漏
        if (dj.schedulerID) {
            clearTimeout(dj.schedulerID);
            dj.schedulerID = null;
            console.log('[DJ] 清理调度器定时器');
        }
        if (dj.autoKickInterval) {
            clearInterval(dj.autoKickInterval);
            dj.autoKickInterval = null;
            console.log('[DJ] 清理自动击鼓定时器');
        }
        
        // 4. [CRITICAL FIX] 重置 DJ 游戏状态（但保留胜利阶段的聚光灯）
        const wasVictory = (dj.phase === 'victory');
        
        // 重置挑战状态
        dj.challengeBeats = [];
        dj.missedBeats = 0;
        dj.hitBeats = 0;
        dj.nextNoteTime = 0;
        dj.noteIndex = 0;
        dj.startTime = 0;
        
        // [CRITICAL FIX] 如果不是胜利阶段，完全重置
        if (!wasVictory) {
            dj.phase = 'idle';
            console.log('[DJ] 非胜利状态，完全重置为 idle');
        } else {
            console.log('[DJ] 胜利状态，保持 victory 阶段');
        }
        
        // 5. [CRITICAL FIX] 清理全局回调函数，防止悬空引用
        if (typeof window !== 'undefined') {
            window.djMissCallback = null;
            window.djFailCallback = null;
            window.djVictoryCallback = null;
            window.djAutoKickCallback = null;
        }
        
        console.log('[DJ] DJ 游戏已完全停止，胜利聚光灯保持显示');
    },

    // =========================================
    // 🎵 情绪音效 (Mood SFX)
    // =========================================

    playDefeat: function() {
        if (this.isMuted || !this.ctx) return;
        const notes = [392.00, 311.13, 261.63, 196.00];
        notes.forEach((f, i) => {
            setTimeout(() => {
                this.playNote(f, 0.6, 'triangle', 0.2 * this.sfxVolume, 0.1, 0.8);
                this.playNote(f * 0.995, 0.6, 'sine', 0.1 * this.sfxVolume, 0.1, 0.8); 
            }, i * 350); 
        });
        setTimeout(() => {
            this.playNote(98.00, 1.5, 'sine', 0.15 * this.sfxVolume, 0.5, 2.0);
        }, 1200);
    },

    // 煙花爆炸音效（優化版）
    playFireworkBlast: function() {
        if (this.isMuted) return;
        
        const now = this.ctx.currentTime;
        
        // 第一層：爆炸衝擊聲 - 使用更高的頻率和更強的包絡，確保能聽到
        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(150, now);  // 提升到 150Hz，更容易聽到
        bass.frequency.exponentialRampToValueAtTime(60, now + 0.25);
        bassGain.gain.setValueAtTime(1.6 * this.sfxVolume, now);  // 調到 1.6
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        bass.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bass.start(now);
        bass.stop(now + 0.25);
        
        // 第二層：白噪聲爆裂聲（嘶嘶聲）- 調到 0
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(3000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(500, now + 0.5);
        noiseFilter.Q.value = 1;
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.0 * this.sfxVolume, now);  // 調到 1.0
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.5);
        
        // 第三層：高頻閃爍聲（啪啪聲）- 調到 0.02
        for (let i = 0; i < 3; i++) {
            const crackle = this.ctx.createOscillator();
            const crackleGain = this.ctx.createGain();
            const startTime = now + i * 0.05;
            
            crackle.type = 'square';
            crackle.frequency.setValueAtTime(1500 + Math.random() * 1000, startTime);
            crackleGain.gain.setValueAtTime(0.02 * this.sfxVolume, startTime);  // 調到 0.02
            crackleGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
            
            crackle.connect(crackleGain);
            crackleGain.connect(this.ctx.destination);
            crackle.start(startTime);
            crackle.stop(startTime + 0.08);
        }
    },

    // Legacy
    playStringPad: function(freq, duration, volume) {
        if (this.isMuted || !this.ctx) return;
        this.playNote(freq, duration, 'sawtooth', volume * 0.6, 0.2, 0.5);
    },

    playExplosion: function(duration = 1.0, filterFreq = 1000) {
        this.playNoise(duration, this.sfxVolume, 'lowpass', filterFreq);
    },

    tone: function(f, type, d, v=0.1) { this.playNote(f, d, type, v * this.sfxVolume, 0.01, 0.1); },
    playPlace: function() { this.tone(400, 'sine', 0.1, 0.3); },
    playSkill: function() { this.tone(600, 'triangle', 0.1, 0.2); setTimeout(() => this.tone(800, 'triangle', 0.2, 0.1), 100); },
    playError: function() { this.tone(150, 'sawtooth', 0.2, 0.2); },
    playChaos: function() { [800, 400, 600, 200].forEach((f, i) => setTimeout(() => this.tone(f, 'sawtooth', 0.1, 0.1), i * 60)); },

    playWinEffect: function(type) {
        if (type === 'lightning') this.playLightningSound();
        else if (type === 'gold') this.playGoldSound();
        else if (type === 'future') this.playFutureSound();
        else if (type === 'dj') { /* DJ 模式不播放固定音效，而是启动游戏 */ }
        else this.playWin(); 
    },

    playWin: function() { 
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.2, 0.4), i * 150)); 
    },
    
    playLightningSound: function() {
        if (this.isMuted || !this.ctx) return;
        this.playExplosion(2.5, 180);
        this.playExplosion(0.2, 4000);
        const now = this.ctx.currentTime;
        [0, 0.05, 0.1, 0.15, 0.2].forEach(offset => {
            const freq = 1000 + Math.random() * 2000;
            this.playNote(freq, 0.05, 'sawtooth', 0.15 * this.sfxVolume, 0.001, 0.05);
        });
    },

    playGoldSound: function() {
        if (this.isMuted || !this.ctx) return;
        const notes = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02];
        notes.forEach((f, i) => {
            setTimeout(() => {
                this.playNote(f, 0.3, 'sine', 0.2 * this.sfxVolume, 0.01, 0.4);
                this.playNote(f * 2, 0.1, 'triangle', 0.05 * this.sfxVolume, 0.01, 0.1);
            }, i * 60);
        });
    },

    playFutureSound: function() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const o = this.playNote(220, 0.5, 'square', 0.2 * this.sfxVolume, 0.05, 0.4);
        if(o) {
            o.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            o.frequency.exponentialRampToValueAtTime(440, now + 0.4);
        }
        this.playNote(110, 0.5, 'sawtooth', 0.1 * this.sfxVolume, 0.1, 0.3);
    },

    playGrandWin: function() { 
        [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 'square', 0.2, 0.4), i * 120)); 
    },

    switchTrack: function(track) {
        // [Fix Alpha 0.7.8.4] 改进音乐播放器独立性
        // 区分用户选择的音乐和游戏临时音乐
        
        const trackChanged = (this.currentTrack !== track);
        
        // 更新当前轨道
        this.currentTrack = track;
        
        // 如果轨道改变，重新启动音乐
        if (trackChanged) {
            if(this.isPlaying && !this.isMuted) {
                this.stopBGM();
                this.startBGM();
            } else if (!this.isMuted) {
                // 即使当前没有播放，也要启动新音乐
                this.startBGM();
            }
        }
    },

    startBGM: function() { 
        if(this.isMuted || this.isPlaying) return; 
        this.isPlaying = true; 
        if (this.currentTrack === 'bomb') this.playBombLoop();
        else if (this.currentTrack === 'origin') this.playOriginLoop();
        else this.playMp3Loop();
    },

    stopBGM: function() { 
        this.isPlaying = false; 
        clearTimeout(this.bgmTimeout); 
        if (this.mp3Audio) { 
            this.mp3Audio.pause(); 
            // [Fix Alpha 0.7.8.4] 彻底清空 mp3Audio 对象，防止背景音乐失效 bug
            this.mp3Audio = null; 
        }
    },

    playOriginLoop: function() {
        if(!this.isPlaying || this.currentTrack !== 'origin') return;
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00]; 
        const f = scale[Math.floor(Math.random() * scale.length)];
        const d = 2 + Math.random();
        if (this.ctx) this.playNote(f, d, 'sine', 0.03 * this.musicVolume, 0.5, 2.0);
        this.bgmTimeout = setTimeout(() => this.playOriginLoop(), d * 800);
    },

    playMp3Loop: function() {
        if (!this.mp3Audio) {
            let filename = 'bgm1.mp3'; 
            if (this.currentTrack === 'bgm1') filename = 'bgm1.mp3';
            else if (this.currentTrack === 'bgm2') filename = 'bgm2.mp3';
            else if (this.currentTrack === 'bgm3') filename = 'bgm3.mp3';
            else if (this.currentTrack === 'bgm4') filename = 'bgm4.mp3';
            
            this.mp3Audio = new Audio(filename); 
            this.mp3Audio.loop = true;
            this.mp3Audio.volume = this.musicVolume;
        }
        this.mp3Audio.play().catch(e => console.log("Waiting for interaction", e));
    },

    bombStep: 0,
    playBombLoop: function() {
        if(!this.isPlaying || this.currentTrack !== 'bomb') return;
        let stepTime = 1000; 
        if (!this.isCritical) {
            this.playNote(800, 0.05, 'square', 0.05 * this.musicVolume, 0.01, 0.05);
            if (this.bombStep % 4 === 0) {
                this.playStringPad(49.00, 2.5, 0.15 * this.musicVolume); 
                this.playStringPad(73.42, 2.5, 0.10 * this.musicVolume);
            }
        } else {
            stepTime = 500; 
            this.playNote(1200, 0.05, 'square', 0.08 * this.musicVolume, 0.005, 0.02);
            if (this.bombStep % 2 === 0) {
                this.playStringPad(783.99, 0.4, 0.1 * this.musicVolume); 
                this.playStringPad(1108.7, 0.4, 0.08 * this.musicVolume);
                this.playNote(3000 + Math.random()*1000, 0.1, 'sawtooth', 0.03 * this.musicVolume, 0.01, 0.1);
            }
        }
        this.bombStep++;
        this.bgmTimeout = setTimeout(() => this.playBombLoop(), stepTime);
    },

    playAmbient: function() {
        if (this.isMuted) return;
        if (!this.ambientAudio) {
            this.ambientAudio = new Audio('bgs1.mp3'); 
            this.ambientAudio.loop = true;
        }
        this.ambientAudio.volume = this.ambientVolume;
        if (this.ambientAudio.paused) {
            this.ambientAudio.play().catch(e => console.log("Ambient play blocked/waiting", e));
        }
    },

    stopAmbient: function() {
        if (this.ambientAudio) {
            this.ambientAudio.pause();
        }
    }
};