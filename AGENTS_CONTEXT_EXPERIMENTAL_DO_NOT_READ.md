# [试验版本] Project Lysh - File Map and Logic Overview (DO NOT READ)

警告：
- 本文件为试验版本，仅供人工对比与回顾。
- Agent 不应将本文件作为架构事实来源，不应在执行前读取本文件。
- Agent 只应读取 `AGENTS.md` 与 `AGENTS_CONTEXT.md`。

# Project Lysh - File Map and Logic Overview (Alpha 0.7.9.8)

Last updated: 2026-02-24  
Owner: Project Lead (Lysh)

Purpose
- This file is the architecture snapshot for current code.
- Read this before editing to understand module ownership and data flow.

Current release posture
- Frontend version marker in `index.html` is `Alpha0.7.9.8`.
- Online mode defaults to Zeabur production URL and falls back to localhost in dev.
- Deployment currently favors single-service hosting (frontend static + backend Socket.IO in one Node service).

Version semantics (must distinguish)
- Frontend display version (`index.html`): player-facing release marker.
- Backend protocol/runtime version (`GET /api/status -> version`): online capability/protocol marker.
- Do not mix these two when stating "current version".

Top-level files (current)
- `index.html`: main entry, UI structure, script load order, online modal set.
- `style.css`: main UI styles.
- `pieces.css`: piece/board visual styles.
- `tailwind.generated.css`: local built Tailwind output for new UI additions.
- `tailwind.config.js` / `tailwind.input.css`: Tailwind build inputs.
- `lang.js`: i18n strings and language switching.
- `assets.js`: SVG/icon asset registry.
- `background.js`: background canvas effects.
- `gamestate.js`: `GameState` source-of-truth + legacy global sync.
- `ai.js`: AI turn orchestration (with helpers in `js/game/game_ai.js`).
- `zeabur.yaml`: Zeabur service config (health check path `/api/status`).
- `Dockerfile` (root): full-stack container for Zeabur single-service deploy.

