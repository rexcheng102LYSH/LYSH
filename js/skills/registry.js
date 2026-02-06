// Skill registry for activation and effect dispatch.
window.SkillRegistry = window.SkillRegistry || {
  skills: {},
  effects: {},
  registerSkill: function(id, def) {
    if (!id || !def) return;
    this.skills[id] = def;
    if (def.effects) {
      Object.keys(def.effects).forEach((key) => {
        this.effects[key] = def.effects[key];
      });
    }
  },
  getSkill: function(id) {
    return this.skills[id] || null;
  },
  getEffect: function(name) {
    return this.effects[name] || null;
  }
};
