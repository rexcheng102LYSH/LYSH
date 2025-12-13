const SoundEngine = {
    ctx: null, 
    isMuted: false, 
    isPlaying: false,
    
    musicVolume: 0.5, 
    sfxVolume: 1.0,
    currentTrack: 'origin', // 'origin' | 'overture' | 'bomb'
    bgmTimeout: null,
    
    mp3Audio: null,

    // 频率表
    notes: {
        'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.00
    },

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

    // --- SFX ---
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

    tone: function(f, type, d, v=0.1) { 
        this.playNote(f, d, type, v * this.sfxVolume, 0.01, 0.1);
    },

    playPlace: function() { this.tone(400, 'sine', 0.1, 0.3); },
    playSkill: function() { 
        this.tone(600, 'triangle', 0.1, 0.2);
        setTimeout(() => this.tone(800, 'triangle', 0.2, 0.1), 100);
    },
    playWin: function() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.2, 0.4), i * 150)); },
    playGrandWin: function() { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 'square', 0.2, 0.4), i * 120)); },
    playError: function() { this.tone(150, 'sawtooth', 0.2, 0.2); },
    playChaos: function() { [800, 400, 600, 200].forEach((f, i) => setTimeout(() => this.tone(f, 'sawtooth', 0.1, 0.1), i * 60)); },

    // --- BGM 控制 ---
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
        
        if (this.currentTrack === 'bomb') {
            this.playBombLoop();
        } else if (this.currentTrack === 'origin') {
            this.playOriginLoop();
        } else {
            this.playMp3Loop();
        }
    },

    stopBGM: function() { 
        this.isPlaying = false; 
        clearTimeout(this.bgmTimeout); 
        if (this.mp3Audio) {
            this.mp3Audio.pause(); 
            this.mp3Audio = null;
        }
    },

    // 1. 原初
    playOriginLoop: function() {
        if(!this.isPlaying || this.currentTrack !== 'origin') return;
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00]; 
        const f = scale[Math.floor(Math.random() * scale.length)];
        const d = 2 + Math.random();
        if (this.ctx) this.playNote(f, d, 'sine', 0.03 * this.musicVolume, 0.5, 2.0);
        this.bgmTimeout = setTimeout(() => this.playOriginLoop(), d * 800);
    },

    // 2. 序曲 (MP3)
    playMp3Loop: function() {
        if (!this.mp3Audio) {
            this.mp3Audio = new Audio('bgm.mp3'); 
            this.mp3Audio.loop = true;
            this.mp3Audio.volume = this.musicVolume;
        }
        this.mp3Audio.play().catch(e => console.log("Waiting for interaction", e));
    },

    // 3. 炸弹 (紧张感 - 管弦乐版)
    bombStep: 0,
    playBombLoop: function() {
        if(!this.isPlaying || this.currentTrack !== 'bomb') return;
        
        const stepTime = 1000; // BPM 60
        
        // 1. 滴答声 (Tick) - 清脆的响板 (高频正弦波，极短衰减)
        this.playNote(1200, 0.02, 'sine', 0.15 * this.musicVolume, 0.001, 0.03);

        // 2. 压迫感 (Pizzicato Cello) - 每2秒一次
        // 使用 Triangle 模拟拨弦，Attack 稍快，Release 适中
        if (this.bombStep % 2 === 0) {
            // 低音 G2 (98Hz)
            this.playNote(98, 0.5, 'triangle', 0.2 * this.musicVolume, 0.02, 0.4);
        } else {
            // 低音 C3 (130.8Hz) - 形成纯五度关系，稳定但压抑
            this.playNote(130.8, 0.5, 'triangle', 0.2 * this.musicVolume, 0.02, 0.4);
        }

        // 3. 偶尔的危机感 (High Piano) - 模拟高音钢琴点缀
        if (this.bombStep % 8 === 6) {
             this.playNote(1568, 0.3, 'sine', 0.05 * this.musicVolume, 0.01, 0.3);
        }

        this.bombStep++;
        this.bgmTimeout = setTimeout(() => this.playBombLoop(), stepTime);
    }
};