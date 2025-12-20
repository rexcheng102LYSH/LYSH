// ================= 音频引擎 (Audio Engine) =================
// [Alpha 0.7.7.9 Stable] 
// 状态：已移除所有非法文本头，确保浏览器能正确解析 SoundEngine 对象。

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

    // 节奏游戏状态
    rhythm: {
        active: false,
        phase: 'idle', 
        startTime: 0,
        bpm: 120,
        beatDuration: 0.5, 
        notes: [], 
        currentNoteIdx: 0,
        timerID: null,
        userMissed: false
    },

    init: function() { 
        if (this.ctx) return; 
        try {
            const AC = window.AudioContext || window.webkitAudioContext; 
            this.ctx = new AC(); 
            this.startBGM();
            if (window.BackgroundEngine && window.BackgroundEngine.activeSeason === 'spring') {
                this.playAmbient();
            }
        } catch(e) { console.error("Audio Init Failed:", e); }
    },
    
    toggle: function() { 
        if (!this.ctx) this.init(); 
        this.isMuted = !this.isMuted; 
        const btn = document.querySelector('.sound-toggle');
        if (btn) btn.innerText = this.isMuted ? '🔇' : '🎵'; 
        
        if (this.isMuted) {
            this.stopBGM();
            this.stopAmbient();
            this.stopRhythmGame();
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

    switchTrack: function(trackName) {
        if (this.currentTrack === trackName) return;
        this.currentTrack = trackName;
        if (this.isPlaying && !this.isMuted) {
            this.stopBGM();
            this.startBGM();
        }
    },

    // --- 基础合成器 ---
    playNote: function(freq, duration, type, volume, attack=0.01, release=0.1, detune=0) {
        if (this.isMuted || !this.ctx || volume <= 0) return;
        try {
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
        } catch(e) { console.warn("Audio Play Error:", e); }
    },

    playNoise: function(duration, volume, filterType='lowpass', filterFreq=1000) {
        if (this.isMuted || !this.ctx) return;
        try {
            const bufferSize = this.ctx.sampleRate * 2; 
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = filterType;
            filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
            noise.start(); noise.stop(this.ctx.currentTime + duration + 0.1);
            return { noise, filter, gain };
        } catch(e) { console.warn("Noise Error:", e); }
    },

    tone: function(freq, type, dur, vol) {
        this.playNote(freq, dur, type, vol * this.sfxVolume);
    },

    // =========================================
    // UI 交互音效 (关键修复)
    // =========================================
    playPlace: function() { this.tone(800, 'sine', 0.1, 0.3); },
    playError: function() { this.tone(150, 'sawtooth', 0.2, 0.2); },
    playSkill: function() { 
        this.tone(600, 'triangle', 0.1, 0.2); 
        setTimeout(() => this.tone(800, 'triangle', 0.2, 0.1), 100); 
    },
    playChaos: function() { 
        [800, 400, 600, 200].forEach((f, i) => setTimeout(() => this.tone(f, 'sawtooth', 0.1, 0.1), i * 60)); 
    },

    // =========================================
    // 🥁 DJ 节奏游戏逻辑
    // =========================================

    startRhythmGame: function() {
        if (this.isMuted || !this.ctx) return;
        this.stopBGM();
        this.rhythm.active = true;
        this.rhythm.phase = 'challenge';
        this.rhythm.startTime = this.ctx.currentTime + 0.5;
        this.rhythm.currentNoteIdx = 0;
        this.rhythm.userMissed = false;
        
        // 生成谱面
        this.rhythm.notes = [];
        for(let i=0; i<16; i++) {
            this.rhythm.notes.push(this.rhythm.startTime + i * this.rhythm.beatDuration);
        }
        this.scheduleLoop();
    },

    stopRhythmGame: function() {
        this.rhythm.active = false;
        this.rhythm.phase = 'idle';
        clearTimeout(this.rhythm.timerID);
    },

    scheduleLoop: function() {
        if (!this.rhythm.active) return;
        const now = this.ctx.currentTime;
        
        if (this.rhythm.phase === 'challenge') {
            const lastNoteTime = this.rhythm.notes[this.rhythm.notes.length-1];
            if (now > lastNoteTime + 1.0 && !this.rhythm.userMissed) {
                this.triggerPartyMode();
                return;
            }
        } 
        else if (this.rhythm.phase === 'party') {
            this.playPartyLoop();
        }
        
        this.rhythm.timerID = setTimeout(() => this.scheduleLoop(), 50);
    },

    checkRhythmHit: function() {
        if (!this.rhythm.active || this.rhythm.phase !== 'challenge') return 'ignore';
        
        const now = this.ctx.currentTime;
        let closestDist = Infinity;
        
        for(let i=0; i<this.rhythm.notes.length; i++) {
            const diff = this.rhythm.notes[i] - now;
            if (Math.abs(diff) < Math.abs(closestDist)) closestDist = diff;
        }
        
        if (Math.abs(closestDist) < 0.18) {
            return 'perfect';
        } else {
            this.triggerVoidMode();
            return 'miss';
        }
    },
    
    triggerVoidMode: function() {
        if (this.rhythm.phase === 'void') return;
        this.rhythm.phase = 'void';
        this.rhythm.userMissed = true;
        this.playFailSound();
    },

    triggerPartyMode: function() {
        if (this.rhythm.phase === 'party') return;
        this.rhythm.phase = 'party';
        this.playNote(880, 0.5, 'sine', 0.5, 0.01, 0.5); 
        this.playPartyLoop();
    },

    playKick: function() {
        if (this.isMuted) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(0.01, t + 0.3);
        g.gain.setValueAtTime(1.0 * this.sfxVolume, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t); o.stop(t + 0.3);
        this.playNoise(0.05, 0.2 * this.sfxVolume, 'highpass', 5000);
    },

    playFailSound: function() {
        if (this.isMuted) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, t);
        o.frequency.linearRampToValueAtTime(20, t + 1.5);
        g.gain.setValueAtTime(0.5 * this.sfxVolume, t);
        g.gain.linearRampToValueAtTime(0, t + 1.5);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t); o.stop(t + 1.6);
    },

    partyStep: 0,
    playPartyLoop: function() {
        if (!this.rhythm.active || this.rhythm.phase !== 'party') return;
        const beatTime = 60 / 128; 
        this.playKick(); 
        const bassFreq = [110, 110, 146, 130][this.partyStep % 4];
        this.playNote(bassFreq, 0.2, 'square', 0.2 * this.musicVolume, 0.01, 0.1);
        if (this.partyStep % 2 === 0) {
             const melody = [440, 523, 659, 784, 880, 784, 659, 523];
             const note = melody[Math.floor(Math.random() * melody.length)];
             this.playNote(note * 2, 0.1, 'sine', 0.1 * this.musicVolume, 0.01, 0.1);
        }
        this.partyStep++;
        if (this.rhythm.phase === 'party') {
            this.rhythm.timerID = setTimeout(() => this.playPartyLoop(), beatTime * 1000);
        }
    },

    // 胜利音效路由
    playWinEffect: function(type) {
        if (type === 'lightning') this.playLightningSound();
        else if (type === 'gold') this.playGoldSound();
        else if (type === 'future') this.playFutureSound();
        else if (type === 'dj') { }
        else this.playWin(); 
    },

    playWin: function() { 
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.2, 0.4), i * 150)); 
    },
    
    playDefeat: function() { 
        this.playNote(150, 1.0, 'sawtooth', 0.5 * this.sfxVolume);
        setTimeout(() => this.playNote(100, 1.5, 'sawtooth', 0.4 * this.sfxVolume), 600);
    },

    playFireworkLaunch: function() {
        this.playNote(200, 0.5, 'sine', 0.1 * this.sfxVolume, 0.01, 0.5, 400); 
    },
    
    playFireworkBlast: function(pitchVar) {
        this.playNoise(0.4, 0.8 * this.sfxVolume, 'lowpass', 200 + pitchVar * 200);
    },

    playLightningSound: function() { this.playExplosion(2.5, 180); },
    playGoldSound: function() { [1046, 1318].forEach((f,i)=>setTimeout(()=>this.playNote(f, 0.3, 'sine', 0.2, 0.01, 0.4), i*60)); },
    playFutureSound: function() { this.playNote(220, 0.5, 'square', 0.2, 0.05, 0.4); },
    playGrandWin: function() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 'square', 0.2, 0.4), i * 120)); },
    
    playExplosion: function(d=2.5, f=180) { 
        this.playNoise(d, this.sfxVolume, 'lowpass', f); 
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
    
    playAmbient: function() { 
        if (this.isMuted) return; 
        if (!this.ambientAudio) { this.ambientAudio = new Audio('bgs1.mp3'); this.ambientAudio.loop = true; } 
        this.ambientAudio.volume = this.ambientVolume; 
        if (this.ambientAudio.paused) { this.ambientAudio.play().catch(e => {}); } 
    },
    
    stopAmbient: function() { 
        if (this.ambientAudio) { this.ambientAudio.pause(); } 
    },
    
    playOriginLoop: function() { 
        if(!this.isPlaying || this.currentTrack !== 'origin') return; 
        const f = [261,293,329,392,440][Math.floor(Math.random()*5)]; 
        this.playNote(f, 2, 'sine', 0.03*this.musicVolume, 0.5, 2); 
        this.bgmTimeout = setTimeout(()=>this.playOriginLoop(), 2000); 
    },
    
    playMp3Loop: function() { 
        if(!this.mp3Audio) { 
            const map = { 'bgm1': 'bgm1.mp3', 'bgm2': 'bgm2.mp3', 'bgm3': 'bgm3.mp3', 'bgm4': 'bgm4.mp3' };
            const src = map[this.currentTrack] || 'bgm1.mp3';
            this.mp3Audio = new Audio(src); 
            this.mp3Audio.loop=true; 
            this.mp3Audio.volume = this.musicVolume;
        } 
        this.mp3Audio.play().catch(e=>{}); 
    },
    
    playBombLoop: function() { 
        if(!this.isPlaying || this.currentTrack!=='bomb') return; 
        this.playNote(800, 0.05, 'square', 0.05 * this.musicVolume, 0.01, 0.05); 
        this.bgmTimeout = setTimeout(()=>this.playBombLoop(), 1000); 
    }
};