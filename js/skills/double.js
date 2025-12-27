(function() {
  if (!window.SkillRegistry || typeof SkillRegistry.registerSkill !== 'function') return;
  SkillRegistry.registerSkill('double', {
    activate: function() {
      GameState.isDoubleMoveActive = true;
      isDoubleMoveActive = true; // sync
      showToast(t('doubleStart', 'toast'));
    }
  });
})();
