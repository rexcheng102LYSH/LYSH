const SoundEngine = {
    ctx: null, 
    isMuted: false, 
    isPlaying: false,
    
    musicVolume: 0.5, 
    sfxVolume: 1.0,
    currentTrack: 'origin', // 'origin' | 'overture' | 'bomb'
    bgmTimeout: null,
    
    mp3Audio: null,
    
    // 新增：危机状态标记
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

    // 核心新增：设置危机状态 (由 game.js 调用)
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

    // 新增：模拟弦乐的长音 (Sawtooth + Envelope)
    playStringPad: function(freq, duration, volume) {
        if (this.isMuted || !this.ctx) return;
        // 使用 Sawtooth 保证压迫感，但 Attack 慢一点(0.2s)模拟运弓
        this.playNote(freq, duration, 'sawtooth', volume * 0.6, 0.2, 0.5);
    },

    tone: function(f, type, d, v=0.1) { this.playNote(f, d, type, v * this.sfxVolume, 0.01, 0.1); },
    playPlace: function() { this.tone(400, 'sine', 0.1, 0.3); },
    playSkill: function() { this.tone(600, 'triangle', 0.1, 0.2); setTimeout(() => this.tone(800, 'triangle', 0.2, 0.1), 100); },
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

    // 4. 炸弹 (Horror Strings - Alpha 0.6.8.2)
    bombStep: 0,
    playBombLoop: function() {
        if(!this.isPlaying || this.currentTrack !== 'bomb') return;
        
        let stepTime = 1000; // 默认 60 BPM
        
        if (!this.isCritical) {
            // === 正常压迫状态 (The Looming Threat) ===
            // 1. 滴答声 (Tick) - 高频 Square，模拟倒计时
            this.playNote(800, 0.05, 'square', 0.05 * this.musicVolume, 0.01, 0.05);

            // 2. 沉重弦乐 (Deep Strings) - 使用 Sawtooth 模拟大提琴
            if (this.bombStep % 4 === 0) {
                // 低音 G1 + D2 (纯五度，黑暗、稳定)
                this.playStringPad(49.00, 2.5, 0.15 * this.musicVolume); 
                this.playStringPad(73.42, 2.5, 0.10 * this.musicVolume);
            }
        } else {
            // === 危机状态 (Panic Mode < 30s) ===
            stepTime = 500; // 速度翻倍！120 BPM
            
            // 1. 急促滴答 (Fast Tick) - 更尖锐
            this.playNote(1200, 0.05, 'square', 0.08 * this.musicVolume, 0.005, 0.02);

            // 2. 癫狂小提琴 (Screeching Violin) - 高音不协和
            if (this.bombStep % 2 === 0) {
                // 高音 G5 (783Hz) + 升C6 (1108Hz, 三全音魔鬼音程)
                this.playStringPad(783.99, 0.4, 0.1 * this.musicVolume); 
                this.playStringPad(1108.7, 0.4, 0.08 * this.musicVolume);
                
                // 加入一点点 "金属摩擦声" (极短的高频 Sawtooth)
                this.playNote(3000 + Math.random()*1000, 0.1, 'sawtooth', 0.03 * this.musicVolume, 0.01, 0.1);
            }
        }

        this.bombStep++;
        this.bgmTimeout = setTimeout(() => this.playBombLoop(), stepTime);
    }
};