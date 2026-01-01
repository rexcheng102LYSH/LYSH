// ================= ????? UI =================
// ================= DJ 底鼓提示灯开关 =================
// [Alpha 0.7.9.3] 改为使用 GameState.djIndicatorEnabled
// let djDrumIndicatorEnabled = false;  // 已移至 GameState

// [CRITICAL FIX] 将变量暴露到 window 对象，确保跨文件安全访问
window.djDrumIndicatorEnabled = GameState.djIndicatorEnabled;

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
    // [联网对战修复] 跳过带有 online-modal 类的弹窗，避免意外隐藏联网 UI
    document.querySelectorAll('.modal').forEach(m => {
        if (!m.classList.contains('online-modal')) {
            m.style.display = 'none';
        }
    });
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
    updateBoardShakeUI();
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

// [Alpha 0.7.9.3] 棋盘震动开关
function changeBoardShake(state) {
    SoundEngine.playPlace();
    
    if (state === 'on') {
        GameState.boardShakeEnabled = true;
        boardShakeEnabled = true;
    } else {
        GameState.boardShakeEnabled = false;
        boardShakeEnabled = false;
    }
    
    updateBoardShakeUI();
}

function updateBoardShakeUI() {
    document.querySelectorAll('.shake-opt').forEach(el => el.classList.remove('active'));
    
    if (GameState.boardShakeEnabled) {
        const el = document.getElementById('shakeOn');
        if (el) el.classList.add('active');
    } else {
        const el = document.getElementById('shakeOff');
        if (el) el.classList.add('active');
    }
}

// [Alpha 0.7.9.3] LYSH 开发者区域
function openLyshPanel() {
    document.getElementById('lyshModal').style.display = 'flex';
    updateDJIndicatorUI();
}

function closeLyshPanel() {
    document.getElementById('lyshModal').style.display = 'none';
}

// [联网对战] 打开联网对战测试入口
function openOnlineTest() {
    closeLyshPanel();
    OnlineUI.showOnlineMenu();
}

// [Alpha 0.7.9.3] DJ 提示器开关（从原 FPS 设置迁移）
function changeDJIndicator(state) {
    SoundEngine.playPlace();
    
    if (state === 'on') {
        GameState.djIndicatorEnabled = true;
        djIndicatorEnabled = true;
        window.djDrumIndicatorEnabled = true; // 兼容旧代码
    } else {
        GameState.djIndicatorEnabled = false;
        djIndicatorEnabled = false;
        window.djDrumIndicatorEnabled = false; // 兼容旧代码
    }
    
    updateDJIndicatorUI();
}

function updateDJIndicatorUI() {
    const offBtn = document.getElementById('djIndicatorOff');
    const onBtn = document.getElementById('djIndicatorOn');
    
    if (offBtn) offBtn.classList.remove('active');
    if (onBtn) onBtn.classList.remove('active');
    
    if (GameState.djIndicatorEnabled) {
        if (onBtn) onBtn.classList.add('active');
    } else {
        if (offBtn) offBtn.classList.add('active');
    }
}

// [Alpha 0.7.9.3] 键盘 L 键监听 - 打开 LYSH 区域
document.addEventListener('keydown', function(e) {
    // 按 L 键打开 LYSH 开发者区域
    if (e.key === 'l' || e.key === 'L') {
        // 检查是否在输入框中，避免干扰
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        openLyshPanel();
    }
});

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
    // [Alpha 0.7.9.3] 初始化长按检测（黑白 + 自然）
    setupPieceLongPress();
    setupNatureLongPress();
}

function closePieceSelector() {
    document.getElementById('pieceSelectorModal').style.display = 'none';
    document.getElementById('skinModal').style.display = 'flex';
    // [Alpha 0.7.9.3] 清理长按状态（黑白 + 自然）
    cleanupPieceLongPress();
    cleanupNatureLongPress();
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
    // [Alpha 0.7.9.1] 实时应用棋盘皮肤到游戏棋盘
    applyBoardSkin();
}

