// ================== I18N (语言包独立文件) ==================
const I18N = {
    'zh-TW': {
        langName: "繁", 
        gameTitle: "技能五子棋 <span style='font-size:0.5em'>Alpha</span>", 
        subTitle: "v0.7.8.2", 
        btnPvE: "人機對戰 (PvE)", 
        btnPvPSingle: "雙人單局 (PvP)", 
        btnPvPBO3: "三番戰 (PvP BO3)", 
        hintSound: "點擊任意處開啟沉浸音效",
        titleDiff: "選擇難度", 
        diffEasy: "簡單", diffMedium: "中等", diffHard: "困難", diffMaster: "大師", 
        btnBack: "返回",
        titlePickSide: "猜先 / 選邊", 
        descPickSide: "請選擇執黑(先手)或執白(後手)", 
        descPickSideLoser: "上一局失利者選邊",
        sideFirst: "先手 (執黑)", sideSecond: "後手 (執白)",
        draftTitle: "{icon} {name} (選技能)", 
        btnUndo: "悔棋", btnExit: "退出", 
        skillReady: "點擊釋放", skillUsed: "(已用)", skillName: "技能", skillNoTarget: "(缺目標)",
        confirmExit: "確定要退出嗎？棋局將丟失。", 
        pveTag: "電腦: ", 
        names: { 1: "先手方", 2: "後手方" }, 
        titleSettings: "系統設置", 
        lblMusicVol: "音樂音量", lblSfxVol: "音效音量", lblAmbientVol: "環境音效",
        lblMusicTrack: "背景音樂",
        
        trackOrigin: "原初", 
        trackBgm1: "春箏", 
        trackBgm2: "夏笛",
        trackBgm3: "秋琴", 
        trackBgm4: "冬弦",
        
        lblSeason: "背景特效",
        seasonSpring: "春雨", seasonSummer: "夏陽", seasonAutumn: "秋葉", seasonWinter: "冬雪",
        
        lblFPSLimit: "畫面幀率",
        fps60: "60 FPS（推薦）",
        fpsUnlimited: "無限制",

        btnClose: "關閉",
        errNoSkinInGame: "對局進行中無法更換皮膚！",

        // [New] 特效菜单翻译
        lblWinEffect: "連珠特效",
        lblWinCelebration: "勝利特效",
        effDefault: "默認",
        effLightning: "⚡ 閃電",
        effGold: "👑 金黃",
        effFuture: "🚀 未來",
        effFireworks: "🎇 煙花",
        effChromatic: "🌈 炫彩",
        effDJ: "🎵 DJ",

        skills: {
            double: { name: "雙連", desc: "本回合落兩子" },
            voodoo: { name: "巫毒", desc: "腐蝕一格，繼續落子" },
            move_self: { name: "移花接木", desc: "移己方一子，繼續落子" },
            move_enemy: { name: "乾坤大挪移", desc: "移敵方一子，繼續落子" },
            zone: { name: "領地", desc: "劃定3x3禁區(6回合)" },
            bomb: { name: "時間炸彈", desc: "扣除對方2.5分鐘！(致死)" },
            god_hand: { name: "上帝之手", desc: "移任意兩子，結束回合" },
            chaos: { name: "混亂骰子", desc: "對手下兩步隨機偏移" },
            short_battle: { name: "短兵戰", desc: "接下來6回合內，由五子連珠改為四子即勝" },
            swap: { name: "置換反應", desc: "換敵我各一子，繼續落子" }
        },
        toast: {
            skillUsed: "技能已用盡", casting: "釋放：", 
            doubleStart: "雙連：請下第1子", doubleNext: "雙連：請下第2子！",
            voodooPick: "選擇腐蝕目標", voodooDone: "腐蝕完成，請落子", 
            moveSrcSelf: "選擇己方棋子", moveSrcEnemy: "選擇敵方棋子",
            moveDest: "選擇新位置", moveDone: "移動完成，請落子", 
            zonePick: "選擇領地中心", zoneDone: "領地生成，請落子",
            bombStart: "炸彈已啟動", 
            errInvalid: "無效操作", errZone: "禁區無法落子", undoPvP: "競技模式無悔棋！",
            godPick1: "上帝之手：選擇第1顆棋子", godDest1: "選擇第1次落點", godPick2: "上帝之手：選擇第2顆棋子", godDest2: "選擇第2次落點",
            chaosTrigger: "混亂觸發！落點偏移", 
            chaosLabel: "混亂:", 
            shortBattleLabel: "短兵:", 
            zoneLabel: "領地:", 
            shortBattleStart: "短兵戰！四子即勝",
            swapPickSelf: "置換：選己方子", swapPickEnemy: "置換：選敵方子", swapDone: "置換完成，請落子", 
            undoDone: "悔棋成功", timeOut: "時間耗盡！"
        },
        end: { 
            win: "獲勝！", lose: "挑戰失敗", 
            grandWin: "👑 大勝利！", grandWinDesc: "{name} 贏得了三番戰", 
            score: "比分", btnNext: "下一局", btnMenu: "主菜單", btnRestart: "再來一局", btnQuitMatch: "退出比賽" 
        }
    },
    'zh': {
        langName: "简", 
        gameTitle: "技能五子棋 <span style='font-size:0.5em'>Alpha</span>", 
        subTitle: "v0.7.8.2", 
        btnPvE: "人机对战 (PvE)", 
        btnPvPSingle: "双人单局 (PvP)", 
        btnPvPBO3: "三番战 (PvP BO3)", 
        hintSound: "点击任意处开启沉浸音效",
        titleDiff: "选择难度", 
        diffEasy: "简单", diffMedium: "中等", diffHard: "困难", diffMaster: "大师", 
        btnBack: "返回",
        titlePickSide: "猜先 / 选边", 
        descPickSide: "请选择执黑(先手)或执白(后手)", 
        descPickSideLoser: "上一局失利者选边",
        sideFirst: "先手 (执黑)", sideSecond: "后手 (执白)",
        draftTitle: "{icon} {name} (选技能)", 
        btnUndo: "悔棋", btnExit: "退出", 
        skillReady: "点击释放", skillUsed: "(已用)", skillName: "技能", skillNoTarget: "(缺目标)",
        confirmExit: "确定要退出吗？棋局将丢失。", 
        pveTag: "电脑: ", 
        names: { 1: "先手方", 2: "后手方" }, 
        titleSettings: "系统设置", 
        lblMusicVol: "音乐音量", lblSfxVol: "音效音量", lblAmbientVol: "环境音效",
        lblMusicTrack: "背景音乐",
        
        trackOrigin: "原初", 
        trackBgm1: "春筝", 
        trackBgm2: "夏笛", 
        trackBgm3: "秋琴", 
        trackBgm4: "冬弦",
        
        lblSeason: "背景特效",
        seasonSpring: "春雨", seasonSummer: "夏阳", seasonAutumn: "秋叶", seasonWinter: "冬雪",
        
        lblFPSLimit: "画面帧率",
        fps60: "60 FPS（推荐）",
        fpsUnlimited: "无限制",

        btnClose: "关闭",
        errNoSkinInGame: "对局进行中无法更换皮肤！",

        // [New] 特效菜单翻译
        lblWinEffect: "连珠特效",
        lblWinCelebration: "胜利特效",
        effDefault: "默认",
        effLightning: "⚡ 闪电",
        effGold: "👑 金黄",
        effFuture: "🚀 未来",
        effFireworks: "🎇 烟花",
        effChromatic: "🌈 炫彩",
        effDJ: "🎵 DJ",

        skills: {
            double: { name: "双连", desc: "本回合落两子" },
            voodoo: { name: "巫毒", desc: "腐蚀一格，继续落子" },
            move_self: { name: "移花接木", desc: "移己方一子，继续落子" },
            move_enemy: { name: "乾坤大挪移", desc: "移敌方一子，继续落子" },
            zone: { name: "领地", desc: "划定3x3禁区(6回合)" },
            bomb: { name: "时间炸弹", desc: "对手必须在150秒内获胜，否则判负" },
            god_hand: { name: "上帝之手", desc: "移除两颗任意棋子，并重新落子" },
            chaos: { name: "混沌干扰", desc: "对手下两回合落子将随机偏移一格" },
            short_battle: { name: "短兵相接", desc: "接下来6回合内，由五子连珠改为四子即胜" },
            swap: { name: "置换反应", desc: "换敌我各一子，继续落子" }
        },
        toast: {
            skillUsed: "技能已用尽", casting: "释放：", 
            doubleStart: "双连：请下第1子", doubleNext: "双连：请下第2子！",
            voodooPick: "选择腐蚀目标", voodooDone: "腐蚀完成，请落子", 
            moveSrcSelf: "选择己方棋子", moveSrcEnemy: "选择敌方棋子",
            moveDest: "选择新位置", moveDone: "移动完成，请落子", 
            zonePick: "选择领地中心", zoneDone: "领地生成，请落子",
            bombStart: "炸弹爆炸！对方-2.5分钟", 
            errInvalid: "无效操作", errZone: "禁区无法落子", undoPvP: "竞技模式无悔棋！",
            godPick1: "上帝之手：选第1子", godDest1: "选第1落点", godPick2: "上帝之手：选第2子", godDest2: "选第2落点",
            chaosTrigger: "混乱触发！落点偏移", 
            chaosLabel: "混乱:", 
            shortBattleLabel: "短兵:", 
            zoneLabel: "领地:", 
            shortBattleStart: "短兵战！四子即胜",
            swapPickSelf: "置换：选己方子", swapPickEnemy: "置换：选敌方子", swapDone: "置换完成，请落子", 
            undoDone: "悔棋成功", timeOut: "时间耗尽！"
        },
        end: { 
            win: "获胜！", lose: "挑战失败", 
            grandWin: "👑 大胜利！", grandWinDesc: "{name} 赢得三番战", 
            score: "比分", btnNext: "下一局", btnMenu: "主菜单", btnRestart: "再来一局", btnQuitMatch: "退出比赛" 
        }
    },
    'en': {
        langName: "En", 
        gameTitle: "Skill Gomoku <span style='font-size:0.5em'>Alpha</span>", 
        subTitle: "v0.7.8.2", 
        btnPvE: "PvE Mode (AI)", 
        btnPvPSingle: "PvP (Single)", 
        btnPvPBO3: "PvP BO3 Series", 
        hintSound: "Tap to enable audio",
        titleDiff: "Difficulty", 
        diffEasy: "Easy", diffMedium: "Medium", diffHard: "Hard", diffMaster: "Master", 
        btnBack: "Back",
        titlePickSide: "Pick Side", 
        descPickSide: "Choose First(Black) or Second(White)", 
        descPickSideLoser: "Loser picks side",
        sideFirst: "First (Black)", sideSecond: "Second (White)",
        draftTitle: "{icon} {name} (Draft)", 
        btnUndo: "Undo", btnExit: "Exit", 
        skillReady: "Cast", skillUsed: "(Used)", skillName: "Skill", skillNoTarget: "(No Target)",
        confirmExit: "Quit game? Progress lost.", 
        pveTag: "CPU: ", 
        names: { 1: "First Player", 2: "Second Player" }, 
        titleSettings: "Settings", 
        lblMusicVol: "Music Volume", lblSfxVol: "SFX Volume", lblAmbientVol: "Ambient SFX",
        lblMusicTrack: "Background Music",
        
        trackOrigin: "Origin", 
        trackBgm1: "Spring Zither", 
        trackBgm2: "Summer Flute", 
        trackBgm3: "Autumn Qin", 
        trackBgm4: "Winter Strings",
        
        lblSeason: "Background FX",
        seasonSpring: "Spring Rain", seasonSummer: "Summer Sun", seasonAutumn: "Autumn Leaves", seasonWinter: "Winter Snow",
        
        lblFPSLimit: "Frame Rate",
        fps60: "60 FPS (Recommended)",
        fpsUnlimited: "Unlimited",

        btnClose: "Close",
        errNoSkinInGame: "Cannot change skin during game!",

        // [New] Effect Menu Translations
        lblWinEffect: "Line Effect",
        lblWinCelebration: "Win Celebration",
        effDefault: "Default",
        effLightning: "⚡ Thunder",
        effGold: "👑 Gold",
        effFuture: "🚀 Future",
        effFireworks: "🎇 Firework",
        effChromatic: "🌈 Chromatic",
        effDJ: "🎵 DJ",

        skills: {
            double: { name: "Double Strike", desc: "Place 2 pieces." },
            voodoo: { name: "Voodoo", desc: "Corrupt cell, then move." },
            move_self: { name: "Teleport Self", desc: "Move self" },
            move_enemy: { name: "Teleport Enemy", desc: "Move enemy" },
            zone: { name: "Sanctuary", desc: "Claim 3x3 zone (6 turns)." },
            bomb: { name: "Time Bomb", desc: "-2.5 Mins to Opponent! (Lethal)" },
            god_hand: { name: "Hand of God", desc: "Move ANY 2 pieces. End turn." },
            chaos: { name: "Chaos Dice", desc: "Opponent's next 2 moves offset." },
            short_battle: { name: "Skirmish", desc: "Win by 4-in-a-row (6 turns)." },
            swap: { name: "Displacement", desc: "Swap pieces" }
        },
        toast: {
            skillUsed: "Depleted", casting: "Cast: ", 
            doubleStart: "Double: Place 1st", doubleNext: "Double: 2nd!",
            voodooPick: "Pick target", voodooDone: "Done. Move now!", 
            moveSrcSelf: "Pick YOURS", moveSrcEnemy: "Pick ENEMY",
            moveDest: "Pick dest", moveDone: "Done. Move now!", 
            zonePick: "Pick center", zoneDone: "Done. Move now!",
            bombStart: "Bomb! -2.5 Mins", 
            errInvalid: "Invalid", errZone: "Restricted Zone", undoPvP: "No undo in PvP!",
            godPick1: "God: Pick 1st", godDest1: "Dest 1", godPick2: "God: Pick 2nd", godDest2: "Dest 2",
            chaosTrigger: "Chaos! Missed!", 
            chaosLabel: "Chaos:", 
            shortBattleLabel: "Skirmish:", 
            zoneLabel: "Zone:", 
            shortBattleStart: "Skirmish Mode!", 
            swapPickSelf: "Swap: Yours", swapPickEnemy: "Swap: Enemy", swapDone: "Done. Move now!", 
            undoDone: "Undone", timeOut: "Time Out!"
        },
        end: { 
            win: "Wins!", lose: "Defeat", 
            grandWin: "👑 Grand Victory!", grandWinDesc: "{name} Wins!", 
            score: "Score", btnNext: "Next Round", btnMenu: "Menu", btnRestart: "Replay", btnQuitMatch: "Forfeit" 
        }
    }
};

