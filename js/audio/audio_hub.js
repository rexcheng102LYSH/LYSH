// ================= Audio Hub =================
// 负责音频系统枢纽逻辑与全局状态管理

window.SoundEngine = {
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
    victoryBGM: null,
    goldenBGM: null,
    fireworksBGM: null,

    isCritical: false,

    // DJ 节奏游戏状态 - 三阶段系统
    djGame: {
        active: false,
        phase: 'idle', // 'challenge', 'fail', 'victory'
        startTime: 0,
        beatDuration: 0.6, // 100 BPM
        nextNoteTime: 0,
        noteIndex: 0,
        schedulerID: null,

        // 挑战阶段数据
        challengeBeats: [],
        totalBeats: 7,
        hitBeats: 0,
        missedBeats: 0,

        // 胜利阶段数据
        victoryStartTime: 0,
        autoKickInterval: null,

        // 隐藏轨道系统 - 双轨同步
        hiddenTrack: {
            active: false,
            startTime: 0,
            kickInterval: null,
            beatCount: 0
        }
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
        const btn = document.querySelector('.sound-toggle');
        if (btn) btn.innerText = this.isMuted ? '🔇' : '🎵';
        if (this.isMuted) {
            this.stopBGM();
            this.stopAmbient();
            this.stopDJGame();
        } else {
            this.startBGM();
            if (window.BackgroundEngine && window.BackgroundEngine.activeSeason === 'spring') {
                this.playAmbient();
            }
        }
    },

    setMusicVolume: function(v) {
        this.musicVolume = v;
        if (this.mp3Audio) this.mp3Audio.volume = v;
        if (this.victoryBGM) this.victoryBGM.volume = v;
        if (this.goldenBGM) this.goldenBGM.volume = v;
        if (this.fireworksBGM) this.fireworksBGM.volume = v;
    },

    setAmbientVolume: function(v) {
        this.ambientVolume = v;
        if (this.ambientAudio) this.ambientAudio.volume = v;
    },

    setSfxVolume: function(v) {
        this.sfxVolume = v;
    },

    setCritical: function(critical) {
        this.isCritical = critical;
    },

    switchTrack: function(track) {
        const trackChanged = (this.currentTrack !== track);
        this.currentTrack = track;
        if (trackChanged) {
            if (this.isPlaying && !this.isMuted) {
                this.stopBGM();
                this.startBGM();
            } else if (!this.isMuted) {
                this.startBGM();
            }
        }
    },

    startBGM: function() {
        if (this.isMuted || this.isPlaying) return;
        this.isPlaying = true;
        if (this.currentTrack === 'bomb') this.playBombLoop();
        else if (this.currentTrack === 'origin') this.playOriginLoop();
        else this.playMp3Loop();
    },

    stopBGM: function() {
        this.isPlaying = false;
        clearTimeout(this.bgmTimeout);
        if (this.mp3Audio) {
            this.mp3Audio.pause();
            this.mp3Audio = null;
        }
    },

    playOriginLoop: function() {
        if (!this.isPlaying || this.currentTrack !== 'origin') return;
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00];
        const f = scale[Math.floor(Math.random() * scale.length)];
        const d = 2 + Math.random();
        if (this.ctx) this.playNote(f, d, 'sine', 0.03 * this.musicVolume, 0.5, 2.0);
        this.bgmTimeout = setTimeout(() => this.playOriginLoop(), d * 800);
    },

    playBombLoop: function() {
        if (!this.isPlaying || this.currentTrack !== 'bomb') return;
        let stepTime = 700;
        if (this.isCritical) {
            stepTime = 350;
            this.playNote(800, 0.05, 'square', 0.05 * this.musicVolume, 0.01, 0.05);
            if (this.bombStep % 2 === 0) {
                this.playStringPad(49.00, 2.5, 0.15 * this.musicVolume);
                this.playStringPad(73.42, 2.5, 0.10 * this.musicVolume);
            }
        } else {
            stepTime = 500;
            this.playNote(1200, 0.05, 'square', 0.08 * this.musicVolume, 0.005, 0.02);
            if (this.bombStep % 2 === 0) {
                this.playStringPad(783.99, 0.4, 0.1 * this.musicVolume);
                this.playStringPad(1108.7, 0.4, 0.08 * this.musicVolume);
                this.playNote(3000 + Math.random() * 1000, 0.1, 'sawtooth', 0.03 * this.musicVolume, 0.01, 0.1);
            }
        }
        this.bombStep++;
        this.bgmTimeout = setTimeout(() => this.playBombLoop(), stepTime);
    },

    bombStep: 0
};

// Host 注册与兼容命名
if (window.AudioHost && typeof window.AudioHost.register === 'function') {
    window.AudioHost.register('hub', { target: window.SoundEngine });
}
window.AudioHub = window.SoundEngine;
