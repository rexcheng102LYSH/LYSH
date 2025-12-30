// ================= ????? UI =================
// ================= DJ 底鼓提示灯开关 =================
let djDrumIndicatorEnabled = false;  // 默认关闭（60FPS 时）

// [CRITICAL FIX] 将变量暴露到 window 对象，确保跨文件安全访问
window.djDrumIndicatorEnabled = djDrumIndicatorEnabled;

function getIcon(player) {
    if (typeof PIECE_ICONS === 'undefined') return (player === MAPLE ? 'B' : 'W');
    
    let iconData;
    if (currentSkin === 'nature') {
        iconData = (player === MAPLE ? PIECE_ICONS.maple : PIECE_ICONS.sun);
    } else {
        iconData = (player === MAPLE ? PIECE_ICONS.classic_black : PIECE_ICONS.classic_white);
    }

    if (typeof iconData === 'string') {
        return iconData;
    } else if (iconData && iconData.type === 'image') {
        return `<img src="${iconData.src}" alt="${iconData.alt}" class="piece-img inline-icon-img" style="width:100%;height:100%;object-fit:contain;vertical-align:middle;">`;
    }
    return '?';
}

// ================= 界面控制 =================
const screens = { 
    main: document.getElementById('mainMenu'), 
    diff: document.getElementById('difficultyScreen'), 
    turn: document.getElementById('turnSelectScreen'), 
    draft: document.getElementById('skillSelectScreen'), 
    game: document.getElementById('gameScreen'), 
    settings: document.getElementById('settingsModal'),
    skin: document.getElementById('skinModal'),
    pieceSelector: document.getElementById('pieceSelectorModal'),
    boardSelector: document.getElementById('boardSelectorModal')
};

function showScreen(n) { 
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    Object.values(screens).forEach(s => { 
        if(s && !s.classList.contains('modal')) s.classList.remove('active'); 
    }); 
    if (screens[n]) screens[n].classList.add('active'); 
    if (n === 'game') {
        setTimeout(() => {
            if (typeof VisualFX !== 'undefined') VisualFX.init();
        }, 100);
    }
}

function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('sliderMusic').value = SoundEngine.musicVolume * 100;
    document.getElementById('valMusic').innerText = Math.round(SoundEngine.musicVolume * 100) + '%';
    document.getElementById('sliderSfx').value = SoundEngine.sfxVolume * 100;
    document.getElementById('valSfx').innerText = Math.round(SoundEngine.sfxVolume * 100) + '%';
    document.getElementById('sliderAmbient').value = SoundEngine.ambientVolume * 100;
    document.getElementById('valAmbient').innerText = Math.round(SoundEngine.ambientVolume * 100) + '%';
    updateTrackUI();
    updateSeasonUI();
    updateFPSUI();
    updateStatusScrollUI();
}
function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }

function openSkinMenu() {
    if (gameActive) {
        showToast(t('errNoSkinInGame'));
        SoundEngine.playError();
        return;
    }
    document.getElementById('skinModal').style.display = 'flex';
    updateSkinUI();
    updateWinEffectUI();
    updateWinCelebrationUI();
    // [Alpha 0.7.9.0] 初始化入口按钮预览
    updatePieceEntryPreview();
    updateBoardEntryPreview();
}
function closeSkinMenu() { document.getElementById('skinModal').style.display = 'none'; }

function changeSkin(skin) {
    SoundEngine.playPlace();
    GameState.currentSkin = skin;
    currentSkin = GameState.currentSkin; // 同步
    updateSkinUI();
    if (screens.turn.classList.contains('active')) {
        document.querySelector('.turn-card.maple .icon').innerHTML = getIcon(MAPLE);
        document.querySelector('.turn-card.sun .icon').innerHTML = getIcon(SUN);
    }
}

function changeWinEffect(effect) {
    SoundEngine.playPlace();
    GameState.winEffect = effect;
    winEffect = GameState.winEffect; // 同步
    updateWinEffectUI();
}

