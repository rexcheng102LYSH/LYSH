(function() {
  if (!window.SkillRegistry || typeof SkillRegistry.registerSkill !== 'function') return;
  SkillRegistry.registerSkill('zone', {
    activate: function() {
      GameState.activeEffect = 'zone_pick';
      activeEffect = 'zone_pick'; // sync
      const b = document.getElementById('board');
      if (b) b.classList.add('casting-territory');
      showToast(t('zonePick', 'toast'));
    },
    effects: {
      zone_pick: function(r, c) {
        document.querySelectorAll('.territory-preview').forEach(el => el.classList.remove('territory-preview'));
        GameState.territoryZones.push({ r, c, owner: currentPlayer, turns: 6 });
        territoryZones = GameState.territoryZones; // sync
        updateTerritoriesUI();
        GameState.activeEffect = null;
        activeEffect = null; // sync
        const b = document.getElementById('board');
        if (b) b.classList.remove('casting-territory');
        showToast(t('zoneDone', 'toast'));
      }
    }
  });
})();
