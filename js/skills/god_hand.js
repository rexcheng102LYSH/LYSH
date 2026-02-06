(function() {
  if (!window.SkillRegistry || typeof SkillRegistry.registerSkill !== 'function') return;
  SkillRegistry.registerSkill('god_hand', {
    activate: function() {
      GameState.activeEffect = 'god_pick_1';
      activeEffect = 'god_pick_1'; // sync
      const b = document.getElementById('board');
      if (b) b.classList.add('casting-move-src');
      showToast(t('godPick1', 'toast'));
    },
    effects: {
      god_pick_1: function(r, c, cell) {
        const p = board[r][c];
        if (p === EMPTY || p === CORRODED) { SoundEngine.playError(); return; }
        GameState.effectData.godSrc1 = { r, c, val: p };
        effectData.godSrc1 = { r, c, val: p }; // sync
        GameState.activeEffect = 'god_drop_1';
        activeEffect = 'god_drop_1'; // sync
        const b = document.getElementById('board');
        if (b) {
          b.classList.remove('casting-move-src');
          b.classList.add('casting-move-dest');
        }
        cell.style.opacity = '0.5';
        showToast(t('godDest1', 'toast'));
      },
      god_drop_1: function(r, c) {
        if (board[r][c] !== EMPTY || isZoneRestricted(r, c, currentPlayer)) { SoundEngine.playError(); return; }
        const s1 = effectData.godSrc1;
        GameState.board[s1.r][s1.c] = EMPTY;
        board[s1.r][s1.c] = EMPTY; // sync
        const c1 = getCell(s1.r, s1.c);
        if (c1) { c1.innerHTML = ''; c1.style.opacity = '1'; }
        placePiece(r, c, s1.val, true);
        const b = document.getElementById('board');
        if (b) b.classList.remove('casting-move-dest');
        const wl = checkWin(r, c, s1.val);
        if (wl) { highlightWin(wl, s1.val); return; }
        GameState.activeEffect = 'god_pick_2';
        activeEffect = 'god_pick_2'; // sync
        if (b) b.classList.add('casting-move-src');
        showToast(t('godPick2', 'toast'));
      },
      god_pick_2: function(r, c, cell) {
        const p = board[r][c];
        if (p === EMPTY || p === CORRODED) { SoundEngine.playError(); return; }
        GameState.effectData.godSrc2 = { r, c, val: p };
        effectData.godSrc2 = { r, c, val: p }; // sync
        GameState.activeEffect = 'god_drop_2';
        activeEffect = 'god_drop_2'; // sync
        const b = document.getElementById('board');
        if (b) {
          b.classList.remove('casting-move-src');
          b.classList.add('casting-move-dest');
        }
        cell.style.opacity = '0.5';
        showToast(t('godDest2', 'toast'));
      },
      god_drop_2: function(r, c) {
        if (board[r][c] !== EMPTY || isZoneRestricted(r, c, currentPlayer)) { SoundEngine.playError(); return; }
        const s2 = effectData.godSrc2;
        GameState.board[s2.r][s2.c] = EMPTY;
        board[s2.r][s2.c] = EMPTY; // sync
        const c2 = getCell(s2.r, s2.c);
        if (c2) { c2.innerHTML = ''; c2.style.opacity = '1'; }
        placePiece(r, c, s2.val, true);
        GameState.activeEffect = null;
        activeEffect = null; // sync
        const b = document.getElementById('board');
        if (b) b.classList.remove('casting-move-dest');
        const wl = checkWin(r, c, s2.val);
        if (wl) highlightWin(wl, s2.val);
        else switchTurn();
      }
    }
  });
})();
