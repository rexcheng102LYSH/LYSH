// ================= 视觉特效核心引擎 (Visual FX Core) =================
// 说明：此文件仅负责资源管理与模块调度，不包含任何具体特效逻辑

window.VisualFX = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    _initialized: false,

    // 模块注册表与当前激活模块
    modules: {},
    activeModule: null,

    // 鼠标状态（供模块读取或调试使用）
    mouse: { x: -1000, y: -1000, active: false, click: false },

    // FPS 计数器
    fps: {
        frameCount: 0,
        lastTime: performance.now(),
        currentFps: 0
    },

    // 初始化引擎
    init() {
        // 防止重复初始化导致事件重复绑定
        if (this._initialized) {
            if (this.canvas) this.resize();
            return;
        }

        this.canvas = document.getElementById('fxCanvas');
        if (!this.canvas) return;

        // 启用低延迟模式和透明度
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true
        });
        this.resize();

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resize());

        // 全屏鼠标移动
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.active = true;
        });
        document.addEventListener('mouseleave', () => {
            this.mouse.active = false;
        });

        // 全屏点击分发
        document.addEventListener('mousedown', (e) => {
            if (!this.canvas || !this.activeModule || typeof this.activeModule.handleClick !== 'function') {
                return;
            }

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.activeModule.handleClick(x, y, e);
        }, true);

        this._initialized = true;
    },

    // 注册模块
    register(name, module) {
        if (!name || !module) return;
        this.modules[name] = module;
    },

    // 主渲染入口：仅负责清屏与模块调度
    renderFrame(now) {
        if (!this.ctx || !this.canvas) {
            return;
        }

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 每帧重置关键绘图状态，避免模块之间相互污染
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.clearRect(0, 0, w, h);

        const lines = this.modules.lines;
        if (lines && typeof lines.render === 'function') {
            ctx.save();
            try {
                lines.render(ctx, w, h, now);
            } finally {
                ctx.restore();
            }
        }

        if (this.activeModule && typeof this.activeModule.render === 'function') {
            ctx.save();
            try {
                this.activeModule.render(ctx, w, h, now);
            } finally {
                ctx.restore();
            }
        }

        this.updateAndRenderFPS(now);
    },

    // 启动特效模块
    startCelebration(type) {
        // 保留连珠线条，只重置当前特效模块
        if (this.activeModule && typeof this.activeModule.reset === 'function') {
            this.activeModule.reset();
        }
        this.activeModule = null;

        const module = this.modules[type];
        if (!module) return;

        this.activeModule = module;
        if (typeof this.activeModule.start === 'function') {
            this.activeModule.start(this.width, this.height);
        }

        // 允许模块接收点击事件（模块可自行覆盖）
        if (this.canvas) {
            this.canvas.style.pointerEvents = 'auto';
        }
    },

    // 对外接口：保留连珠特效入口（后续由模块实现）
    drawWinLine(lineCells, type) {
        const lines = this.modules.lines;
        if (lines && typeof lines.start === 'function') {
            lines.start(lineCells, type);
        } else if (this.activeModule && typeof this.activeModule.drawWinLine === 'function') {
            this.activeModule.drawWinLine(lineCells, type);
        }
    },

    // 清理画布并重置状态
    clear() {
        if (this.ctx && this.canvas) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowColor = 'transparent';
            this.ctx.globalAlpha = 1.0;
        }

        if (this.activeModule && typeof this.activeModule.reset === 'function') {
            this.activeModule.reset();
        }
        const lines = this.modules.lines;
        if (lines && typeof lines.reset === 'function') {
            lines.reset();
        }
        this.activeModule = null;

        // 让鼠标穿透 Canvas
        if (this.canvas) {
            this.canvas.style.pointerEvents = 'none';
        }
    },

    // 更新 FPS 计数器
    updateAndRenderFPS(now) {
        this.fps.frameCount++;
        const timeDelta = now - this.fps.lastTime;

        if (timeDelta >= 500) {
            this.fps.currentFps = Math.round((this.fps.frameCount * 1000) / timeDelta);
            this.fps.frameCount = 0;
            this.fps.lastTime = now;

            const fpsCounter = document.getElementById('fpsCounter');
            if (fpsCounter) {
                fpsCounter.textContent = `FPS: ${this.fps.currentFps}`;
            }
        }
    },

    // 调整 Canvas 尺寸
    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
};
