(function() {
  if (!window.SkillRegistry || typeof SkillRegistry.registerSkill !== 'function') return;
  SkillRegistry.registerSkill('bomb', {
    activate: function() {
      const opp = GameState.currentPlayer === MAPLE ? SUN : MAPLE;
      GameState.timeRemaining[opp] -= 150;
      timeRemaining = GameState.timeRemaining; // sync
      GameState.bombTarget = opp;
      bombTarget = GameState.bombTarget; // sync
      showToast(t('bombStart', 'toast'));
      if (GameState.timeRemaining[opp] <= 0) {
        triggerExplosion();
        return;
      }
      updateDynamicUI();
    }
  });
})();