// [Alpha 0.7.9.1] 应用棋盘皮肤
// [Alpha 0.7.9.4] 新增沙滩皮肤支持
// [Alpha 0.7.9.5] 新增国际象棋皮肤支持
function applyBoardSkin() {
    const boardEl = document.getElementById('board');
    const wrapperEl = document.querySelector('.board-wrapper');
    if (!boardEl) return;
    
    // 移除所有棋盘皮肤类
    boardEl.classList.remove('skin-modern', 'skin-beach', 'skin-chess');
    if (wrapperEl) {
        wrapperEl.classList.remove('skin-beach');
    }
    
    // 清除国际象棋格子样式
    clearChessPattern();
    
    // 应用新皮肤
    if (currentBoardSkin === 'modern') {
        boardEl.classList.add('skin-modern');
    } else if (currentBoardSkin === 'beach') {
        boardEl.classList.add('skin-beach');
        if (wrapperEl) {
            wrapperEl.classList.add('skin-beach');
        }
    } else if (currentBoardSkin === 'chess') {
        boardEl.classList.add('skin-chess');
        applyChessPattern();
    }
    // classic_wood 是默认样式，不需要额外的类
}

// [Alpha 0.7.9.5] 应用国际象棋黑白格子图案
function applyChessPattern() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    
    const cells = boardEl.querySelectorAll('.cell');
    cells.forEach(cell => {
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        
        // 基于 (row + col) % 2 判断黑白格
        // 为了视觉效果，让左上角(0,0)为白色
        if ((r + c) % 2 === 0) {
            cell.classList.add('chess-white');
        } else {
            cell.classList.add('chess-black');
        }
    });
}

// [Alpha 0.7.9.5] 清除国际象棋格子样式
function clearChessPattern() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    
    const cells = boardEl.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('chess-white', 'chess-black');
    });
}

function updateBoardSelectorUI() {
    document.querySelectorAll('#boardSelectorModal .skin-grid-item').forEach(el => el.classList.remove('active'));
    if (currentBoardSkin === 'classic_wood') {
        const el = document.getElementById('boardGridClassic');
        if (el) el.classList.add('active');
    } else if (currentBoardSkin === 'modern') {
        const el = document.getElementById('boardGridModern');
        if (el) el.classList.add('active');
    } else if (currentBoardSkin === 'beach') {
        const el = document.getElementById('boardGridBeach');
        if (el) el.classList.add('active');
    } else if (currentBoardSkin === 'chess') {
        const el = document.getElementById('boardGridChess');
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
    } else if (currentBoardSkin === 'modern') {
        preview.innerHTML = '<div class="board-mini-preview modern-preview" style="width:100%;height:100%;border-radius:8px;"></div>';
    } else if (currentBoardSkin === 'beach') {
        preview.innerHTML = '<div class="board-mini-preview beach-preview" style="width:100%;height:100%;border-radius:8px;"></div>';
    } else if (currentBoardSkin === 'chess') {
        preview.innerHTML = '<div class="board-mini-preview chess-preview" style="width:100%;height:100%;border-radius:8px;"></div>';
    }
}

if (window.GameHost && typeof window.GameHost.register === 'function') {
    window.GameHost.register('ui', { init: function() {} });
}

// ================= [Alpha 0.7.9.3] 棋子特效调试系统 =================

// 长按检测相关变量
let pieceLongPressTimer = null;
let pieceLongPressTarget = null;
const LONG_PRESS_DURATION = 700; // 0.7秒

// 初始化长按检测
function setupPieceLongPress() {
    const classicItem = document.getElementById('pieceGridClassic');
    if (!classicItem) return;
    
    // 添加长按就绪标记
    classicItem.classList.add('long-press-ready');
    
    // 鼠标事件
    classicItem.addEventListener('mousedown', handlePieceLongPressStart);
    classicItem.addEventListener('mouseup', handlePieceLongPressEnd);
    classicItem.addEventListener('mouseleave', handlePieceLongPressEnd);
    
    // 触摸事件（移动端）
    classicItem.addEventListener('touchstart', handlePieceLongPressStart, { passive: true });
    classicItem.addEventListener('touchend', handlePieceLongPressEnd);
    classicItem.addEventListener('touchcancel', handlePieceLongPressEnd);
}

