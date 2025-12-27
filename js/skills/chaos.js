(function() {
  if (!window.SkillRegistry || typeof SkillRegistry.registerSkill !== 'function') return;
  SkillRegistry.registerSkill('chaos', {
    activate: function() {
      const opp = GameState.currentPlayer === MAPLE ? SUN : MAPLE;
      GameState.chaosDebuff[opp] += 2;
      chaosDebuff = GameState.chaosDebuff; // sync
      updateDynamicUI();
    }
  });
})();
