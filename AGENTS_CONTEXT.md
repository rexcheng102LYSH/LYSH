# Project Lysh - File Map and Logic Overview (Alpha 0.7.8.9)

Purpose
- This file gives a fast, accurate map of how the project is structured and how the core logic flows.
- Read this before editing so you understand where each responsibility lives.

Top-level files
- index.html: main entry and script load order.
- style.css: all UI styling.
- lang.js: i18n strings (zh-Hans, zh-Hant, en).
- assets.js: SVG/icon asset registry.
- background.js: background canvas effects.
- gamestate.js: GameState source-of-truth + legacy global sync.
- ai.js: AI turn logic (calls helper functions from js/game/game_ai.js).

Folder map (short)
.
|-- js/
|   |-- audio/
|   |   |-- audio_host.js   # AudioHost (Host + Plugins)
|   |   |-- audio_hub.js    # SoundEngine core state + BGM control
|   |   |-- audio_sfx.js    # Synth SFX + DJ audio logic (install target)
|   |   |-- audio_assets.js # MP3 assets (install target)
|   |
|   |-- fx/
|   |   |-- fx_host.js            # VisualFX dispatcher (canvas + module routing)
|   |   |-- lines.js              # win-line effects
|   |   |-- winning/
|   |       |-- fireworks.js      # fireworks plugin
|   |       |-- golden.js         # golden coin plugin
|   |       |-- dj.js             # DJ rhythm plugin
|   |
|   |-- game/
|   |   |-- game_host.js    # GameHost (module registry)
|   |   |-- game_core.js    # core flow: turns, win/lose, timers, input
|   |   |-- game_ui.js      # UI updates, settings, skins, toasts
|   |   |-- game_render.js  # board + piece rendering
|   |   |-- game_skills.js  # skill draft + activation
|   |   |-- game_ai.js      # AI evaluation helpers
|   |
|   |-- skills/
|       |-- registry.js     # SkillRegistry (skills + effects)
|       |-- *.js            # each skill in its own file
|
|-- images/                 # PNG assets (sun/maple/gold)
|-- backup/                 # archived full snapshots
|-- .history/               # editor snapshots
|-- .kiro/logs/             # project logs

Key globals and contracts
- GameState (gamestate.js): single source of truth; legacy globals mirror it.
- SoundEngine (audio_hub.js): audio runtime; AudioHost installs SFX/Assets onto it.
- VisualFX (fx_host.js): canvas dispatcher; plugins register with VisualFX.register(name).
- SkillRegistry (js/skills/registry.js): maps skill id -> activate/effect functions.

Startup flow (simplified)
1) index.html loads assets, audio host + plugins, lang, background, fx host + plugins,
   gamestate, skills, game modules, ai.
2) DOMContentLoaded (game_core.js) starts BackgroundEngine, FrameRateController, VisualFX.
3) User clicks -> SoundEngine.init() unlocks AudioContext.

Game loop and responsibilities
- FrameRateController (game_core.js) drives BackgroundEngine.loop + VisualFX.renderFrame.
- handleCellClick (game_core.js) handles placement, skills, chaos, win check.
- updateDynamicUI (game_ui.js) keeps timers/status/skill button states updated.
- ai.js uses game_ai.js helpers (getScoreMove, evalPt, etc).

FX system
- VisualFX: manages full-screen fx canvas + active module dispatch.
- lines.js: draws the winning line (simple/neon/lightning).
- winning plugins: fireworks/golden/dj, each implements start/render/reset (+ optional handleClick).

Audio system
- AudioHost: installs plugins onto SoundEngine.
- audio_hub.js: global state + BGM switching; DJ state container.
- audio_sfx.js: synth SFX + DJ scheduling + hit/miss logic.
- audio_assets.js: MP3 playback (bgm1..7, ambient, one-shots).

Skills system
- SkillRegistry: central registry.
- Each skill file registers: activate() and effect handlers (if any).
- game_skills.js handles draft UI + activation flow.

Notes for future edits
- Keep GameState as the source; sync legacy globals when modifying state.
- Avoid changing win/turn core flow unless required; add new features via new functions.
- Do not delete backup snapshots without user confirmation.