Folder map (short)
.
|-- js/
|   |-- audio/
|   |   |-- audio_host.js
|   |   |-- audio_sfx.js
|   |   |-- audio_assets.js
|   |   |-- audio_hub.js
|   |
|   |-- fx/
|   |   |-- fx_host.js
|   |   |-- lines.js
|   |   |-- winning/
|   |       |-- fireworks.js
|   |       |-- golden.js
|   |       |-- dj.js
|   |
|   |-- game/
|   |   |-- game_host.js
|   |   |-- game_core.js
|   |   |-- game_ui.js
|   |   |-- game_render.js
|   |   |-- game_skills.js
|   |   |-- game_ai.js
|   |
|   |-- network/
|   |   |-- config.js
|   |   |-- socket_client.js
|   |   |-- online_game.js
|   |   |-- online_ui.js
|   |
|   |-- skills/
|       |-- registry.js
|       |-- *.js (one file per skill)
|
|-- css/
|   |-- skills/
|       |-- voodoo.css
|
|-- server/
|   |-- index.js
|   |-- socketHandlers.js
|   |-- roomManager.js
|   |-- gameLogic.js
|   |-- rpsLogic.js
|   |-- skillLogic.js
|   |-- config.js
|   |-- Dockerfile
|   |-- package.json
|   |-- start.bat / stop.bat / restart.bat
|
|-- docs/
|   |-- ZEABUR_DEPLOY_GUIDE.md
|   |-- generate_*_pdf.py
|
|-- scripts/
|   |-- monitor.* (screenshot monitor toolchain)
|   |-- codex_stamp.js
|   |-- codex_autostamp.js
|
|-- git-stash/
|   |-- server.js
|   |-- lib/*.js
|   |-- public/*
|   |-- README.md
|
|-- images/
|-- plans/
|-- .kilocode/
|-- .kiro/

Core contracts and global single sources
- `GameState` (`gamestate.js`) is the gameplay state source-of-truth.
- Legacy globals must remain synchronized when touching state transitions.
- `VisualFX` (`js/fx/fx_host.js`) dispatches visual modules and frame rendering.
- `SoundEngine`/audio modules coordinate BGM/SFX and DJ rhythm state.
- `SkillRegistry` (`js/skills/registry.js`) maps skill id to runtime behavior.

Frontend startup flow (actual)
1) `index.html` loads base CSS + Tailwind output + Anime.js (with safe fallback wrappers).
2) Loads core modules in order: assets/audio/lang/background/fx/gamestate/skills/game/ai.
3) Loads Socket.IO CDN and online modules (`js/network/*`).
4) Inline config sets `window.GAME_SERVER_URL`:
   - non-localhost defaults to `https://lysh-server.zeabur.app`
   - localhost/127.0.0.1/192.168.* forces `http://localhost:3000`
5) Runtime enters menu flow; online mode uses `SocketClient` + `OnlineGame` + `OnlineUI`.

Runtime safety and diagnostics (game-relevant additions)
- `index.html` includes global runtime guards: `window.error` / `window.unhandledrejection` and a fatal fallback UI (`fatalErrorOverlay`).
- Startup safety wrappers already exist around new UI animation calls (Anime.js) to avoid hard-crash in degraded environments.

Online multiplayer flow (current)
- Room IDs are 4-digit numeric IDs (not 6-digit).
- Supports two entry paths:
  - room-code flow (`client:create_room`, `client:join_room`)
  - lobby flow (`client:lobby_list`, `client:lobby_create`, `client:lobby_join`)
- Match sequence:
  1. room waiting
  2. RPS (`client:rps_choice`)
  3. winner side choice (`client:side_choice`)
  4. game start
  5. gameplay events (`client:place_piece`, `client:use_skill`, undo/surrender/rematch)
- Reconnect/disconnect handling is server-side with timeout and `game_over` fallback.

Online gameplay config details (important compatibility notes)
- Lobby create path supports: rule preset, enabled-skill subset, and optional 4-digit room password (`client:lobby_create` payload).
- Room ID compatibility is split by design: backend canonical length is 4 (`/api/status -> roomIdLength: 4`), while join UI still accepts 4-6 digits for legacy compatibility.
- `/api/status` now carries runtime metadata (`version`, `lobbySupported`, `roomIdLength`) for frontend capability checks.

Backend architecture (server)
- `server/index.js`
  - serves static frontend from project root (`express.static(..)`).
  - hosts Socket.IO server on same process/port.
  - health endpoint: `GET /api/status`.
  - debug endpoint: `GET /api/rooms`.
- `server/socketHandlers.js`
  - full socket event orchestration for room/rps/game/skills/undo/reconnect/lobby/rematch.
- `server/roomManager.js`
  - room lifecycle, player assignment, lobby room settings, cleanup.
- `server/gameLogic.js`
  - move validation, place piece, win check, undo.
- `server/rpsLogic.js`
  - RPS validation, winner determination, side assignment.
- `server/skillLogic.js`
  - skill validation, execution, turn-end effect processing.

Deployment architecture (Zeabur)
- Root `Dockerfile` builds runtime image, installs `server` deps, copies full repo.
- Runtime starts from `/app/server` with `node index.js`.
- `zeabur.yaml` points to root deploy and health checks `/api/status`.
- `play.bat` opens production URL directly: `https://lysh-server.zeabur.app`.

Secondary subsystem: git-stash tool
- `git-stash/` is a separate Node + Express app (`default port 3760`).
- Purpose: visual workflow for `git stash` plus metadata/tags/safety helpers.
- It is independent from gameplay runtime and deployment path of main game.

Known operational notes
- Server currently allows wildcard CORS in `server/index.js` (`origin: '*'`).
- `server/config.js` still contains environment-origin helper logic for future stricter policy.
- Keep this distinction in mind when auditing security/deploy behavior.

UI behavior deltas worth remembering
- `js/game/game_ui.js` contains long-press secondary tuning flows for multiple skins (classic / nature / ice_fire); this is part of gameplay feel, not only cosmetics.
- Status panel supports scroll mode switching (`auto` / `manual`) with state mirrored in `GameState.statusScrollMode`.
- LYSH developer area and DJ indicator toggle (keyboard `L` shortcut) are active control surfaces used during testing.

Notes for future edits
- Keep `GameState` as source-of-truth; sync legacy globals when modifying state.
- Avoid touching core win/turn judgment unless necessary.
- Prefer additive changes in modules, not cross-cutting rewrites.
- Keep online protocol event names backward-compatible where possible.
- Keep docs aligned when updating:
  - room id rules
  - deploy topology
  - network endpoints
  - module load order in `index.html`
- PowerShell policy: allowed for read/search/test commands, not for direct code-file writes.
- Pre-read policy alignment: for each new request read `AGENTS.md` + `AGENTS_CONTEXT.md`; re-read only when either file changes in-session.

Doc maintenance triggers (update this file when changed)
- Module boundaries or folder ownership.
- Network event names/payload contracts.
- Deploy topology, health endpoint, runtime URL logic.
- Frontend startup load order and global fallback mechanisms.
- Compatibility rules (e.g., room id length, lobby capability fields).
