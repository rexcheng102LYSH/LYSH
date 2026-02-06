(function() {
  if (!window.SkillRegistry || typeof SkillRegistry.registerSkill !== 'function') return;
  SkillRegistry.registerSkill('voodoo', {
    activate: function() {
      GameState.activeEffect = 'voodoo_pick';
      activeEffect = 'voodoo_pick'; // sync
      const b = document.getElementById('board');
      if (b) b.classList.add('casting-voodoo');
      showToast(t('voodooPick', 'toast'));
    },
    effects: {
      voodoo_pick: function(r, c, cell) {
        if (board[r][c] === EMPTY || board[r][c] === CORRODED) {
          SoundEngine.playError();
          return;
        }
        GameState.board[r][c] = CORRODED;
        board[r][c] = CORRODED; // sync
        cell.innerHTML = '';
        cell.className = 'cell corroded';
        GameState.activeEffect = null;
        activeEffect = null; // sync
        const b = document.getElementById('board');
        if (b) b.classList.remove('casting-voodoo');
        showToast(t('voodooDone', 'toast'));
      }
    }
  });
})();