// 清理长按检测
function cleanupPieceLongPress() {
    const classicItem = document.getElementById('pieceGridClassic');
    if (!classicItem) return;
    
    // 清除计时器
    if (pieceLongPressTimer) {
        clearTimeout(pieceLongPressTimer);
        pieceLongPressTimer = null;
    }
    
    // 移除动画类
    classicItem.classList.remove('long-pressing', 'long-press-complete');
    
    // 移除事件监听器
    classicItem.removeEventListener('mousedown', handlePieceLongPressStart);
    classicItem.removeEventListener('mouseup', handlePieceLongPressEnd);
    classicItem.removeEventListener('mouseleave', handlePieceLongPressEnd);
    classicItem.removeEventListener('touchstart', handlePieceLongPressStart);
    classicItem.removeEventListener('touchend', handlePieceLongPressEnd);
    classicItem.removeEventListener('touchcancel', handlePieceLongPressEnd);
}

// 长按开始
function handlePieceLongPressStart(e) {
    const target = e.currentTarget;
    pieceLongPressTarget = target;
    
    // 添加长按动画类
    target.classList.add('long-pressing');
    
    // 设置计时器
    pieceLongPressTimer = setTimeout(() => {
        // 长按完成
        target.classList.remove('long-pressing');
        target.classList.add('long-press-complete');
        
        // 播放音效
        SoundEngine.playPlace();
        
        // 短暂延迟后打开二级界面
        setTimeout(() => {
            target.classList.remove('long-press-complete');
            openPieceEffectPanel();
        }, 300);
        
        pieceLongPressTimer = null;
    }, LONG_PRESS_DURATION);
}

// 长按结束（未完成）
function handlePieceLongPressEnd(e) {
    const target = pieceLongPressTarget || e.currentTarget;
    
    // 清除计时器
    if (pieceLongPressTimer) {
        clearTimeout(pieceLongPressTimer);
        pieceLongPressTimer = null;
    }
    
    // 移除动画类
    target.classList.remove('long-pressing');
    
    pieceLongPressTarget = null;
}

// 打开棋子特效调试面板
function openPieceEffectPanel() {
    document.getElementById('pieceSelectorModal').style.display = 'none';
    document.getElementById('pieceEffectModal').style.display = 'flex';
    updatePieceEffectUI();
}

// 关闭棋子特效调试面板
function closePieceEffectPanel() {
    document.getElementById('pieceEffectModal').style.display = 'none';
    document.getElementById('pieceSelectorModal').style.display = 'flex';
}

// 切换棋子质感
function changePieceTexture(texture) {
    SoundEngine.playPlace();
    GameState.pieceEffectSettings.classic.texture = texture;
    pieceEffectSettings = GameState.pieceEffectSettings; // 同步
    updatePieceEffectUI();
}

// 更新棋子特效UI状态
function updatePieceEffectUI() {
    const settings = GameState.pieceEffectSettings.classic;
    
    // 棋子质感
    document.getElementById('texture3D').classList.remove('active');
    document.getElementById('textureFlat').classList.remove('active');
    if (settings.texture === '3d') {
        document.getElementById('texture3D').classList.add('active');
    } else {
        document.getElementById('textureFlat').classList.add('active');
    }
    
    // 波纹气场
    document.getElementById('rippleOff').classList.remove('active');
    document.getElementById('rippleOn').classList.remove('active');
    if (settings.rippleEnabled) {
        document.getElementById('rippleOn').classList.add('active');
    } else {
        document.getElementById('rippleOff').classList.add('active');
    }
    
    // 棋子回弹
    document.getElementById('bounceOff').classList.remove('active');
    document.getElementById('bounceOn').classList.remove('active');
    if (settings.bounceEnabled) {
        document.getElementById('bounceOn').classList.add('active');
    } else {
        document.getElementById('bounceOff').classList.add('active');
    }
    
    // 落子速度
    document.getElementById('dropFast').classList.remove('active');
    document.getElementById('dropSlow').classList.remove('active');
    if (settings.dropStyle === 'fast') {
        document.getElementById('dropFast').classList.add('active');
    } else {
        document.getElementById('dropSlow').classList.add('active');
    }
}