function changeWinCelebration(type) {
    SoundEngine.playPlace();
    GameState.winCelebration = type;
    winCelebration = GameState.winCelebration; // 同步
    updateWinCelebrationUI();
}

function updateSkinUI() {
    // [Alpha 0.7.9.0] 旧的 skin-option 已被新的入口按钮系统替代
    // 更新入口按钮预览
    updatePieceEntryPreview();
    updateBoardEntryPreview();
}

function updateWinEffectUI() {
    document.querySelectorAll('.effect-opt').forEach(el => el.classList.remove('active'));
    if (winEffect === 'default') document.getElementById('winDefault').classList.add('active');
    else if (winEffect === 'lightning') document.getElementById('winLightning').classList.add('active');
    else if (winEffect === 'gold') document.getElementById('winGold').classList.add('active');
    else if (winEffect === 'future') document.getElementById('winFuture').classList.add('active');
}

function updateWinCelebrationUI() {
    document.querySelectorAll('.celebration-opt').forEach(el => el.classList.remove('active'));
    // [Alpha 0.7.7.9] 恢复 DJ 选项，Chromatic 暂时隐藏或保留按钮但无效果
    if (winCelebration === 'default') {
        const el = document.getElementById('celDefault'); if(el) el.classList.add('active');
    } else if (winCelebration === 'fireworks') {
        const el = document.getElementById('celFireworks'); if(el) el.classList.add('active');
    } else if (winCelebration === 'golden') {
        const el = document.getElementById('celGolden'); if(el) el.classList.add('active');
    } else if (winCelebration === 'dj') {
        const el = document.getElementById('celDJ'); if(el) el.classList.add('active');
    }
}

function updateVolume(type, val) {
    const v = val / 100;
    if (type === 'music') { 
        SoundEngine.setMusicVolume(v); 
        document.getElementById('valMusic').innerText = val + '%'; 
    } else if (type === 'sfx') { 
        SoundEngine.sfxVolume = v; 
        document.getElementById('valSfx').innerText = val + '%'; 
    } else if (type === 'ambient') {
        SoundEngine.setAmbientVolume(v);
        document.getElementById('valAmbient').innerText = val + '%';
    }
}

function changeTrack(track) { 
    if (SoundEngine.currentTrack === 'bomb') { 
        GameState.userMusicPref = track; 
        userMusicPref = GameState.userMusicPref; // 同步
        updateTrackUI(); 
        return; 
    } 
    GameState.userMusicPref = track; 
    userMusicPref = GameState.userMusicPref; // 同步
    SoundEngine.switchTrack(track); 
    updateTrackUI(); 
}

function updateTrackUI() {
    const trackIds = ['trackOrigin', 'trackBgm1', 'trackBgm2', 'trackBgm3', 'trackBgm4'];
    trackIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
    let activeId = 'trackOrigin';
    if (userMusicPref === 'bgm1') activeId = 'trackBgm1';
    else if (userMusicPref === 'bgm2') activeId = 'trackBgm2';
    else if (userMusicPref === 'bgm3') activeId = 'trackBgm3';
    else if (userMusicPref === 'bgm4') activeId = 'trackBgm4';
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}

function changeSeason(season) {
    SoundEngine.playPlace();
    GameState.currentSeason = season;
    currentSeason = GameState.currentSeason; // 同步
    if (window.BackgroundEngine && typeof window.BackgroundEngine.switchSeason === 'function') {
        window.BackgroundEngine.switchSeason(season);
    }
    updateSeasonUI();
}