// 默认语言设为 'zh-TW' (繁体)
let curLangKey = 'zh-TW';
const LANG_ORDER = ['zh-TW', 'zh', 'en'];

function t(key, path=null) { 
    if(path) {
        if (I18N[curLangKey] && I18N[curLangKey][path] && I18N[curLangKey][path][key]) {
            return I18N[curLangKey][path][key];
        }
        return key; 
    }
    if (I18N[curLangKey] && I18N[curLangKey][key]) {
        return I18N[curLangKey][key];
    }
    return key; 
}

function toggleLanguage() { 
    const idx = LANG_ORDER.indexOf(curLangKey); 
    curLangKey = LANG_ORDER[(idx + 1) % LANG_ORDER.length]; 
    const btn = document.querySelector('.lang-btn');
    if (btn) btn.innerText = I18N[curLangKey].langName; 
    
    // 强制刷新当前界面文本
    updateStaticText(); 
    
    // 如果设置界面开着，刷新设置界面
    const settings = document.getElementById('settingsModal');
    if(settings && settings.style.display === 'flex') {
        if(typeof openSettings === 'function') openSettings(); 
    }

    // 如果游戏正在进行，刷新动态 UI (Toast, Status Bar etc)
    if(typeof updateDynamicUI === 'function' && typeof gameActive !== 'undefined' && gameActive) {
        updateDynamicUI(); 
    }
}

function updateStaticText() {
    document.querySelectorAll('[data-i18n]').forEach(el => { 
        const key = el.getAttribute('data-i18n'); 
        el.innerHTML = t(key); 
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.lang-btn');
    if (btn && I18N[curLangKey]) btn.innerText = I18N[curLangKey].langName;
    updateStaticText();
});