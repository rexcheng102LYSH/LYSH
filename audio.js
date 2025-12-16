const SoundEngine = {
    ctx: null, 
    isMuted: false, 
    isPlaying: false,
    
    musicVolume: 0.5, 
    sfxVolume: 1.0,
    ambientVolume: 1.0, 
    
    // 当前轨道：'origin' | 'bgm1' | 'bgm2' | 'bgm3' | 'bgm4' | 'bomb'
    currentTrack: 'origin', 
    bgmTimeout: null,
    
    mp3Audio: null,
    ambientAudio: null, 
    isCritical: false,

    init: function() { 
        if (this.ctx) return; 
        const AC = window.AudioContext || window.webkitAudioContext; 
        this.ctx = new AC(); 
        this.startBGM();
        // 保持：环境音效独立于 BGM，只与季节(视觉)挂钩
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

    // --- SFX (保持不变) ---
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

    playMp3Loop: function() {
        if (!this.mp3Audio) {
            let filename = 'bgm1.mp3'; // 默认 fallback
            
            // 映射逻辑更新
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
            // 注意：这里使用的是上一轮修正后的 bgs1.mp3
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