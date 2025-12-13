const SoundEngine = {
    ctx: null, 
    isMuted: false, 
    isPlaying: false,
    
    musicVolume: 0.5, 
    sfxVolume: 1.0,
    currentTrack: 'origin', // 'origin' | 'overture'
    bgmTimeout: null,
    
    // MP3 对象
    mp3Audio: null,

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

    // --- 音量控制 ---
    setMusicVolume: function(v) {
        this.musicVolume = v;
        if(this.mp3Audio) this.mp3Audio.volume = v;
    },

    // --- SFX (保持代码生成) ---
    tone: function(f, type, d, v=0.1) { 
        if(this.isMuted || !this.ctx) return; 
        const vol = v * this.sfxVolume; 
        if(vol <= 0) return;

        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const now = this.ctx.currentTime;

        o.type = type;
        o.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.01, now + d + 0.1);

        o.connect(g);
        g.connect(this.ctx.destination);
        o.start();
        o.stop(now + d + 0.1);
    },

    playPlace: function() { this.tone(400, 'sine', 0.1, 0.3); },
    playSkill: function() { 
        this.tone(600, 'triangle', 0.1, 0.2);
        setTimeout(() => this.tone(800, 'triangle', 0.2, 0.1), 100);
    },
    playWin: function() { 
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.2, 0.4), i * 150)); 
    },
    playGrandWin: function() { 
        [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 'square', 0.2, 0.4), i * 120)); 
    },
    playError: function() { this.tone(150, 'sawtooth', 0.2, 0.2); },
    playChaos: function() { 
        [800, 400, 600, 200].forEach((f, i) => setTimeout(() => this.tone(f, 'sawtooth', 0.1, 0.1), i * 60)); 
    },

    // --- BGM 控制器 (混合模式) ---
    switchTrack: function(track) {
        if(this.currentTrack === track) return;
        this.currentTrack = track;
        if(this.isPlaying && !this.isMuted) {
            this.stopBGM(); // 停掉当前的（无论是代码还是MP3）
            this.startBGM(); // 启动新的
        }
    },

    startBGM: function() { 
        if(this.isMuted || this.isPlaying) return; 
        this.isPlaying = true; 
        
        if (this.currentTrack === 'origin') {
            this.playOriginLoop();
        } else {
            this.playMp3Loop();
        }
    },

    stopBGM: function() { 
        this.isPlaying = false; 
        clearTimeout(this.bgmTimeout); // 停止代码音乐
        if (this.mp3Audio) {
            this.mp3Audio.pause(); // 停止 MP3
            this.mp3Audio = null;
        }
    },

    // 1. 原初 (代码生成)
    playOriginLoop: function() {
        if(!this.isPlaying || this.currentTrack !== 'origin') return;
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00]; 
        const f = scale[Math.floor(Math.random() * scale.length)];
        const d = 2 + Math.random();
        
        if (this.ctx) {
            this.tone(f, 'sine', d, 0.03 * this.musicVolume); 
        }
        this.bgmTimeout = setTimeout(() => this.playOriginLoop(), d * 800);
    },

    // 2. 序曲 (MP3 文件)
    playMp3Loop: function() {
        if (!this.mp3Audio) {
            this.mp3Audio = new Audio('bgm.mp3'); // 👈 读取根目录下的 bgm.mp3
            this.mp3Audio.loop = true;
            this.mp3Audio.volume = this.musicVolume;
        }
        this.mp3Audio.play().catch(e => console.log("等待交互以播放音乐", e));
    }
};