(function() {
  if (!window.SkillRegistry || typeof SkillRegistry.registerSkill !== 'function') return;
  SkillRegistry.registerSkill('move_enemy', {
    activate: function() {
      GameState.activeEffect = 'move_pick';
      GameState.effectData = { mode: 'enemy' };
      activeEffect = 'move_pick'; // sync
      effectData = { mode: 'enemy' }; // sync
      const b = document.getElementById('board');
      if (b) b.classList.add('casting-move-src');
      showToast(t('moveSrcEnemy', 'toast'));
    },
    effects: {
      move_pick: function(r, c, cell) {
        const p = board[r][c];
        if ((effectData.mode === 'self' && p !== currentPlayer) ||
            (effectData.mode === 'enemy' && (p === EMPTY || p === currentPlayer))) {
          SoundEngine.playError();
          return;
        }
        GameState.effectData.src = { r, c, val: p };
        effectData.src = { r, c, val: p }; // sync
        GameState.activeEffect = 'move_drop';
        activeEffect = 'move_drop'; // sync
        const b = document.getElementById('board');
        if (b) {
          b.classList.remove('casting-move-src');
          b.classList.add('casting-move-dest');
        }
        cell.style.opacity = '0.5';
        showToast(t('moveDest', 'toast'));
      },
      move_drop: function(r, c) {
        if (board[r][c] !== EMPTY || isZoneRestricted(r, c, currentPlayer)) {
          SoundEngine.playError();
          return;
        }
        const src = effectData.src;
        GameState.board[src.r][src.c] = EMPTY;
        board[src.r][src.c] = EMPTY; // sync
        const sc = getCell(src.r, src.c);
        if (sc) {
          sc.innerHTML = '';
          sc.style.opacity = '1';
        }
        placePiece(r, c, src.val, true);
        GameState.activeEffect = null;
        activeEffect = null; // sync
        const b = document.getElementById('board');
        if (b) b.classList.remove('casting-move-dest');
        const winLine = checkWin(r, c, src.val);
        if (winLine) highlightWin(winLine, src.val);
        else showToast(t('moveDone', 'toast'));
      }
    }
  });
})();
