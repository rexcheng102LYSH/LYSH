// ================= ??????? =================
function renderSkillGrid() { 
    const g = document.getElementById('skillGrid'); 
    g.innerHTML = ''; 
    SKILL_IDS.forEach(sid => { 
        const sd = t(sid, 'skills'); 
        const iconSvg = (typeof SKILL_ICONS !== 'undefined' ? SKILL_ICONS[sid] : '') || ''; 
        const c = document.createElement('div'); 
        c.className = 'skill-card'; 
        c.innerHTML = `
            <div class="skill-icon">${iconSvg}</div>
            <div class="skill-info">
                <div class="skill-title">${sd.name}</div>
                <div class="skill-desc">${sd.desc}</div>
            </div>
        `; 
        c.onclick = () => pickSkill(sid); 
        if (Object.values(playerSkills).includes(sid)) { c.classList.add('selected'); c.onclick = null; } 
        g.appendChild(c); 
    }); 
}

function updateDraftTitle() { 
    const tEl = document.getElementById('draftTitle'); 
    let pickerName = t('names')[GameState.draftTurn]; 
    
    if (GameState.gameMode === 'pve') { 
        const isAITurn = (GameState.humanSide === MAPLE && GameState.draftTurn === SUN) || 
                         (GameState.humanSide === SUN && GameState.draftTurn === MAPLE); 
        if (isAITurn) pickerName += " (AI)"; 
        else pickerName += " (You)"; 
        
        if (isAITurn) setTimeout(() => { 
            const avail = SKILL_IDS.filter(s => !Object.values(GameState.playerSkills).includes(s)); 
            pickSkill(avail[Math.floor(Math.random()*avail.length)]); 
        }, 800); 
    } 
    
    const iconHTML = `<span style="display:inline-block;width:32px;height:32px;vertical-align:bottom;">${getIcon(GameState.draftTurn)}</span>`;
    tEl.innerHTML = t('draftTitle').replace('{icon}', iconHTML).replace('{name}', pickerName); 
    tEl.style.color = GameState.draftTurn === MAPLE ? '#333' : '#666'; 
}
function pickSkill(id) { 
    SoundEngine.playPlace(); 
    GameState.playerSkills[GameState.draftTurn] = id; 
    
    if (GameState.draftTurn === SUN) { 
        GameState.draftTurn = MAPLE; 
        draftTurn = GameState.draftTurn; // 同步
        playerSkills = GameState.playerSkills; // 同步
        renderSkillGrid(); 
        updateDraftTitle(); 
    } else {
        playerSkills = GameState.playerSkills; // 同步
        initGame(); 
    }
}


function activateSkill() {
    if (!GameState.gameActive || GameState.skillUsed[GameState.currentPlayer]) { 
        showToast(t('skillUsed', 'toast')); 
        return; 
    }
    
    if(GameState.selectedCell) { 
        const old = getCell(GameState.selectedCell.r, GameState.selectedCell.c); 
        if(old) old.classList.remove('selected-move'); 
        GameState.selectedCell = null;
        selectedCell = null; // 同步
    }
    
    saveState();
    
    const sid = GameState.playerSkills[GameState.currentPlayer];
    const sname = t(sid, 'skills').name;
    
    SoundEngine.playSkill(); 
    showToast(t('casting', 'toast') + sname); 
    
    GameState.skillUsed[GameState.currentPlayer] = true;
    skillUsed = GameState.skillUsed; // 同步
    updateDynamicUI();
    
    const handler = (window.SkillRegistry && typeof SkillRegistry.getSkill === 'function')
        ? SkillRegistry.getSkill(sid)
        : null;
    if (handler && typeof handler.activate === 'function') {
        handler.activate();
    } else {
        console.warn('[Skill] Missing handler for', sid);
    }
}

function handleSkillInteraction(r, c) {
    SoundEngine.playPlace();
    const cell = getCell(r, c);
    if (!cell) return;
    const handler = (window.SkillRegistry && typeof SkillRegistry.getEffect === 'function')
        ? SkillRegistry.getEffect(activeEffect)
        : null;
    if (handler) {
        handler(r, c, cell);
    } else {
        console.warn('[Skill] Missing effect handler for', activeEffect);
    }
}

if (window.GameHost && typeof window.GameHost.register === 'function') {
    window.GameHost.register('skills', { init: function() {} });
}

