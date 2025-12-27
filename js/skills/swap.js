(function() {
  if (!window.SkillRegistry || typeof SkillRegistry.registerSkill !== 'function') return;
  SkillRegistry.registerSkill('swap', {
    activate: function() {
      GameState.activeEffect = 'swap_pick_1';
      activeEffect = 'swap_pick_1'; // sync
      const b = document.getElementById('board');
      if (b) b.classList.add('casting-move-src');
      showToast(t('swapPickSelf', 'toast'));
    },
    effects: {
      swap_pick_1: function(r, c, cell) {
        const p = board[r][c];
        if (p !== currentPlayer) { SoundEngine.playError(); return; }
        GameState.effectData.swapSrc = { r, c, val: p };
        effectData.swapSrc = { r, c, val: p }; // sync
        GameState.activeEffect = 'swap_pick_2';
        activeEffect = 'swap_pick_2'; // sync
        const b = document.getElementById('board');
        if (b) {
          b.classList.remove('casting-move-src');
          b.classList.add('casting-move-dest');
        }
        cell.style.opacity = '0.5';
        showToast(t('swapPickEnemy', 'toast'));
      },
      swap_pick_2: function(r, c) {
        const p = board[r][c];
        const enemy = currentPlayer === MAPLE ? SUN : MAPLE;
        if (p !== enemy) { SoundEngine.playError(); return; }
        const s1 = effectData.swapSrc;
        const s2 = { r, c, val: p };
        const c1 = getCell(s1.r, s1.c);
        if (c1) c1.style.opacity = '1';
        GameState.board[s1.r][s1.c] = s2.val;
        board[s1.r][s1.c] = s2.val; // sync
        GameState.board[s2.r][s2.c] = s1.val;
        board[s2.r][s2.c] = s1.val; // sync
        if (c1) { c1.innerHTML = ''; placePiece(s1.r, s1.c, s2.val, true); }
        const c2 = getCell(s2.r, s2.c);
        if (c2) { c2.innerHTML = ''; placePiece(s2.r, s2.c, s1.val, true); }
        GameState.activeEffect = null;
        activeEffect = null; // sync
        const b = document.getElementById('board');
        if (b) b.classList.remove('casting-move-dest');
        const wl1 = checkWin(s1.r, s1.c, s2.val);
        if (wl1) { highlightWin(wl1, s2.val); return; }
        const wl2 = checkWin(s2.r, s2.c, s1.val);
        if (wl2) { highlightWin(wl2, s1.val); return; }
        showToast(t('swapDone', 'toast'));
      }
    }
  });
})();
