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

Frontend frameworks (Alpha 0.7.9.6)
- Tailwind CSS: CDN-based utility CSS for rapid UI development (zero-risk, only for new UI).
- Anime.js: CDN-based animation library for smooth transitions (zero-risk, only for new animations).
- Safety: Both frameworks are loaded via CDN with automatic fallback detection; use `safeAnime()` wrapper for error handling.

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
|   |-- network/
|   |   |-- socket_client.js # Socket.IO client + connection logic
|   |   |-- online_game.js   # online game flow + state sync
|   |   |-- online_ui.js     # online UI components (modals, etc)
|   |
|   |-- skills/
|       |-- registry.js     # SkillRegistry (skills + effects)
|       |-- *.js            # each skill in its own file
|
|-- server/
|   |-- index.js            # Express + Socket.IO server entry
|   |-- socketHandlers.js   # all Socket event handlers
|   |-- roomManager.js      # room creation/join/cleanup + state
|   |-- gameLogic.js        # move validation, win check, undo
|   |-- rpsLogic.js         # rock-paper-scissors + side choice
|   |-- skillLogic.js       # skill validation + execution
|   |-- config.js           # server config (port, timeouts, etc)
|   |-- package.json        # Node.js dependencies
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

Backend system (Node.js + Socket.IO)
- index.js: Express server + Socket.IO initialization.
- socketHandlers.js: all Socket events (room, rps, game, skills, reconnect).
- roomManager.js: room lifecycle (create/join/leave/cleanup), state container.
- gameLogic.js: move validation, win detection, undo execution.
- rpsLogic.js: rock-paper-scissors logic, side choice, winner determination.
- skillLogic.js: skill validation, execution, turn-end effects.
- config.js: server config (port 3000, timeouts, CORS origins).

Backend data flow
- Client connects → Socket.IO handshake.
- client:create_room → roomManager creates room, returns 6-digit ID.
- client:join_room → roomManager adds guest, enters rps phase.
- client:rps_choice → rpsLogic records choice, broadcasts opponent_chose.
- Both chosen → rpsLogic determines winner, enters choosing_side phase.
- client:side_choice → rpsLogic assigns black/white, gameLogic initializes board.
- client:place_piece → gameLogic validates, updates board, broadcasts piece_placed.
- checkWin → if five-in-row, broadcast game_over.
- client:use_skill → skillLogic validates, executes, broadcasts skill_used.
- Disconnect → roomManager marks disconnected, sets timeout for reconnect.
- client:reconnect → roomManager restores socket ID, broadcasts opponent_reconnected.

Notes for future edits
- Keep GameState as the source; sync legacy globals when modifying state.
- Avoid changing win/turn core flow unless required; add new features via new functions.
- Do not delete backup snapshots without user confirmation.
- Backend: room state is source of truth; clients sync via Socket events.
- Backend: all game logic (validation, win check) runs server-side for security.
