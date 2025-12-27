// ================= Audio Core =================
// 统一音频系统的 Host + Plugins 结构

window.AudioHost = window.AudioHost || {
    modules: {},
    activeModule: null,

    register: function(name, module) {
        if (!name || !module) return;
        this.modules[name] = module;
        this.bootstrap();
    },

    bootstrap: function() {
        const hub = this.modules.hub;
        if (!hub || !hub.target) return;

        Object.keys(this.modules).forEach((key) => {
            const mod = this.modules[key];
            if (!mod || mod._installed || typeof mod.install !== 'function') return;
            mod.install(hub.target);
            mod._installed = true;
        });

        this.activeModule = hub.target;
        window.SoundEngine = hub.target;
        window.AudioHub = hub.target;
    }
};