// 切换波纹气场
function changePieceRipple(state) {
    SoundEngine.playPlace();
    GameState.pieceEffectSettings.classic.rippleEnabled = (state === 'on');
    pieceEffectSettings = GameState.pieceEffectSettings; // 同步
    updatePieceEffectUI();
}

// 切换棋子回弹
function changePieceBounce(state) {
    SoundEngine.playPlace();
    GameState.pieceEffectSettings.classic.bounceEnabled = (state === 'on');
    pieceEffectSettings = GameState.pieceEffectSettings; // 同步
    updatePieceEffectUI();
}

// 切换落子风格
function changePieceDropStyle(style) {
    SoundEngine.playPlace();
    GameState.pieceEffectSettings.classic.dropStyle = style;
    pieceEffectSettings = GameState.pieceEffectSettings; // 同步
    updatePieceEffectUI();
}

// 获取当前棋子的落子动画类名
function getPieceDropAnimationClass() {
    if (currentSkin === 'nature') {
        // 自然皮肤使用独立设置
        const settings = GameState.pieceEffectSettings.nature;
        const style = settings.dropStyle;
        const bounce = settings.bounceEnabled;
        
        if (style === 'fast') {
            return bounce ? 'drop-fast-bounce' : 'drop-fast';
        } else {
            return bounce ? 'drop-slow-bounce' : 'drop-slow';
        }
    }
    
    // 黑白皮肤
    const settings = GameState.pieceEffectSettings.classic;
    const style = settings.dropStyle;
    const bounce = settings.bounceEnabled;
    
    if (style === 'fast') {
        return bounce ? 'drop-fast-bounce' : 'drop-fast';
    } else {
        return bounce ? 'drop-slow-bounce' : 'drop-slow';
    }
}

// 检查是否启用波纹特效（黑白皮肤）
function isPieceRippleEnabled() {
    if (currentSkin !== 'classic') {
        return false; // 自然皮肤不使用波纹，使用专属特效
    }
    return GameState.pieceEffectSettings.classic.rippleEnabled;
}

// 检查是否启用自然特效（自然皮肤）
function isNatureEffectEnabled() {
    if (currentSkin !== 'nature') {
        return false;
    }
    return GameState.pieceEffectSettings.nature.effectEnabled;
}

// 获取当前棋子的质感类名
function getPieceTextureClass() {
    // 只有 classic 皮肤支持质感调试
    if (currentSkin !== 'classic') {
        return 'texture-3d'; // 其他皮肤使用默认立体质感
    }
    
    const texture = GameState.pieceEffectSettings.classic.texture;
    return texture === 'flat' ? 'texture-flat' : 'texture-3d';
}

// ================= [Alpha 0.7.9.3] 自然棋子特效调试系统 =================

// 自然棋子长按检测变量
let natureLongPressTimer = null;
let natureLongPressTarget = null;

// 初始化自然棋子长按检测
function setupNatureLongPress() {
    const natureItem = document.getElementById('pieceGridNature');
    if (!natureItem) return;
    
    // 添加长按就绪标记
    natureItem.classList.add('long-press-ready');
    
    // 鼠标事件
    natureItem.addEventListener('mousedown', handleNatureLongPressStart);
    natureItem.addEventListener('mouseup', handleNatureLongPressEnd);
    natureItem.addEventListener('mouseleave', handleNatureLongPressEnd);
    
    // 触摸事件（移动端）
    natureItem.addEventListener('touchstart', handleNatureLongPressStart, { passive: true });
    natureItem.addEventListener('touchend', handleNatureLongPressEnd);
    natureItem.addEventListener('touchcancel', handleNatureLongPressEnd);
}

