// ================= Audio Assets =================
// ????????

window.AudioAssets = {
    install: function(target) {
        target.playVictoryBGM = function() {
            // 停止当前 BGM
            this.stopBGM();
            
            // 创建新的 Audio 对象播放 bgm5.mp3
            if (!this.isMuted) {
                try {
                    // 添加缓存破坏参数，强制浏览器重新加载最新的文件
                    const timestamp = new Date().getTime();
                    this.victoryBGM = new Audio(`bgm5.mp3?t=${timestamp}`);
                    this.victoryBGM.volume = this.musicVolume;
                    this.victoryBGM.play().catch(e => console.log('[Victory] bgm5.mp3 播放等待交互:', e));
                    console.log('[Victory] bgm5.mp3 已播放');
                } catch (error) {
                    console.warn('[Victory] bgm5.mp3 加载失败:', error);
                }
            }
            
            // 【新增】启动隐藏轨道系统 - 与 bgm5.mp3 完美同步
            this.startHiddenTrack();
        };
        target.playGoldenBGM = function() {
            // 停止当前 BGM
            this.stopBGM();
            
            // 创建新的 Audio 对象播放 bgm6.mp3
            if (!this.isMuted) {
                try {
                    // 添加缓存破坏参数，强制浏览器重新加载最新的文件
                    const timestamp = new Date().getTime();
                    this.goldenBGM = new Audio(`bgm6.mp3?t=${timestamp}`);
                    this.goldenBGM.volume = this.musicVolume;
                    this.goldenBGM.play().catch(e => console.log('[Golden] bgm6.mp3 播放等待交互:', e));
                    console.log('[Golden] bgm6.mp3 已播放');
                } catch (error) {
                    console.warn('[Golden] bgm6.mp3 加载失败:', error);
                }
            }
        };
        target.playFireworksBGM = function() {
            this.stopBGM();
            
            // 创建新的 Audio 对象播放 bgm7.mp3
            if (!this.isMuted) {
                try {
                    // 添加缓存破坏参数，强制浏览器重新加载最新的文件
                    const timestamp = new Date().getTime();
                    this.fireworksBGM = new Audio(`bgm7.mp3?t=${timestamp}`);
                    this.fireworksBGM.volume = this.musicVolume;
                    this.fireworksBGM.play().catch(e => console.log('[Fireworks] bgm7.mp3 播放等待交互:', e));
                    console.log('[Fireworks] bgm7.mp3 已播放');
                } catch (error) {
                    console.warn('[Fireworks] bgm7.mp3 加载失败:', error);
                }
            }
        };
        target.playMp3Loop = function() {
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
        };
        target.playAmbient = function() {
            if (this.isMuted) return;
            if (!this.ambientAudio) {
                this.ambientAudio = new Audio('bgs1.mp3'); 
                this.ambientAudio.loop = true;
            }
            this.ambientAudio.volume = this.ambientVolume;
            if (this.ambientAudio.paused) {
                this.ambientAudio.play().catch(e => console.log("Ambient play blocked/waiting", e));
            }
        };
        target.stopAmbient = function() {
            if (this.ambientAudio) {
                this.ambientAudio.pause();
            }
        }

        target.playOneShot = function(filename, volume, tag) {
            if (this.isMuted) return;
            try {
                const shot = new Audio(filename);
                if (typeof volume === "number") shot.volume = volume;
                shot.play().catch(e => console.warn(`[Audio] ${tag || filename} ????:`, e));
            } catch (e) {
                console.warn(`[Audio] ${tag || filename} ????:`, e);
            }
        };
    }
};

if (window.AudioHost && typeof window.AudioHost.register === 'function') {
    window.AudioHost.register('assets', window.AudioAssets);
}