function updateSeasonUI() {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    seasons.forEach(s => {
        const btn = document.getElementById('season' + s.charAt(0).toUpperCase() + s.slice(1));
        if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById('season' + currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1));
    if (activeBtn) activeBtn.classList.add('active');
}

function changeFPSLimit(limit) {
    SoundEngine.playPlace();
    
    // [Alpha 0.7.8.3] 改造：无限制按钮现在控制底鼓提示灯开关
    // 60 FPS 按钮：关闭提示灯（默认）
    // 无限制按钮：开启提示灯（内部测试用）
    if (limit === '60') {
        djDrumIndicatorEnabled = false;
        window.djDrumIndicatorEnabled = false; // [CRITICAL FIX] 同步到 window 对象
    } else if (limit === 'unlimited') {
        djDrumIndicatorEnabled = true;
        window.djDrumIndicatorEnabled = true; // [CRITICAL FIX] 同步到 window 对象
    }
    
    // 不改变实际帧数，保持锁帧 60fps
    GameState.fpsLimit = '60';
    fpsLimit = '60';
    FrameRateController.setFPSLimit('60');
    
    updateFPSUI();
}

function updateFPSUI() {
    document.querySelectorAll('.fps-opt').forEach(el => el.classList.remove('active'));
    
    // 根据提示灯状态更新 UI
    if (djDrumIndicatorEnabled) {
        const el = document.getElementById('fpsUnlimited');
        if (el) el.classList.add('active');
    } else {
        const el = document.getElementById('fps60');
        if (el) el.classList.add('active');
    }
}

function changeStatusScrollMode(mode) {
    GameState.statusScrollMode = mode;
    statusScrollMode = GameState.statusScrollMode; // 同步
    if (mode === 'manual') {
        GameState.statusScrollOpen = false;
        statusScrollOpen = GameState.statusScrollOpen;
        GameState.statusScrollAutoOpened = false;
        statusScrollAutoOpened = GameState.statusScrollAutoOpened;
        GameState.statusScrollLastCount = 0;
        statusScrollLastCount = GameState.statusScrollLastCount;
    }
    updateStatusScrollUI();
    updateSkillScroll();
}

function updateStatusScrollUI() {
    document.querySelectorAll('.status-scroll-opt').forEach(el => el.classList.remove('active'));
    if (statusScrollMode === 'manual') {
        const el = document.getElementById('statusScrollManual');
        if (el) el.classList.add('active');
    } else {
        const el = document.getElementById('statusScrollAuto');
        if (el) el.classList.add('active');
    }
}


function updateScoreBoard() { document.getElementById('scoreBoard').innerText = `P1 (${p1Score}) : (${p2Score}) P2`; }


function updateTerritoriesUI() { 
    document.querySelectorAll('.territory-zone').forEach(el => el.classList.remove('territory-zone')); 
    territoryZones.forEach(z => { 
        for(let i=z.r-1; i<=z.r+1; i++) { 
            for(let j=z.c-1; j<=z.c+1; j++) { 
                const c = getCell(i, j); 
                if(c) c.classList.add('territory-zone'); 
            } 
        } 
    }); 
}


function updateDynamicUI() {
    // 使用 GameState 確保數據一致性
    const turnTextEl = document.getElementById('turnText');
    const newTurnText = t('names')[GameState.currentPlayer === MAPLE ? 1 : 2];
    if (turnTextEl.innerText !== newTurnText) turnTextEl.innerText = newTurnText;
    
    const turnIconEl = document.getElementById('turnIcon');
    turnIconEl.innerHTML = getIcon(GameState.currentPlayer);
    
    const statusBar = document.getElementById('statusBar');
    const newClass = 'status-pill ' + (GameState.currentPlayer === MAPLE ? 'turn-maple' : 'turn-sun');
    if (statusBar.className !== newClass) statusBar.className = newClass;
    
    const t1 = document.getElementById('timer1');
    const t2 = document.getElementById('timer2');
    
    const getTimerHTML = (player, time) => {
        let base = `<span class="inline-icon" style="width:20px;height:20px;margin-right:4px">${getIcon(player)}</span> ${formatTime(time)}`;
        if (GameState.bombTarget === player && typeof SKILL_ICONS !== 'undefined') {
            const animClass = time < 30 ? 'bomb-status-critical' : 'bomb-status-normal';
            base += `<span class="bomb-attached-icon ${animClass}">${SKILL_ICONS.bomb}</span>`;
        }
        return base;
    };

    t1.innerHTML = getTimerHTML(MAPLE, GameState.timeRemaining[MAPLE]);
    t2.innerHTML = getTimerHTML(SUN, GameState.timeRemaining[SUN]);
    
    const updateTimerVisual = (player, timerEl, time) => {
        timerEl.className = `timer-pill ${GameState.currentPlayer === player ? 'active' : ''}`;
        if (GameState.bombTarget === player) {
            if (time < 30) {
                timerEl.classList.add('timer-critical');
            } else {
                timerEl.classList.add('timer-bomb');
            }
        } else if (time < 30) {
            timerEl.classList.add('timer-critical-normal');
        }
    };
    updateTimerVisual(MAPLE, t1, GameState.timeRemaining[MAPLE]);
    updateTimerVisual(SUN, t2, GameState.timeRemaining[SUN]);
    
    updateSkillScroll();
    
    const ms = playerSkills[currentPlayer];
    const u = skillUsed[currentPlayer];
    const btn = document.getElementById('skillBtn');
    
    if (!ms) {
        btn.disabled = true;
        btn.innerHTML = `<span>---</span><small>---</small>`;
        return;
    }
    
    const so = t(ms, 'skills');
    const iconSvg = (typeof SKILL_ICONS !== 'undefined') ? SKILL_ICONS[ms] : '';
    
    let myC = 0, oppC = 0;
    board.forEach(r => r.forEach(c => {
        if (c === currentPlayer) myC++;
        else if (c !== 0 && c !== -1) oppC++;
    }));
    
    let viable = true;
    if (ms === 'move_self' && myC === 0) viable = false;
    else if (ms === 'move_enemy' && oppC === 0) viable = false;
    else if ((ms === 'god_hand' || ms === 'voodoo') && (myC + oppC) === 0) viable = false;
    else if (ms === 'swap' && (myC === 0 || oppC === 0)) viable = false;
    
    let btnContent = '';
    if (u) {
        btn.disabled = true;
        btnContent = `<span>${so.name}</span><small>${t('skillUsed')}</small>`;
    } else if (!viable) {
        btn.disabled = true;
        btnContent = `<span>${so.name}</span><small>${t('skillNoTarget')}</small>`;
    } else {
        btn.disabled = false;
        btnContent = `<div class="skill-icon-display">${iconSvg}</div><span>${so.name}</span>`;
    }
    
    if (btn.innerHTML !== btnContent) btn.innerHTML = btnContent;
}

function updateSkillScroll() {
    const scroll = document.getElementById('skillScroll');
    const list = document.getElementById('skillStatusList');
    if (!scroll || !list) return;

    const items = [];
    const icons = (typeof SKILL_ICONS !== 'undefined') ? SKILL_ICONS : {};

    [MAPLE, SUN].forEach((player) => {
        const turns = GameState.chaosDebuff[player] || 0;
        if (turns > 0) {
            items.push({
                key: `chaos-${player}`,
                icon: icons.chaos || '',
                label: t('chaosLabel', 'toast'),
                value: turns,
                target: getIcon(player)
            });
        }
    });

    if (GameState.shortBattleTurns > 0) {
        items.push({
            key: 'short-battle',
            icon: icons.short_battle || '',
            label: t('shortBattleLabel', 'toast'),
            value: GameState.shortBattleTurns
        });
    }

    if (GameState.territoryZones.length > 0) {
        const maxTurns = Math.max(...GameState.territoryZones.map(z => z.turns));
        items.push({
            key: 'zone',
            icon: icons.zone || '',
            label: t('zoneLabel', 'toast'),
            value: maxTurns
        });
    }

    const isManual = (statusScrollMode === 'manual');
    const itemsByKey = new Map(items.map(item => [item.key, item]));
    const prevOrder = Array.isArray(GameState.statusScrollOrder) ? GameState.statusScrollOrder : [];
    const nextOrder = prevOrder.filter(key => itemsByKey.has(key));
    itemsByKey.forEach((_, key) => {
        if (!nextOrder.includes(key)) nextOrder.push(key);
    });
    const orderedItems = nextOrder.map(key => itemsByKey.get(key)).filter(Boolean);
    const count = orderedItems.length;

    if (isManual && !GameState.statusScrollAutoOpened && count > 0) {
        GameState.statusScrollOpen = true;
        statusScrollOpen = GameState.statusScrollOpen;
        GameState.statusScrollAutoOpened = true;
        statusScrollAutoOpened = GameState.statusScrollAutoOpened;
    }

    const targetCount = 4;
    const visibleSlots = isManual ? (GameState.statusScrollOpen ? targetCount : 0) : count;
    scroll.style.setProperty('--scroll-count', visibleSlots);

    const signature = orderedItems.map(item => `${item.key}:${item.value}:${item.target || ''}`).join('|');
    const rebuildSlots = () => {
        list.innerHTML = '';
        for (let i = 0; i < targetCount; i++) {
            const row = document.createElement('div');
            row.className = 'scroll-item slot';
            row.dataset.slot = `${i}`;

            const left = document.createElement('div');
            left.className = 'scroll-left';
            left.innerHTML = `<span class="scroll-icon slot-icon"></span><span class="slot-label">---</span>`;

            const value = document.createElement('span');
            value.className = 'scroll-count slot-count';
            value.innerText = ' ';

            row.appendChild(left);
            row.appendChild(value);
            list.appendChild(row);
        }
    };

    let needsRebuild = (list.children.length !== targetCount);
    if (!needsRebuild && list.children.length > 0) {
        const probe = list.children[0];
        if (!probe.querySelector('.slot-icon') || !probe.querySelector('.slot-label') || !probe.querySelector('.slot-count')) {
            needsRebuild = true;
        }
    }
    if (needsRebuild) rebuildSlots();

    let slots = Array.from(list.children);
    let invalidSlots = false;
    for (const row of slots) {
        if (!row.querySelector('.scroll-left') || !row.querySelector('.slot-icon') || !row.querySelector('.slot-label') || !row.querySelector('.slot-count')) {
            invalidSlots = true;
            break;
        }
    }
    if (invalidSlots) {
        rebuildSlots();
        slots = Array.from(list.children);
    }
    slots.forEach((row, idx) => {
        const item = orderedItems[idx];
        const left = row.querySelector('.scroll-left');
        const iconEl = row.querySelector('.slot-icon');
        const labelEl = row.querySelector('.slot-label');
        const countEl = row.querySelector('.slot-count');
        const targetEl = left ? left.querySelector('.scroll-target') : null;

        row.classList.remove('filled');
        row.classList.add('empty');
        if (idx >= visibleSlots) row.classList.add('slot-hidden');
        else row.classList.remove('slot-hidden');
        if (targetEl) targetEl.remove();

        if (item) {
            row.classList.add('filled');
            row.classList.remove('empty');
            iconEl.innerHTML = item.icon;
            labelEl.innerText = item.label;
            countEl.innerText = item.value;
            if (item.target) {
                const target = document.createElement('span');
                target.className = 'scroll-target';
                target.innerHTML = item.target;
                left.appendChild(target);
            }
        } else {
            iconEl.innerHTML = '';
            labelEl.innerText = '---';
            countEl.innerText = ' ';
        }
    });

    if (!isManual && statusScrollLastCount !== count) {
        scroll.classList.add('scroll-shake');
        setTimeout(() => scroll.classList.remove('scroll-shake'), 420);
    }
    if (isManual) {
        scroll.onclick = () => {
            GameState.statusScrollOpen = !GameState.statusScrollOpen;
            statusScrollOpen = GameState.statusScrollOpen;
            scroll.classList.add('scroll-shake');
            setTimeout(() => scroll.classList.remove('scroll-shake'), 420);
            updateSkillScroll();
        };
        if (GameState.statusScrollOpen) scroll.classList.add('open');
        else scroll.classList.remove('open');
    } else {
        scroll.onclick = null;
        if (count > 0) scroll.classList.add('open');
        else scroll.classList.remove('open');
    }

    GameState.statusScrollLastCount = count;
    statusScrollLastCount = GameState.statusScrollLastCount;
    GameState.statusScrollLastKey = signature;
    statusScrollLastKey = GameState.statusScrollLastKey;
    GameState.statusScrollOrder = nextOrder;
}

function formatTime(s) { if(s<0) s=0; const m=Math.floor(s/60).toString().padStart(2,'0'); const sec=(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }
function showToast(m){ const t=document.getElementById('toast'); t.innerText=m; t.style.opacity=1; setTimeout(()=>t.style.opacity=0,3000); }

// ================= [Alpha 0.7.9.0] 棋子/棋盘选择器系统 =================

function openPieceSelector() {
    document.getElementById('skinModal').style.display = 'none';
    document.getElementById('pieceSelectorModal').style.display = 'flex';
    updatePieceSelectorUI();
}

function closePieceSelector() {
    document.getElementById('pieceSelectorModal').style.display = 'none';
    document.getElementById('skinModal').style.display = 'flex';
}

function selectPieceSkin(skin) {
    SoundEngine.playPlace();
    GameState.currentSkin = skin;
    currentSkin = GameState.currentSkin;
    updatePieceSelectorUI();
    updatePieceEntryPreview();
    // 同步更新选边界面的棋子图标
    if (screens.turn.classList.contains('active')) {
        document.querySelector('.turn-card.maple .icon').innerHTML = getIcon(MAPLE);
        document.querySelector('.turn-card.sun .icon').innerHTML = getIcon(SUN);
    }
}

function updatePieceSelectorUI() {
    document.querySelectorAll('#pieceSelectorModal .skin-grid-item').forEach(el => el.classList.remove('active'));
    if (currentSkin === 'classic') {
        const el = document.getElementById('pieceGridClassic');
        if (el) el.classList.add('active');
    } else if (currentSkin === 'nature') {
        const el = document.getElementById('pieceGridNature');
        if (el) el.classList.add('active');
    }
}

function updatePieceEntryPreview() {
    const preview = document.getElementById('pieceEntryPreview');
    if (!preview) return;
    
    if (currentSkin === 'classic') {
        preview.innerHTML = `
            <div class="piece-half piece-black-classic" style="width:32px;height:32px;"></div>
            <div class="piece-half piece-white-classic" style="width:32px;height:32px;"></div>
        `;
    } else if (currentSkin === 'nature') {
        preview.innerHTML = `
            <div class="piece-half piece-maple" style="width:32px;height:32px;"></div>
            <div class="piece-half piece-sun" style="width:32px;height:32px;"></div>
        `;
    }
}

function openBoardSelector() {
    document.getElementById('skinModal').style.display = 'none';
    document.getElementById('boardSelectorModal').style.display = 'flex';
    updateBoardSelectorUI();
}

function closeBoardSelector() {
    document.getElementById('boardSelectorModal').style.display = 'none';
    document.getElementById('skinModal').style.display = 'flex';
}

function selectBoardSkin(skin) {
    SoundEngine.playPlace();
    GameState.currentBoardSkin = skin;
    currentBoardSkin = GameState.currentBoardSkin;
    updateBoardSelectorUI();
    updateBoardEntryPreview();
}

function updateBoardSelectorUI() {
    document.querySelectorAll('#boardSelectorModal .skin-grid-item').forEach(el => el.classList.remove('active'));
    if (currentBoardSkin === 'classic_wood') {
        const el = document.getElementById('boardGridClassic');
        if (el) el.classList.add('active');
    }
}

function updateBoardEntryPreview() {
    const preview = document.getElementById('boardEntryPreview');
    if (!preview) return;
    
    // 清空并重建迷你棋盘预览
    preview.className = 'skin-entry-preview board-entry-preview';
    if (currentBoardSkin === 'classic_wood') {
        preview.innerHTML = '<div class="board-mini-preview classic-wood-preview" style="width:100%;height:100%;border-radius:8px;"></div>';
    }
}

if (window.GameHost && typeof window.GameHost.register === 'function') {
    window.GameHost.register('ui', { init: function() {} });
}

