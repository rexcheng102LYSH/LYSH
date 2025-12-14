// ================== AI 邏輯 ==================
// AI 依賴於 game.js 中的全局變量和函數

function aiMove() {
    // 1. 技能判斷 (Simple Logic)
    let usedDouble = false;
    
    // Fix 1: 使用 currentPlayer 獲取當前 AI 的技能，而不是寫死
    if (!skillUsed[currentPlayer] && Math.random() < 0.3) {
        const sid = playerSkills[currentPlayer];
        
        // Fix 2: AI 只使用不需要復雜交互（選子）的技能
        // 這些技能通常是 "點擊即用" (Instant Cast) 或者 "狀態類"
        if (['bomb','chaos','short_battle','zone'].includes(sid)) { 
            activateSkill(); 
            if (!gameActive) return; // 炸彈可能結束遊戲
        }
        else if (sid === 'double') { 
            activateSkill(); 
            usedDouble = true; 
        }
        // 注意：God Hand, Swap, Voodoo, Move 這些需要選子的技能，AI 暫時跳過不使用
        // 這是為了防止 AI 卡死在 "等待選子" 的狀態
    }
    
    // 2. 計算最佳落點
    const getBest = () => {
         if (aiDifficulty === 'easy') return getRandomMove();
         else if (aiDifficulty === 'medium') return getScoreMove(false);
         else if (aiDifficulty === 'hard') return getScoreMove(true);
         return getScoreMove(true, true); // Master
    }

    // 3. 特殊開局優化：如果是第一手，強制下天元 (7,7)
    // 判斷棋盤是否全空 (除了腐蝕點)
    let isEmptyBoard = true;
    for(let r=0; r<BOARD_SIZE; r++) {
        for(let c=0; c<BOARD_SIZE; c++) {
            if(board[r][c] === MAPLE || board[r][c] === SUN) { 
                isEmptyBoard = false; break; 
            }
        }
    }
    
    if (isEmptyBoard) {
        handleCellClick(7, 7, true); // true = bypassConfirm (AI 不需要雙擊確認)
        return;
    }

    // 4. 執行落子
    let m1 = getBest(); 
    if (m1) handleCellClick(m1.r, m1.c, true);

    // 5. 處理雙連的第二子
    if (usedDouble) {
        setTimeout(() => {
            if (!gameActive) return;
            let m2 = getBest(); 
            if (m2) handleCellClick(m2.r, m2.c, true); 
        }, 600); // 延遲一點，讓玩家看清楚
    }
}