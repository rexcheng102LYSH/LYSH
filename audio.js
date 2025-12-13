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
        
        // 优先级：如果是 Bomb 模式，无视设置，强制播放 Bomb 音乐
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

    // 1. 原初 (Ambient)
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

    // 3. 炸弹 (Tension Loop - New!)
    bombStep: 0,
    playBombLoop: function() {
        if(!this.isPlaying || this.currentTrack !== 'bomb') return;
        
        // BPM 60 (每秒一拍，模仿时钟)
        const stepTime = 1000; 
        
        // 1. 滴答声 (Tick) - 每秒都有
        // 高频短促的 Sawtooth，模拟电子表滴答
        this.playNote(880, 0.05, 'sawtooth', 0.1 * this.musicVolume, 0.01, 0.05);

        // 2. 压迫感 (Drone) - 每4秒一个循环
        // 低频 Sine/Triangle，模拟心跳或脉冲
        if (this.bombStep % 4 === 0) {
            this.playNote(55, 3.0, 'sawtooth', 0.15 * this.musicVolume, 0.5, 1.0); // Low A1
        } else if (this.bombStep % 4 === 2) {
            this.playNote(58.27, 3.0, 'sawtooth', 0.12 * this.musicVolume, 0.5, 1.0); // Low Bb1 (制造不协和感)
        }

        // 3. 偶尔的警报 (High Pitch)
        if (this.bombStep % 8 === 7) {
             this.playNote(1760, 0.2, 'square', 0.05 * this.musicVolume, 0.01, 0.1);
        }

        this.bombStep++;
        this.bgmTimeout = setTimeout(() => this.playBombLoop(), stepTime);
    }
};