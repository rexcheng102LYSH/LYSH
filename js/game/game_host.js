// ================= Game Host =================
// 统一游戏模块入口结构（Host + Modules）

window.GameHost = window.GameHost || {
    modules: {},

    register: function(name, module) {
        if (!name || !module) return;
        this.modules[name] = module;
    },

    init: function() {
        Object.keys(this.modules).forEach((key) => {
            const mod = this.modules[key];
            if (mod && typeof mod.init === 'function') {
                mod.init();
            }
        });
    }
};
