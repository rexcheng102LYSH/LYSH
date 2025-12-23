// ================== AI 逻辑 ==================
// AI 依赖于 game.js 中的全局变量和函数

function aiMove() {
    // [Fix] 将 getBest 定义提前，以便在技能逻辑中使用
    const getBest = () => {
         if (aiDifficulty === 'easy') return getRandomMove();
         else if (aiDifficulty === 'medium') return getScoreMove(false);
         else if (aiDifficulty === 'hard') return getScoreMove(true);
         return getScoreMove(true, true); // Master
    }

    // 1. 技能判斷 (Simple Logic)
    let usedDouble = false;
    
    if (!skillUsed[currentPlayer] && Math.random() < 0.3) {
        const sid = playerSkills[currentPlayer];
        
        // 瞬发类技能 (Instant Cast) - 不需要点击棋盘
        if (['bomb','chaos','short_battle'].includes(sid)) { 
            activateSkill(); 
            if (!gameActive) return; // 炸彈可能結束遊戲
        }
        // [修复] 领地技能 (Zone) - 需要先选一个点作为中心
        else if (sid === 'zone') {
            activateSkill();
            // AI 计算一个最佳位置作为领地中心
            let zoneTarget = getBest();
            if (zoneTarget) {
                // 第一次点击：确认领地范围
                // 注意：这会消耗掉 activeEffect = 'zone_pick'
                handleCellClick(zoneTarget.r, zoneTarget.c, true);
            }
            // 技能释放完毕，代码继续向下执行，进行正常的落子
        }
        else if (sid === 'double') { 
            activateSkill(); 
            usedDouble = true; 
        }
        // 注意：God Hand, Swap, Voodoo, Move 這些需要选子的技能，AI 暫時跳過不使用
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

    // 4. 執行落子 (The Move)
    // 如果刚才释放了领地，这里就是第二次点击（真正的落子）
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