// 清理自然棋子长按检测
function cleanupNatureLongPress() {
    const natureItem = document.getElementById('pieceGridNature');
    if (!natureItem) return;
    
    if (natureLongPressTimer) {
        clearTimeout(natureLongPressTimer);
        natureLongPressTimer = null;
    }
    
    natureItem.classList.remove('long-pressing', 'long-press-complete');
    
    natureItem.removeEventListener('mousedown', handleNatureLongPressStart);
    natureItem.removeEventListener('mouseup', handleNatureLongPressEnd);
    natureItem.removeEventListener('mouseleave', handleNatureLongPressEnd);
    natureItem.removeEventListener('touchstart', handleNatureLongPressStart);
    natureItem.removeEventListener('touchend', handleNatureLongPressEnd);
    natureItem.removeEventListener('touchcancel', handleNatureLongPressEnd);
}

// 自然棋子长按开始
function handleNatureLongPressStart(e) {
    const target = e.currentTarget;
    natureLongPressTarget = target;
    
    target.classList.add('long-pressing');
    
    natureLongPressTimer = setTimeout(() => {
        target.classList.remove('long-pressing');
        target.classList.add('long-press-complete');
        
        SoundEngine.playPlace();
        
        setTimeout(() => {
            target.classList.remove('long-press-complete');
            openNatureEffectPanel();
        }, 300);
        
        natureLongPressTimer = null;
    }, LONG_PRESS_DURATION);
}

// 自然棋子长按结束
function handleNatureLongPressEnd(e) {
    const target = natureLongPressTarget || e.currentTarget;
    
    if (natureLongPressTimer) {
        clearTimeout(natureLongPressTimer);
        natureLongPressTimer = null;
    }
    
    target.classList.remove('long-pressing');
    natureLongPressTarget = null;
}

// 打开自然棋子特效调试面板
function openNatureEffectPanel() {
    document.getElementById('pieceSelectorModal').style.display = 'none';
    document.getElementById('natureEffectModal').style.display = 'flex';
    updateNatureEffectUI();
}

// 关闭自然棋子特效调试面板
function closeNatureEffectPanel() {
    document.getElementById('natureEffectModal').style.display = 'none';
    document.getElementById('pieceSelectorModal').style.display = 'flex';
}

// 更新自然棋子特效UI状态
function updateNatureEffectUI() {
    const settings = GameState.pieceEffectSettings.nature;
    
    // 自然特效
    document.getElementById('natureFxOff').classList.remove('active');
    document.getElementById('natureFxOn').classList.remove('active');
    if (settings.effectEnabled) {
        document.getElementById('natureFxOn').classList.add('active');
    } else {
        document.getElementById('natureFxOff').classList.add('active');
    }
    
    // 棋子回弹
    document.getElementById('natureBounceOff').classList.remove('active');
    document.getElementById('natureBounceOn').classList.remove('active');
    if (settings.bounceEnabled) {
        document.getElementById('natureBounceOn').classList.add('active');
    } else {
        document.getElementById('natureBounceOff').classList.add('active');
    }
    
    // 落子速度
    document.getElementById('natureDropFast').classList.remove('active');
    document.getElementById('natureDropSlow').classList.remove('active');
    if (settings.dropStyle === 'fast') {
        document.getElementById('natureDropFast').classList.add('active');
    } else {
        document.getElementById('natureDropSlow').classList.add('active');
    }
}

// 切换自然特效
function changeNatureEffect(state) {
    SoundEngine.playPlace();
    GameState.pieceEffectSettings.nature.effectEnabled = (state === 'on');
    pieceEffectSettings = GameState.pieceEffectSettings; // 同步
    updateNatureEffectUI();
}

// 切换自然棋子回弹
function changeNatureBounce(state) {
    SoundEngine.playPlace();
    GameState.pieceEffectSettings.nature.bounceEnabled = (state === 'on');
    pieceEffectSettings = GameState.pieceEffectSettings; // 同步
    updateNatureEffectUI();
}

// 切换自然棋子落子风格
function changeNatureDropStyle(style) {
    SoundEngine.playPlace();
    GameState.pieceEffectSettings.nature.dropStyle = style;
    pieceEffectSettings = GameState.pieceEffectSettings; // 同步
    updateNatureEffectUI();
}

