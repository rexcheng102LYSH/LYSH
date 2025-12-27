(function() {
  if (!window.SkillRegistry || typeof SkillRegistry.registerSkill !== 'function') return;
  SkillRegistry.registerSkill('short_battle', {
    activate: function() {
      GameState.shortBattleTurns = 6;
      shortBattleTurns = GameState.shortBattleTurns; // sync
      showToast(t('shortBattleStart', 'toast'));
      updateDynamicUI();
    }
  });
})();
