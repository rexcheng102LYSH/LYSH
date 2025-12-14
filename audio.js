const SoundEngine = {
    ctx: null, 
    isMuted: false, 
    isPlaying: false,
    
    musicVolume: 0.5, 
    sfxVolume: 1.0,
    currentTrack: 'origin', // 'origin' | 'overture' | 'bgm2' | 'bomb'
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

    playStringPad: function(freq, duration, volume) {
        if (this.isMuted || !this.ctx) return;
        this.playNote(freq, duration, 'sawtooth', volume * 0.6, 0.2, 0.5);
    },

    playExplosion: function() {
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
        filter.type = 'lowpass';
        filter.frequency.value = 1000; 
        const gain = this.ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(this.sfxVolume, now);
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

    // 核心修改：支持 bgm2.mp3
    playMp3Loop: function() {
        if (!this.mp3Audio) {
            let filename = 'bgm.mp3';
            if (this.currentTrack === 'bgm2') {
                filename = 'bgm2.mp3';
            }
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
    }
};