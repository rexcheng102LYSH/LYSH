const SoundEngine = {
    ctx: null, 
    isMuted: false, 
    isPlaying: false,
    
    musicVolume: 0.5, 
    sfxVolume: 1.0,
    currentTrack: 'origin', // 'origin' | 'overture' | 'bomb'
    bgmTimeout: null,
    
    mp3Audio: null,
    isCritical: false,

    init: function() { 
        if (this.ctx) return; 
        const AC = window.AudioContext || window.webkitAudioContext; 
        this.ctx = new AC(); 
        this.startBGM(); 
    },
    
    toggle: function() { 
        if (!this.ctx) this.init(); 
        this.isMuted = !this.isMuted; 
        document.querySelector('.sound-toggle').innerText = this.isMuted ? '🔇' : '🎵'; 
        this.isMuted ? this.stopBGM() : this.startBGM(); 
    },

    setMusicVolume: function(v) {
        this.musicVolume = v;
        if(this.mp3Audio) this.mp3Audio.volume = v;
    },

    setCritical: function(critical) {
        this.isCritical = critical;
    },

    // --- SFX (Tone Generator) ---
    playNote: function(freq, duration, type, volume, attack=0.05, release=0.1) {
        if (this.isMuted || !this.ctx || volume <= 0) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const now = this.ctx.currentTime;
        o.type = type;
        o.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(volume, now + attack); 
        g.gain.exponentialRampToValueAtTime(0.01, now + duration + release); 
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start();
        o.stop(now + duration + release);
    },

    // 模拟弦乐 (Sawtooth + Envelope) - 0.6.8.2 的核心音色
    playStringPad: function(freq, duration, volume) {
        if (this.isMuted || !this.ctx) return;
        this.playNote(freq, duration, 'sawtooth', volume * 0.6, 0.2, 0.5);
    },

    // 核心功能：爆炸音效 (保留自 0.6.9)
    playExplosion: function() {
        if (this.isMuted || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2; // 2秒时长
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成粉红/白噪音
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; 
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        // 低通滤波器，让声音听起来像沉闷的爆炸而非刺耳的沙沙声
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000; 
        
        const gain = this.ctx.createGain();
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(this.sfxVolume, now);
        
        // 频率和音量快速衰减
        filter.frequency.exponentialRampToValueAtTime(100, now + 1); 
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        
        noise.start();
    },

    tone: function(f, type, d, v=0.1) { this.playNote(f, d, type, v * this.sfxVolume, 0.01, 0.1); },
    playPlace: function() { this.tone(400, 'sine', 0.1, 0.3); },
    playSkill: function() { this.tone(600, 'triangle', 0.1, 0.2); setTimeout(() => this.tone(800, 'triangle', 0.2, 0.1), 100); },
    playWin: function() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.2, 0.4), i * 150)); },
    playGrandWin: function() { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 'square', 0.2, 0.4), i * 120)); },
    playError: function() { this.tone(150, 'sawtooth', 0.2, 0.2); },
    playChaos: function() { [800, 400, 600, 200].forEach((f, i) => setTimeout(() => this.tone(f, 'sawtooth', 0.1, 0.1), i * 60)); },

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
            this.mp3Audio = new Audio('bgm.mp3'); 
            this.mp3Audio.loop = true;
            this.mp3Audio.volume = this.musicVolume;
        }
        this.mp3Audio.play().catch(e => console.log("Waiting for interaction", e));
    },

    // 0.6.8.2 风格的恐怖弦乐 BGM
    bombStep: 0,
    playBombLoop: function() {
        if(!this.isPlaying || this.currentTrack !== 'bomb') return;
        
        let stepTime = 1000; // 默认 60 BPM
        
        if (!this.isCritical) {
            // === 正常压迫状态 ===
            // 1. 滴答声 (Tick) - Square
            this.playNote(800, 0.05, 'square', 0.05 * this.musicVolume, 0.01, 0.05);

            // 2. 沉重弦乐 (Deep Strings) - Sawtooth
            if (this.bombStep % 4 === 0) {
                this.playStringPad(49.00, 2.5, 0.15 * this.musicVolume); 
                this.playStringPad(73.42, 2.5, 0.10 * this.musicVolume);
            }
        } else {
            // === 危机状态 (<30s) ===
            stepTime = 500; // 速度翻倍
            
            // 1. 急促滴答
            this.playNote(1200, 0.05, 'square', 0.08 * this.musicVolume, 0.005, 0.02);

            // 2. 癫狂小提琴
            if (this.bombStep % 2 === 0) {
                this.playStringPad(783.99, 0.4, 0.1 * this.musicVolume); 
                this.playStringPad(1108.7, 0.4, 0.08 * this.musicVolume);
                // 金属摩擦噪音
                this.playNote(3000 + Math.random()*1000, 0.1, 'sawtooth', 0.03 * this.musicVolume, 0.01, 0.1);
            }
        }

        this.bombStep++;
        this.bgmTimeout = setTimeout(() => this.playBombLoop(), stepTime);
    }
};