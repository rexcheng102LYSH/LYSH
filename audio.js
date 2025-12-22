// ================= 音频引擎 (Audio Engine) =================
// [Alpha 0.7.7.9]
// - DJ 三階段系統：挑戰、失敗、勝利
// - 實現 playKick (強勁底鼓) 與 playMiss (失誤音效)
// - 內置挑戰旋律與勝利旋律

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

    // [New] DJ 節奏遊戲狀態 - 三階段系統
    djGame: {
        active: false,
        phase: 'idle', // 'challenge', 'fail', 'victory'
        startTime: 0,
        beatDuration: 0.6, // 100 BPM
        nextNoteTime: 0,
        noteIndex: 0,
        schedulerID: null,
        
        // 挑戰階段數據
        challengeBeats: [], // 需要玩家擊打的節拍時間點
        totalBeats: 8, // 總共8個節拍
        hitBeats: 0, // 成功擊中的節拍數
        missedBeats: 0, // 錯過的節拍數
        
        // 勝利階段數據
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
        
        // 生成8個節拍的挑戰時間點
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
    
    // DJ 調度器
    djScheduler: function() {
        const dj = this.djGame;
        if (!dj.active || dj.phase !== 'challenge') return;
        
        const currentTime = this.ctx.currentTime;
        const lookahead = 0.1;
        
        // 檢查是否有節拍被錯過
        dj.challengeBeats.forEach(beat => {
            if (!beat.hit && !beat.missed && currentTime > beat.time + 0.15) {
                beat.missed = true;
                dj.missedBeats++;
                // 通知 fx.js 錯過了節拍
                if (typeof window.djMissCallback === 'function') {
                    window.djMissCallback();
                }
            }
        });
        
        // 播放背景節奏音符
        while (dj.nextNoteTime < currentTime + lookahead) {
            this.playBackgroundBeat(dj.nextNoteTime, dj.noteIndex);
            dj.nextNoteTime += dj.beatDuration;
            dj.noteIndex++;
        }
        
        // 檢查挑戰是否結束
        const allBeatsProcessed = dj.challengeBeats.every(b => b.hit || b.missed);
        if (allBeatsProcessed) {
            clearTimeout(dj.schedulerID);
            // 判定成功或失敗
            if (dj.missedBeats === 0) {
                this.startDJVictory();
            } else {
                this.startDJFailure();
            }
            return;
        }
        
        dj.schedulerID = setTimeout(() => this.djScheduler(), 25);
    },
    
    // 玩家擊鼓判定
    djPlayerHit: function() {
        const dj = this.djGame;
        if (!dj.active || dj.phase !== 'challenge') return false;
        
        const currentTime = this.ctx.currentTime;
        const hitWindow = 0.15; // 150ms 判定窗口
        
        // 尋找最近的未擊中節拍
        for (let beat of dj.challengeBeats) {
            if (!beat.hit && !beat.missed) {
                const timeDiff = Math.abs(currentTime - beat.time);
                if (timeDiff < hitWindow) {
                    beat.hit = true;
                    dj.hitBeats++;
                    this.playKick(); // 完美擊鼓音效
                    return true; // 成功擊中
                }
            }
        }
        
        // 提前擊鼓或錯過時機
        this.playMiss();
        dj.missedBeats++;
        return false;
    },
    
    // 挑戰階段旋律（7-8秒）
    playChallengemelody: function() {
        const startTime = this.ctx.currentTime + 1.0;
        // 簡單的勝利前奏旋律：C-D-E-G-E-D-C-G
        const melody = [
            {freq: 523.25, time: 0.0, duration: 0.4}, // C5
            {freq: 587.33, time: 0.6, duration: 0.4}, // D5
            {freq: 659.25, time: 1.2, duration: 0.4}, // E5
            {freq: 783.99, time: 1.8, duration: 0.4}, // G5
            {freq: 659.25, time: 2.4, duration: 0.4}, // E5
            {freq: 587.33, time: 3.0, duration: 0.4}, // D5
            {freq: 523.25, time: 3.6, duration: 0.4}, // C5
            {freq: 783.99, time: 4.2, duration: 0.6}  // G5 (長音)
        ];
        
        melody.forEach(note => {
            const t = startTime + note.time;
            this.playNote(note.freq, note.duration, 'triangle', 0.25 * this.musicVolume, 0.05, 0.2);
        });
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
    
    // 失敗階段：沉默與虛無
    startDJFailure: function() {
        const dj = this.djGame;
        dj.phase = 'fail';
        dj.active = false;
        
        // 播放失敗音效
        this.playDefeat();
        
        // 通知 fx.js 進入失敗狀態
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
    
    // 勝利旋律（更華麗的音樂）
    playVictoryMelody: function() {
        const startTime = this.ctx.currentTime;
        // 勝利進行曲：C-E-G-C(高)-G-E-C-C(高)-E-G-E-C
        const victoryMelody = [
            {freq: 523.25, time: 0.0, duration: 0.3},   // C5
            {freq: 659.25, time: 0.4, duration: 0.3},   // E5
            {freq: 783.99, time: 0.8, duration: 0.3},   // G5
            {freq: 1046.50, time: 1.2, duration: 0.5},  // C6
            {freq: 783.99, time: 1.8, duration: 0.3},   // G5
            {freq: 659.25, time: 2.2, duration: 0.3},   // E5
            {freq: 523.25, time: 2.6, duration: 0.3},   // C5
            {freq: 1046.50, time: 3.0, duration: 0.4},  // C6
            {freq: 987.77, time: 3.5, duration: 0.3},   // B5
            {freq: 880.00, time: 3.9, duration: 0.3},   // A5
            {freq: 783.99, time: 4.3, duration: 0.5},   // G5
            {freq: 1046.50, time: 4.9, duration: 0.8}   // C6 (終止)
        ];
        
        victoryMelody.forEach(note => {
            const t = startTime + note.time;
            // 主旋律
            this.playNote(note.freq, note.duration, 'sine', 0.3 * this.musicVolume, 0.02, 0.3);
            // 和聲（低八度）
            this.playNote(note.freq * 0.5, note.duration, 'triangle', 0.15 * this.musicVolume, 0.02, 0.3);
        });
        
        // 添加閃亮的高音點綴
        setTimeout(() => {
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const sparkleFreq = 2093 + Math.random() * 1000; // C7 附近
                    this.playNote(sparkleFreq, 0.1, 'sine', 0.1 * this.musicVolume, 0.01, 0.1);
                }, i * 300);
            }
        }, 1000);
    },
    
    // 停止 DJ 遊戲
    stopDJGame: function() {
        const dj = this.djGame;
        dj.active = false;
        dj.phase = 'idle';
        clearTimeout(dj.schedulerID);
        clearInterval(dj.autoKickInterval);
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
        if(this.currentTrack === track) return;
        this.currentTrack = track;
        if(this.isPlaying && !this.isMuted) {
            this.stopBGM();
            this.startBGM();
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
        if (this.mp3Audio) { this.mp3Audio.pause(); this.mp3Audio = null; }
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