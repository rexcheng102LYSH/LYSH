// ================= Audio SFX =================
// ?????DJ??

window.AudioSFX = {
    install: function(target) {
        target.playNote = function(freq, duration, type, volume, attack=0.01, release=0.1, detune=0) {
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
        };
        target.playNoise = function(duration, volume, filterType='lowpass', filterFreq=1000) {
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
        };
        target.playKick = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // === 主体：升级版沙锤鼓 ===
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            
            o.frequency.setValueAtTime(150, t);
            o.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
            
            g.gain.setValueAtTime(1.2 * this.sfxVolume, t); // 稍微增强
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            
            o.connect(g);
            g.connect(this.ctx.destination);
            o.start(t);
            o.stop(t + 0.5);
    
            // === 升级：增强版高频 Click ===
            this.playNoise(0.08, 0.5 * this.sfxVolume, 'highpass', 4000); // 增强时长和音量
            
            // === 升级：添加低频支撑 ===
            const bass = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            
            bass.type = 'sine';
            bass.frequency.setValueAtTime(60, t);
            bass.frequency.exponentialRampToValueAtTime(0.1, t + 0.2);
            
            bassGain.gain.setValueAtTime(0.6 * this.sfxVolume, t);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            
            bass.connect(bassGain);
            bassGain.connect(this.ctx.destination);
            bass.start(t);
            bass.stop(t + 0.2);
        };
        target.playMiss = function() {
            if (this.isMuted || !this.ctx) return;
            // 类似弹簧或者错误的闷响
            this.playNote(100, 0.2, 'sawtooth', 0.1 * this.sfxVolume, 0.01, 0.2, -500); 
        };
        target.startDJChallenge = function() {
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
            // [保护] 音乐开始后的 500ms 内不触发 MISS
            dj.noMissUntil = this.ctx.currentTime + 0.5;
            
            // 生成7个奇数拍的挑战时间点（1、3、5、7、9、11、13拍，每1200ms间隔）
            for (let i = 0; i < dj.totalBeats; i++) {
                const beatNumber = (i * 2) + 1; // 奇数拍：1, 3, 5, 7, 9, 11, 13
                dj.challengeBeats.push({
                    time: dj.startTime + 1.0 + (i * 1.2), // 1秒延遲開始，每1200ms一拍
                    hit: false,
                    missed: false,
                    beatNumber: beatNumber // 记录拍号，便于调试
                });
            }
            
            dj.nextNoteTime = dj.startTime + 0.1;
            this.djScheduler();
            
            // 播放挑戰旋律
            // 【移除】this.playChallengemelody(); // 已被 bgm5.mp3 替代
        };
        target.djScheduler = function() {
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
                        currentTime >= (dj.noMissUntil || 0) &&
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
        };
        target.safeScheduleBeats = function(dj, currentTime, lookahead) {
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
        };
        target.djPlayerHit = function() {
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
                if (currentTime < (dj.noMissUntil || 0)) {
                    // 保护期内忽略误触
                    return false;
                }
                const hitWindow = 0.4; // 后判定窗口：400ms
                const preHitWindow = 0.35; // 前判定窗口：350ms
                
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
                
                console.log('[DJ判定] 最近节拍:', nearestBeat.time.toFixed(3), '相对时间:', timeDiff.toFixed(3), '前窗口:', preHitWindow, '后窗口:', hitWindow);
                
                // 判定窗口：前 350ms + 后 400ms（不对称窗口）
                if (timeDiff >= -preHitWindow && timeDiff <= hitWindow) {
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
        };
        target.handleDJMiss = function(dj) {
            try {
                if (this.ctx && typeof this.ctx.currentTime === 'number' && this.ctx.currentTime < (dj.noMissUntil || 0)) {
                    return;
                }
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
        };
        target.playChallengemelody = function() {
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
        };
        target.playBackgroundBeat = function(time, index) {
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
        };
        target.startDJFailure = function() {
            const dj = this.djGame;
            dj.phase = 'fail';
            dj.active = false;
            
            // 【补丁二】立即停止 bgm5.mp3
            if (this.victoryBGM) {
                try {
                    this.victoryBGM.pause();
                    this.victoryBGM.currentTime = 0;
                    this.victoryBGM = null;
                    console.log('[DJ失败] bgm5.mp3 已停止');
                } catch (e) {
                    console.warn('[DJ失败] bgm5.mp3 停止异常:', e);
                }
            }
            
            // 【补丁二】停止隐藏轨道
            this.stopHiddenTrack();
            
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
        };
        target.startDJVictory = function() {
            const dj = this.djGame;
            dj.phase = 'victory';
            dj.victoryStartTime = this.ctx.currentTime;
            
            // 播放勝利旋律（合成音效）
            // 【移除】this.playVictoryMelody(); // 已被 bgm5.mp3 替代
            
            // 【关键】从隐藏轨道无缝切换到可见轨道
            this.switchToVisibleTrack();
            
            // 通知 fx.js 進入勝利狀態
            if (typeof window.djVictoryCallback === 'function') {
                window.djVictoryCallback();
            }
        };
        target.switchToVisibleTrack = function() {
            const dj = this.djGame;
            const hiddenTrack = dj.hiddenTrack;
            
            // 停止隐藏轨道
            this.stopHiddenTrack();
            
            // 计算当前在 600ms 周期中的位置
            const elapsedTime = performance.now() - hiddenTrack.startTime;
            const beatPosition = elapsedTime % 600; // 当前节拍内的位置 (0-599ms)
            
            console.log(`[轨道切换] 隐藏轨道运行了 ${elapsedTime}ms，当前节拍位置: ${beatPosition}ms`);
            
            // 智能切换逻辑：确保 4/4 拍永远准确
            let nextBeatDelay;
            
            if (beatPosition <= 100) {
                // 如果在节拍开始的 100ms 内，立即开始（认为是准时的）
                nextBeatDelay = 0;
                console.log('[轨道切换] 接近节拍开始，立即切换');
            } else if (beatPosition >= 500) {
                // 如果在节拍结束的 100ms 内，等到下一个节拍开始
                nextBeatDelay = 600 - beatPosition;
                console.log(`[轨道切换] 接近节拍结束，等待 ${nextBeatDelay}ms 到下一节拍`);
            } else {
                // 在节拍中间，等到下一个节拍开始
                nextBeatDelay = 600 - beatPosition;
                console.log(`[轨道切换] 节拍中间，等待 ${nextBeatDelay}ms 到下一节拍`);
            }
            
            // 在计算出的时间启动可见轨道
            setTimeout(() => {
                // 启动可见轨道：有音效、有视觉反馈，严格按 600ms 节拍
                dj.autoKickInterval = setInterval(() => {
                    if (dj.phase === 'victory') {
                        this.playKick(); // 播放音效
                        // 通知 fx.js 自動擊鼓（视觉反馈）
                        if (typeof window.djAutoKickCallback === 'function') {
                            window.djAutoKickCallback();
                        }
                    }
                }, 600); // 胜利阶段保持 600ms 快节奏！
                
                console.log('[可见轨道] 已启动，4/4 拍节奏锁定');
            }, Math.max(0, nextBeatDelay));
        };
        target.startHiddenTrack = function() {
            const dj = this.djGame;
            const hiddenTrack = dj.hiddenTrack;
            
            // 重置隐藏轨道状态
            hiddenTrack.active = true;
            hiddenTrack.startTime = performance.now();
            hiddenTrack.beatCount = 0;
            
            // 清理可能存在的旧计时器
            if (hiddenTrack.kickInterval) {
                clearInterval(hiddenTrack.kickInterval);
            }
            
            // 启动隐藏轨道计时器 - 600ms 节拍，完全静默
            hiddenTrack.kickInterval = setInterval(() => {
                if (hiddenTrack.active) {
                    hiddenTrack.beatCount++;
                    // 隐藏轨道：无音效、无视觉反馈，只记录节拍
                    console.log(`[隐藏轨道] 节拍 ${hiddenTrack.beatCount} - ${performance.now() - hiddenTrack.startTime}ms`);
                }
            }, 600); // 100 BPM = 600ms per beat
            
            console.log('[隐藏轨道] 已启动，与 bgm5.mp3 同步');
        };
        target.stopHiddenTrack = function() {
            const hiddenTrack = this.djGame.hiddenTrack;
            
            if (hiddenTrack.kickInterval) {
                clearInterval(hiddenTrack.kickInterval);
                hiddenTrack.kickInterval = null;
            }
            
            hiddenTrack.active = false;
            console.log(`[隐藏轨道] 已停止，总计 ${hiddenTrack.beatCount} 个节拍`);
        };
        target.playVictoryMelody = function() {
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
            
    
        };
        target.stopDJGame = function() {
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
            
            // 6. [NEW] 清理胜利 BGM（bgm5.mp3）
            if (this.victoryBGM) {
                try {
                    this.victoryBGM.pause();
                    this.victoryBGM.currentTime = 0;
                    this.victoryBGM = null;
                    console.log('[DJ] 胜利 BGM 已清理');
                } catch (e) {
                    console.warn('[DJ] 胜利 BGM 清理异常:', e);
                }
            }
            
            // 7. [NEW] 清理流金 BGM（bgm6.mp3）
            if (this.goldenBGM) {
                try {
                    this.goldenBGM.pause();
                    this.goldenBGM.currentTime = 0;
                    this.goldenBGM = null;
                    console.log('[Golden] 流金 BGM 已清理');
                } catch (e) {
                    console.warn('[Golden] 流金 BGM 清理异常:', e);
                }
            }        
            // 7.1 [NEW] 清理烟花 BGM（bgm7.mp3）
            if (this.fireworksBGM) {
                try {
                    this.fireworksBGM.pause();
                    this.fireworksBGM.currentTime = 0;
                    this.fireworksBGM = null;
                    console.log('[Fireworks] 烟花 BGM 已清理');
                } catch (e) {
                    console.warn('[Fireworks] 烟花 BGM 清理异常:', e);
                }
            }
            
            // 8. [NEW] 清理隐藏轨道系统
            this.stopHiddenTrack();
    
            console.log('[DJ] DJ 游戏已完全停止，胜利聚光灯保持显示');
        };
        target.playDefeat = function() {
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
        };
        target.playFireworkBlast = function() {
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
        };
        target.playStringPad = function(freq, duration, volume) {
            if (this.isMuted || !this.ctx) return;
            this.playNote(freq, duration, 'sawtooth', volume * 0.6, 0.2, 0.5);
        };
        target.playExplosion = function(duration = 1.0, filterFreq = 1000) {
            this.playNoise(duration, this.sfxVolume, 'lowpass', filterFreq);
        };
        target.tone = function(f, type, d, v=0.1) { this.playNote(f, d, type, v * this.sfxVolume, 0.01, 0.1); },

        // [Alpha 0.7.9.3] 棋子打击感革命 - 黑子落子音效
        // 设计理念：黑曜石落木板 - 沉稳、厚重、有力
        target.playBlackStone = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // === 第1层：低频撞击主体（石头的重量感）===
            const impact = this.ctx.createOscillator();
            const impactGain = this.ctx.createGain();
            impact.type = 'sine';
            impact.frequency.setValueAtTime(120, t);
            impact.frequency.exponentialRampToValueAtTime(60, t + 0.08);
            impactGain.gain.setValueAtTime(0.5 * this.sfxVolume, t);
            impactGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
            impact.connect(impactGain);
            impactGain.connect(this.ctx.destination);
            impact.start(t);
            impact.stop(t + 0.15);
            
            // === 第2层：中频木质共鸣（棋盘的回响）===
            const wood = this.ctx.createOscillator();
            const woodGain = this.ctx.createGain();
            const woodFilter = this.ctx.createBiquadFilter();
            wood.type = 'triangle';
            wood.frequency.setValueAtTime(280, t);
            wood.frequency.exponentialRampToValueAtTime(180, t + 0.1);
            woodFilter.type = 'bandpass';
            woodFilter.frequency.setValueAtTime(300, t);
            woodFilter.Q.value = 3;
            woodGain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
            woodGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            wood.connect(woodFilter);
            woodFilter.connect(woodGain);
            woodGain.connect(this.ctx.destination);
            wood.start(t);
            wood.stop(t + 0.18);
            
            // === 第3层：高频瞬态点击（落子的"咔"声）===
            const click = this.ctx.createOscillator();
            const clickGain = this.ctx.createGain();
            click.type = 'square';
            click.frequency.setValueAtTime(1800, t);
            click.frequency.exponentialRampToValueAtTime(800, t + 0.02);
            clickGain.gain.setValueAtTime(0.15 * this.sfxVolume, t);
            clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
            click.connect(clickGain);
            clickGain.connect(this.ctx.destination);
            click.start(t);
            click.stop(t + 0.05);
            
            // === 第4层：噪音层（石头摩擦的质感）===
            const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.06, this.ctx.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseData.length; i++) {
                noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / noiseData.length * 4);
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(2000, t);
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(t);
        },

        // [Alpha 0.7.9.3] 棋子打击感革命 - 白子落子音效
        // 设计理念：白玉落木板 - 清脆、通透、优雅
        target.playWhiteStone = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // === 第1层：中频撞击主体（玉石的清脆感）===
            const impact = this.ctx.createOscillator();
            const impactGain = this.ctx.createGain();
            impact.type = 'sine';
            impact.frequency.setValueAtTime(200, t);
            impact.frequency.exponentialRampToValueAtTime(120, t + 0.06);
            impactGain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
            impactGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            impact.connect(impactGain);
            impactGain.connect(this.ctx.destination);
            impact.start(t);
            impact.stop(t + 0.12);
            
            // === 第2层：高频陶瓷质感（玉石的通透感）===
            const ceramic = this.ctx.createOscillator();
            const ceramicGain = this.ctx.createGain();
            ceramic.type = 'sine';
            ceramic.frequency.setValueAtTime(800, t);
            ceramic.frequency.exponentialRampToValueAtTime(500, t + 0.08);
            ceramicGain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
            ceramicGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
            ceramic.connect(ceramicGain);
            ceramicGain.connect(this.ctx.destination);
            ceramic.start(t);
            ceramic.stop(t + 0.15);
            
            // === 第3层：木质共鸣（棋盘的温暖回响）===
            const wood = this.ctx.createOscillator();
            const woodGain = this.ctx.createGain();
            const woodFilter = this.ctx.createBiquadFilter();
            wood.type = 'triangle';
            wood.frequency.setValueAtTime(350, t);
            wood.frequency.exponentialRampToValueAtTime(220, t + 0.1);
            woodFilter.type = 'bandpass';
            woodFilter.frequency.setValueAtTime(400, t);
            woodFilter.Q.value = 2;
            woodGain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
            woodGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
            wood.connect(woodFilter);
            woodFilter.connect(woodGain);
            woodGain.connect(this.ctx.destination);
            wood.start(t);
            wood.stop(t + 0.16);
            
            // === 第4层：高频闪烁（玉石的光泽感）===
            const shimmer = this.ctx.createOscillator();
            const shimmerGain = this.ctx.createGain();
            shimmer.type = 'sine';
            shimmer.frequency.setValueAtTime(2400, t);
            shimmer.frequency.exponentialRampToValueAtTime(1600, t + 0.03);
            shimmerGain.gain.setValueAtTime(0.12 * this.sfxVolume, t);
            shimmerGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            shimmer.connect(shimmerGain);
            shimmerGain.connect(this.ctx.destination);
            shimmer.start(t);
            shimmer.stop(t + 0.06);
            
            // === 第5层：轻微回响尾音（优雅的余韵）===
            const reverb = this.ctx.createOscillator();
            const reverbGain = this.ctx.createGain();
            reverb.type = 'sine';
            reverb.frequency.setValueAtTime(400, t + 0.05);
            reverb.frequency.exponentialRampToValueAtTime(300, t + 0.15);
            reverbGain.gain.setValueAtTime(0.08 * this.sfxVolume, t + 0.05);
            reverbGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            reverb.connect(reverbGain);
            reverbGain.connect(this.ctx.destination);
            reverb.start(t + 0.05);
            reverb.stop(t + 0.22);
        },

        // [Alpha 0.7.9.3] 自然棋子音效 - 落叶（枫叶）落子音效
        // 设计理念：秋叶飘落 - 沙沙声、轻柔、自然
        target.playMapleStone = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // === 第1层：沙沙的树叶摩擦声（主体）===
            const rustleBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.25, this.ctx.sampleRate);
            const rustleData = rustleBuffer.getChannelData(0);
            for (let i = 0; i < rustleData.length; i++) {
                // 模拟树叶沙沙声的不规则噪音
                const envelope = Math.sin(Math.PI * i / rustleData.length) * Math.exp(-i / rustleData.length * 2);
                rustleData[i] = (Math.random() * 2 - 1) * envelope;
            }
            const rustle = this.ctx.createBufferSource();
            rustle.buffer = rustleBuffer;
            const rustleFilter = this.ctx.createBiquadFilter();
            rustleFilter.type = 'bandpass';
            rustleFilter.frequency.setValueAtTime(3000, t);
            rustleFilter.Q.value = 1.5;
            const rustleGain = this.ctx.createGain();
            rustleGain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
            rustleGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
            rustle.connect(rustleFilter);
            rustleFilter.connect(rustleGain);
            rustleGain.connect(this.ctx.destination);
            rustle.start(t);
            
            // === 第2层：轻柔的落地声（叶子触地）===
            const land = this.ctx.createOscillator();
            const landGain = this.ctx.createGain();
            land.type = 'sine';
            land.frequency.setValueAtTime(180, t + 0.08);
            land.frequency.exponentialRampToValueAtTime(80, t + 0.18);
            landGain.gain.setValueAtTime(0.2 * this.sfxVolume, t + 0.08);
            landGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            land.connect(landGain);
            landGain.connect(this.ctx.destination);
            land.start(t + 0.08);
            land.stop(t + 0.22);
            
            // === 第3层：高频细节（叶脉的质感）===
            const detail = this.ctx.createOscillator();
            const detailGain = this.ctx.createGain();
            detail.type = 'triangle';
            detail.frequency.setValueAtTime(1200, t);
            detail.frequency.exponentialRampToValueAtTime(600, t + 0.1);
            detailGain.gain.setValueAtTime(0.1 * this.sfxVolume, t);
            detailGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
            detail.connect(detailGain);
            detailGain.connect(this.ctx.destination);
            detail.start(t);
            detail.stop(t + 0.15);
            
            // === 第4层：风的余韵（自然氛围）===
            const windBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
            const windData = windBuffer.getChannelData(0);
            for (let i = 0; i < windData.length; i++) {
                windData[i] = (Math.random() * 2 - 1) * Math.exp(-i / windData.length * 3) * 0.3;
            }
            const wind = this.ctx.createBufferSource();
            wind.buffer = windBuffer;
            const windFilter = this.ctx.createBiquadFilter();
            windFilter.type = 'lowpass';
            windFilter.frequency.setValueAtTime(800, t + 0.1);
            const windGain = this.ctx.createGain();
            windGain.gain.setValueAtTime(0.15 * this.sfxVolume, t + 0.1);
            windGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
            wind.connect(windFilter);
            windFilter.connect(windGain);
            windGain.connect(this.ctx.destination);
            wind.start(t + 0.1);
        },

        // [Alpha 0.7.9.3] 自然棋子音效 - 太阳落子音效
        // 设计理念：阳光照耀 - 温暖、明亮、光辉扩散
        target.playSunStone = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // === 第1层：温暖的光辉主体（明亮的正弦波）===
            const glow = this.ctx.createOscillator();
            const glowGain = this.ctx.createGain();
            glow.type = 'sine';
            glow.frequency.setValueAtTime(600, t);
            glow.frequency.exponentialRampToValueAtTime(400, t + 0.15);
            glowGain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
            glowGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            glow.connect(glowGain);
            glowGain.connect(this.ctx.destination);
            glow.start(t);
            glow.stop(t + 0.22);
            
            // === 第2层：高频闪烁（阳光的闪耀感）===
            const sparkle = this.ctx.createOscillator();
            const sparkleGain = this.ctx.createGain();
            sparkle.type = 'sine';
            sparkle.frequency.setValueAtTime(2000, t);
            sparkle.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
            sparkleGain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
            sparkleGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            sparkle.connect(sparkleGain);
            sparkleGain.connect(this.ctx.destination);
            sparkle.start(t);
            sparkle.stop(t + 0.12);
            
            // === 第3层：和声泛音（光芒的层次感）===
            const harmonic = this.ctx.createOscillator();
            const harmonicGain = this.ctx.createGain();
            harmonic.type = 'triangle';
            harmonic.frequency.setValueAtTime(1200, t);
            harmonic.frequency.exponentialRampToValueAtTime(800, t + 0.12);
            harmonicGain.gain.setValueAtTime(0.12 * this.sfxVolume, t);
            harmonicGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            harmonic.connect(harmonicGain);
            harmonicGain.connect(this.ctx.destination);
            harmonic.start(t);
            harmonic.stop(t + 0.18);
            
            // === 第4层：温暖的低频支撑（太阳的温度感）===
            const warmth = this.ctx.createOscillator();
            const warmthGain = this.ctx.createGain();
            warmth.type = 'sine';
            warmth.frequency.setValueAtTime(250, t);
            warmth.frequency.exponentialRampToValueAtTime(150, t + 0.1);
            warmthGain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
            warmthGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            warmth.connect(warmthGain);
            warmthGain.connect(this.ctx.destination);
            warmth.start(t);
            warmth.stop(t + 0.18);
            
            // === 第5层：光辉扩散的余韵（渐弱的回响）===
            const echo = this.ctx.createOscillator();
            const echoGain = this.ctx.createGain();
            echo.type = 'sine';
            echo.frequency.setValueAtTime(500, t + 0.1);
            echo.frequency.exponentialRampToValueAtTime(350, t + 0.25);
            echoGain.gain.setValueAtTime(0.1 * this.sfxVolume, t + 0.1);
            echoGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            echo.connect(echoGain);
            echoGain.connect(this.ctx.destination);
            echo.start(t + 0.1);
            echo.stop(t + 0.32);
        },

        // [保留旧接口] 通用落子音效（用于非棋子场景）
        target.playPlace = function() { this.tone(400, 'sine', 0.1, 0.3); },

        target.playSkill = function() { this.tone(600, 'triangle', 0.1, 0.2); setTimeout(() => this.tone(800, 'triangle', 0.2, 0.1), 100); },

        target.playError = function() { this.tone(150, 'sawtooth', 0.2, 0.2); },

        target.playChaos = function() { [800, 400, 600, 200].forEach((f, i) => setTimeout(() => this.tone(f, 'sawtooth', 0.1, 0.1), i * 60)); },

        target.playChaosLucky = function() {
            if (this.isMuted || !this.ctx) return;
            this.playNote(880, 0.12, 'triangle', 0.15 * this.sfxVolume, 0.01, 0.1);
            setTimeout(() => this.playNote(1320, 0.12, 'sine', 0.12 * this.sfxVolume, 0.01, 0.1), 60);
        },

        target.playWinEffect = function(type) {
            if (type === 'lightning') this.playLightningSound();
            else if (type === 'gold') this.playGoldSound();
            else if (type === 'future') this.playFutureSound();
            else if (type === 'dj') { /* DJ 模式不播放固定音效，而是启动游戏 */ }
            else this.playWin(); 
        };
        target.playWin = function() { 
            [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.2, 0.4), i * 150)); 
        };
        target.playLightningSound = function() {
            if (this.isMuted || !this.ctx) return;
            this.playExplosion(2.5, 180);
            this.playExplosion(0.2, 4000);
            const now = this.ctx.currentTime;
            [0, 0.05, 0.1, 0.15, 0.2].forEach(offset => {
                const freq = 1000 + Math.random() * 2000;
                this.playNote(freq, 0.05, 'sawtooth', 0.15 * this.sfxVolume, 0.001, 0.05);
            });
        };
        target.playGoldSound = function() {
            if (this.isMuted || !this.ctx) return;
            const notes = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02];
            notes.forEach((f, i) => {
                setTimeout(() => {
                    this.playNote(f, 0.3, 'sine', 0.2 * this.sfxVolume, 0.01, 0.4);
                    this.playNote(f * 2, 0.1, 'triangle', 0.05 * this.sfxVolume, 0.01, 0.1);
                }, i * 60);
            });
        };
        target.playCoinCollect = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // === 立即播放 shot.m4a 音频文件（枪响音效）===
            try {
            if (typeof this.playOneShot === 'function') {
                this.playOneShot('shot.m4a', this.sfxVolume, 'shot.m4a');
            } else {
                const shotAudio = new Audio('shot.m4a');
                shotAudio.volume = this.sfxVolume;
                shotAudio.play().catch(e => console.warn('[Audio] shot.m4a 播放失败:', e));
            }
            } catch (e) {
                console.warn('[Audio] shot.m4a 加载失败:', e);
            }
            
            // === 延迟 50ms 播放合成音效（金币撞击声）===
            const delayTime = t + 0.05; // 50ms 延迟
            
            // === 第一层：金属撞击的"叮"声 ===
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.frequency.setValueAtTime(3200, delayTime);
            osc1.frequency.exponentialRampToValueAtTime(2800, delayTime + 0.02);
            osc1.frequency.exponentialRampToValueAtTime(2400, delayTime + 0.08);
            osc1.type = 'triangle';
            gain1.gain.setValueAtTime(0.4 * this.sfxVolume, delayTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, delayTime + 0.12);
            osc1.connect(gain1).connect(this.ctx.destination);
            osc1.start(delayTime);
            osc1.stop(delayTime + 0.12);
            
            // === 第二层：金属共鸣回响 ===
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.frequency.setValueAtTime(1600, delayTime + 0.01);
            osc2.frequency.exponentialRampToValueAtTime(1200, delayTime + 0.15);
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.25 * this.sfxVolume, delayTime + 0.01);
            gain2.gain.exponentialRampToValueAtTime(0.01, delayTime + 0.25);
            osc2.connect(gain2).connect(this.ctx.destination);
            osc2.start(delayTime + 0.01);
            osc2.stop(delayTime + 0.25);
            
            // === 第三层：低频厚重感（钱币的重量感）===
            const osc3 = this.ctx.createOscillator();
            const gain3 = this.ctx.createGain();
            osc3.frequency.setValueAtTime(400, delayTime);
            osc3.frequency.exponentialRampToValueAtTime(200, delayTime + 0.1);
            osc3.type = 'sine';
            gain3.gain.setValueAtTime(0.15 * this.sfxVolume, delayTime);
            gain3.gain.exponentialRampToValueAtTime(0.01, delayTime + 0.2);
            osc3.connect(gain3).connect(this.ctx.destination);
            osc3.start(delayTime);
            osc3.stop(delayTime + 0.2);
            
            // === 第四层：高频闪烁（金属光泽感）===
            const osc4 = this.ctx.createOscillator();
            const gain4 = this.ctx.createGain();
            osc4.frequency.setValueAtTime(4800, delayTime);
            osc4.frequency.exponentialRampToValueAtTime(3600, delayTime + 0.03);
            osc4.type = 'square';
            gain4.gain.setValueAtTime(0.2 * this.sfxVolume, delayTime);
            gain4.gain.exponentialRampToValueAtTime(0.01, delayTime + 0.06);
            osc4.connect(gain4).connect(this.ctx.destination);
            osc4.start(delayTime);
            osc4.stop(delayTime + 0.06);
        };
        target.playStreamerBlast = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // === 演唱会集体鼓掌 - 一次强烈共鸣感 ===
            // 模拟数千人同时鼓掌的震撼效果
            const clapBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
            const clapData = clapBuffer.getChannelData(0);
            
            // 生成超厚重的鼓掌声 - 多层叠加模拟大型演唱会群体效果
            for (let i = 0; i < clapData.length; i++) {
                const progress = i / clapData.length;
                let sample = 0;
                
                // 叠加更多随机脉冲，模拟数千人鼓掌
                for (let j = 0; j < 12; j++) {
                    const offset = j * 0.0008; // 更密集的时间偏移
                    const pos = Math.max(0, i - offset * this.ctx.sampleRate);
                    if (pos < clapData.length) {
                        // 更强的个体鼓掌声
                        sample += (Math.random() * 2 - 1) * 0.25;
                    }
                }
                
                // 添加共鸣衰减，但保持更长的余韵
                clapData[i] = sample * Math.exp(-progress * 2.5);
            }
            
            const clapSource = this.ctx.createBufferSource();
            clapSource.buffer = clapBuffer;
            
            // 中频增强滤波器，突出鼓掌的共鸣感和厚重感
            const clapFilter = this.ctx.createBiquadFilter();
            clapFilter.type = 'peaking';
            clapFilter.frequency.setValueAtTime(800, t); // 中频共鸣
            clapFilter.Q.value = 2;
            clapFilter.gain.setValueAtTime(6, t); // 增强中频
            
            const clapGain = this.ctx.createGain();
            clapGain.gain.setValueAtTime(1.2 * this.sfxVolume, t); // 更强的音量
            clapGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            
            clapSource.connect(clapFilter);
            clapFilter.connect(clapGain);
            clapGain.connect(this.ctx.destination);
            clapSource.start(t);
        };
        target.playMagicComplete = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // 1. 低频层：神秘的低沉音（象征完成的沉稳感）
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.frequency.setValueAtTime(80, t);
            bassOsc.frequency.exponentialRampToValueAtTime(120, t + 0.3); // 缓慢上升
            bassOsc.type = 'sine';
            bassGain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            bassOsc.connect(bassGain).connect(this.ctx.destination);
            bassOsc.start(t);
            bassOsc.stop(t + 0.5);
            
            // 2. 中频层：魔法闪烁音（800-1200Hz，象征魔法的闪耀）
            const magicOsc1 = this.ctx.createOscillator();
            const magicGain1 = this.ctx.createGain();
            magicOsc1.frequency.setValueAtTime(1000, t);
            magicOsc1.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
            magicOsc1.type = 'triangle';
            magicGain1.gain.setValueAtTime(0.3 * this.sfxVolume, t);
            magicGain1.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            magicOsc1.connect(magicGain1).connect(this.ctx.destination);
            magicOsc1.start(t);
            magicOsc1.stop(t + 0.3);
            
            // 3. 高频层：闪耀的铃声（2000-3000Hz，象征成功的闪耀）
            const chimeOsc = this.ctx.createOscillator();
            const chimeGain = this.ctx.createGain();
            chimeOsc.frequency.setValueAtTime(2400, t);
            chimeOsc.frequency.exponentialRampToValueAtTime(3000, t + 0.15);
            chimeOsc.type = 'sine';
            chimeGain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
            chimeGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            chimeOsc.connect(chimeGain).connect(this.ctx.destination);
            chimeOsc.start(t);
            chimeOsc.stop(t + 0.4);
            
            // 4. 魔法粒子效果：高频噪音（象征魔法粒子的闪烁）
            const particleBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
            const particleData = particleBuffer.getChannelData(0);
            for (let i = 0; i < particleData.length; i++) {
                // 创建闪烁的粒子效果
                const progress = i / particleData.length;
                const sparkle = Math.sin(progress * Math.PI * 8) * (1 - progress); // 衰减的闪烁
                particleData[i] = (Math.random() * 2 - 1) * sparkle * 0.6;
            }
            
            const particleSource = this.ctx.createBufferSource();
            particleSource.buffer = particleBuffer;
            
            const particleFilter = this.ctx.createBiquadFilter();
            particleFilter.type = 'highpass';
            particleFilter.frequency.setValueAtTime(4000, t);
            
            const particleGain = this.ctx.createGain();
            particleGain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
            particleGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            
            particleSource.connect(particleFilter).connect(particleGain).connect(this.ctx.destination);
            particleSource.start(t);
            particleSource.stop(t + 0.4);
            
            // 5. 上升的魔法音阶（象征任务完成的上升感）
            const magicScale = [
                { freq: 523.25, time: 0.05, duration: 0.1 },   // C5
                { freq: 659.25, time: 0.15, duration: 0.1 },   // E5
                { freq: 783.99, time: 0.25, duration: 0.15 }   // G5
            ];
            
            magicScale.forEach(note => {
                const noteOsc = this.ctx.createOscillator();
                const noteGain = this.ctx.createGain();
                noteOsc.frequency.setValueAtTime(note.freq, t + note.time);
                noteOsc.type = 'sine';
                noteGain.gain.setValueAtTime(0.2 * this.sfxVolume, t + note.time);
                noteGain.gain.exponentialRampToValueAtTime(0.01, t + note.time + note.duration);
                noteOsc.connect(noteGain).connect(this.ctx.destination);
                noteOsc.start(t + note.time);
                noteOsc.stop(t + note.time + note.duration);
            });
        };
        target.playFutureSound = function() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const o = this.playNote(220, 0.5, 'square', 0.2 * this.sfxVolume, 0.05, 0.4);
            if(o) {
                o.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                o.frequency.exponentialRampToValueAtTime(440, now + 0.4);
            }
            this.playNote(110, 0.5, 'sawtooth', 0.1 * this.sfxVolume, 0.1, 0.3);
        };
        target.playGrandWin = function() { 
            [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 'square', 0.2, 0.4), i * 120)); 
        };

        // [Alpha 0.7.9.6] 冰/火主题 - 冰晶落子音效
        // 设计理念：冰晶碎裂 - 清脆、透亮、寒冷
        // Requirements: 2.6
        target.playIceStone = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // === 第1层：高频正弦波主体（冰晶的清脆感）===
            const crystal = this.ctx.createOscillator();
            const crystalGain = this.ctx.createGain();
            crystal.type = 'sine';
            crystal.frequency.setValueAtTime(2800, t);
            crystal.frequency.exponentialRampToValueAtTime(1800, t + 0.08);
            crystalGain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
            crystalGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            crystal.connect(crystalGain);
            crystalGain.connect(this.ctx.destination);
            crystal.start(t);
            crystal.stop(t + 0.18);
            
            // === 第2层：高频泛音（冰晶的透亮感）===
            const shimmer = this.ctx.createOscillator();
            const shimmerGain = this.ctx.createGain();
            shimmer.type = 'sine';
            shimmer.frequency.setValueAtTime(4200, t);
            shimmer.frequency.exponentialRampToValueAtTime(3000, t + 0.06);
            shimmerGain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
            shimmerGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            shimmer.connect(shimmerGain);
            shimmerGain.connect(this.ctx.destination);
            shimmer.start(t);
            shimmer.stop(t + 0.12);
            
            // === 第3层：玻璃碎裂噪音（冰晶碎裂的质感）===
            const crackBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.12, this.ctx.sampleRate);
            const crackData = crackBuffer.getChannelData(0);
            for (let i = 0; i < crackData.length; i++) {
                // 模拟玻璃碎裂的不规则噪音
                const progress = i / crackData.length;
                const burst = Math.exp(-progress * 8); // 快速衰减
                // 添加随机脉冲模拟碎裂声
                const pulse = Math.random() > 0.92 ? 1.5 : 1;
                crackData[i] = (Math.random() * 2 - 1) * burst * pulse;
            }
            const crack = this.ctx.createBufferSource();
            crack.buffer = crackBuffer;
            const crackFilter = this.ctx.createBiquadFilter();
            crackFilter.type = 'highpass';
            crackFilter.frequency.setValueAtTime(3000, t);
            const crackGain = this.ctx.createGain();
            crackGain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
            crackGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
            crack.connect(crackFilter);
            crackFilter.connect(crackGain);
            crackGain.connect(this.ctx.destination);
            crack.start(t);
            
            // === 第4层：冰晶共鸣（寒冷的余韵）===
            const resonance = this.ctx.createOscillator();
            const resonanceGain = this.ctx.createGain();
            const resonanceFilter = this.ctx.createBiquadFilter();
            resonance.type = 'triangle';
            resonance.frequency.setValueAtTime(1600, t + 0.03);
            resonance.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
            resonanceFilter.type = 'bandpass';
            resonanceFilter.frequency.setValueAtTime(1400, t);
            resonanceFilter.Q.value = 8;
            resonanceGain.gain.setValueAtTime(0.15 * this.sfxVolume, t + 0.03);
            resonanceGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
            resonance.connect(resonanceFilter);
            resonanceFilter.connect(resonanceGain);
            resonanceGain.connect(this.ctx.destination);
            resonance.start(t + 0.03);
            resonance.stop(t + 0.28);
            
            // === 第5层：冰霜扩散音（寒气蔓延的感觉）===
            const frostBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
            const frostData = frostBuffer.getChannelData(0);
            for (let i = 0; i < frostData.length; i++) {
                const progress = i / frostData.length;
                // 缓慢上升后衰减，模拟霜冻扩散
                const envelope = Math.sin(progress * Math.PI * 0.5) * Math.exp(-progress * 3);
                frostData[i] = (Math.random() * 2 - 1) * envelope * 0.5;
            }
            const frost = this.ctx.createBufferSource();
            frost.buffer = frostBuffer;
            const frostFilter = this.ctx.createBiquadFilter();
            frostFilter.type = 'bandpass';
            frostFilter.frequency.setValueAtTime(5000, t);
            frostFilter.Q.value = 2;
            const frostGain = this.ctx.createGain();
            frostGain.gain.setValueAtTime(0.18 * this.sfxVolume, t + 0.05);
            frostGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
            frost.connect(frostFilter);
            frostFilter.connect(frostGain);
            frostGain.connect(this.ctx.destination);
            frost.start(t + 0.05);
        };

        // [Alpha 0.7.9.6] 冰/火主题 - 火焰落子音效
        // 设计理念：火焰爆发 - 噼啪、炽热、爆裂
        // Requirements: 2.7
        target.playFireStone = function() {
            if (this.isMuted || !this.ctx) return;
            const t = this.ctx.currentTime;
            
            // === 第1层：低频爆发主体（火焰的冲击感）===
            const burst = this.ctx.createOscillator();
            const burstGain = this.ctx.createGain();
            burst.type = 'sawtooth';
            burst.frequency.setValueAtTime(150, t);
            burst.frequency.exponentialRampToValueAtTime(60, t + 0.1);
            burstGain.gain.setValueAtTime(0.45 * this.sfxVolume, t);
            burstGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            burst.connect(burstGain);
            burstGain.connect(this.ctx.destination);
            burst.start(t);
            burst.stop(t + 0.18);
            
            // === 第2层：中频火焰核心（燃烧的温暖感）===
            const core = this.ctx.createOscillator();
            const coreGain = this.ctx.createGain();
            const coreFilter = this.ctx.createBiquadFilter();
            core.type = 'sawtooth';
            core.frequency.setValueAtTime(280, t);
            core.frequency.exponentialRampToValueAtTime(180, t + 0.12);
            coreFilter.type = 'lowpass';
            coreFilter.frequency.setValueAtTime(600, t);
            coreFilter.frequency.exponentialRampToValueAtTime(300, t + 0.12);
            coreGain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
            coreGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
            core.connect(coreFilter);
            coreFilter.connect(coreGain);
            coreGain.connect(this.ctx.destination);
            core.start(t);
            core.stop(t + 0.2);
            
            // === 第3层：噼啪噪音（火焰燃烧的噼啪声）===
            const crackleBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.25, this.ctx.sampleRate);
            const crackleData = crackleBuffer.getChannelData(0);
            for (let i = 0; i < crackleData.length; i++) {
                const progress = i / crackleData.length;
                // 随机脉冲模拟噼啪声
                const crackle = Math.random() > 0.85 ? (Math.random() * 2 - 1) * 2 : 0;
                // 基础噪音层
                const base = (Math.random() * 2 - 1) * 0.3;
                const envelope = Math.exp(-progress * 4);
                crackleData[i] = (crackle + base) * envelope;
            }
            const crackleSource = this.ctx.createBufferSource();
            crackleSource.buffer = crackleBuffer;
            const crackleFilter = this.ctx.createBiquadFilter();
            crackleFilter.type = 'bandpass';
            crackleFilter.frequency.setValueAtTime(1500, t);
            crackleFilter.Q.value = 1;
            const crackleGain = this.ctx.createGain();
            crackleGain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
            crackleGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
            crackleSource.connect(crackleFilter);
            crackleFilter.connect(crackleGain);
            crackleGain.connect(this.ctx.destination);
            crackleSource.start(t);
            
            // === 第4层：爆裂音效（火焰爆发的瞬间）===
            const popBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
            const popData = popBuffer.getChannelData(0);
            for (let i = 0; i < popData.length; i++) {
                const progress = i / popData.length;
                // 快速衰减的爆裂声
                const pop = Math.exp(-progress * 15);
                popData[i] = (Math.random() * 2 - 1) * pop;
            }
            const popSource = this.ctx.createBufferSource();
            popSource.buffer = popBuffer;
            const popFilter = this.ctx.createBiquadFilter();
            popFilter.type = 'lowpass';
            popFilter.frequency.setValueAtTime(2000, t);
            const popGain = this.ctx.createGain();
            popGain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
            popGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
            popSource.connect(popFilter);
            popFilter.connect(popGain);
            popGain.connect(this.ctx.destination);
            popSource.start(t);
            
            // === 第5层：火焰呼啸（热浪的感觉）===
            const whoosh = this.ctx.createOscillator();
            const whooshGain = this.ctx.createGain();
            const whooshFilter = this.ctx.createBiquadFilter();
            whoosh.type = 'sawtooth';
            whoosh.frequency.setValueAtTime(100, t + 0.02);
            whoosh.frequency.exponentialRampToValueAtTime(200, t + 0.1);
            whoosh.frequency.exponentialRampToValueAtTime(80, t + 0.2);
            whooshFilter.type = 'bandpass';
            whooshFilter.frequency.setValueAtTime(400, t);
            whooshFilter.Q.value = 2;
            whooshGain.gain.setValueAtTime(0.2 * this.sfxVolume, t + 0.02);
            whooshGain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
            whoosh.connect(whooshFilter);
            whooshFilter.connect(whooshGain);
            whooshGain.connect(this.ctx.destination);
            whoosh.start(t + 0.02);
            whoosh.stop(t + 0.25);
            
            // === 第6层：高频火星（火星飞溅的闪烁）===
            const sparkBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
            const sparkData = sparkBuffer.getChannelData(0);
            for (let i = 0; i < sparkData.length; i++) {
                const progress = i / sparkData.length;
                // 随机火星闪烁
                const spark = Math.random() > 0.9 ? Math.random() : 0;
                sparkData[i] = spark * Math.exp(-progress * 5);
            }
            const sparkSource = this.ctx.createBufferSource();
            sparkSource.buffer = sparkBuffer;
            const sparkFilter = this.ctx.createBiquadFilter();
            sparkFilter.type = 'highpass';
            sparkFilter.frequency.setValueAtTime(4000, t);
            const sparkGain = this.ctx.createGain();
            sparkGain.gain.setValueAtTime(0.15 * this.sfxVolume, t + 0.03);
            sparkGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
            sparkSource.connect(sparkFilter);
            sparkFilter.connect(sparkGain);
            sparkGain.connect(this.ctx.destination);
            sparkSource.start(t + 0.03);
        };
    }
};

if (window.AudioHost && typeof window.AudioHost.register === 'function') {
    window.AudioHost.register('sfx', window.AudioSFX);
}

