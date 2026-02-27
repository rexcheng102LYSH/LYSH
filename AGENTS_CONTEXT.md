# Project Lysh - File Map and Logic Overview (Alpha 0.7.9.9)

Last updated: 2026-02-26  
Owner: Project Lead (Lysh)

Purpose
- This file is the architecture snapshot for current code.
- Read this before editing to understand module ownership and data flow.

Current release posture
- Frontend version marker in `index.html` is `Alpha0.7.9.9`.
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
- `js/resource_pack.js`: optional user-triggered resource predownload entry (registers SW + triggers prefetch).
- `sw.js`: Service Worker for cache-first static asset fetch and resource-pack prefetch handling.
  - **Cache version**: `lysh-user-pack-v1` (update this when resources change significantly)
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
|   |-- resource_pack.js
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
2) Loads core modules in order: assets/audio/lang/background/fx/gamestate/skills/game/ai + `js/resource_pack.js`.
3) `js/resource_pack.js` registers `sw.js` (HTTP/HTTPS only), exposing user-triggered predownload entry from main menu.
4) Loads Socket.IO CDN and online modules (`js/network/*`).
5) Inline config sets `window.GAME_SERVER_URL`:
   - non-localhost defaults to `https://lysh-server.zeabur.app`
   - localhost/127.0.0.1/192.168.* forces `http://localhost:3000`
6) Runtime enters menu flow; online mode uses `SocketClient` + `OnlineGame` + `OnlineUI`.

Script load order dependencies (critical)
- `js/diagnostics.js` MUST load before `gamestate.js` to ensure `window.LYSH_DIAGNOSTICS` is available for state guard warnings.
- `gamestate.js` MUST load before any game modules that depend on `GameState` or legacy globals.
- Do not reorder script tags in `index.html` without verifying dependency chain.

Runtime safety and diagnostics (game-relevant additions)
- `index.html` includes global runtime guards: `window.error` / `window.unhandledrejection` and a fatal fallback UI (`fatalErrorOverlay`).
- Startup safety wrappers already exist around new UI animation calls (Anime.js) to avoid hard-crash in degraded environments.
- `js/diagnostics.js` provides a lightweight in-browser diagnostics buffer (`window.LYSH_DIAGNOSTICS`) with trace-id generation and network/state warning capture.
- `js/network/socket_client.js` now attaches `__traceId`/`__clientTs` on object payloads and records incoming/outgoing network diagnostics.
- `server/index.js` adds API trace IDs (`x-trace-id` header and `traceId` in `/api/status` & `/api/rooms`) plus structured server diagnostics for API timing and process-level crashes.
- `gamestate.js` keeps behavior unchanged but adds warning-only guard checks for critical state writes (`currentPlayer`, `board`, `timeRemaining`, `moveCount`, `lastMove`).

Type-check and test baseline (current)
- Type-check entry is `tsconfig.typecheck.json` with `allowJs + checkJs + noEmit`.
- Current low-risk checked files include:
  - `server/config.js`, `server/index.js`, `server/roomManager.js`, `server/gameLogic.js`, `server/rpsLogic.js`, `server/skillLogic.js`, `server/protocol_contract.js`, `server/socketHandlers.js`
  - `js/network/config.js`, `js/network/socket_client.js`
  - global declarations from `types/globals.d.ts`
- Server tests are running with Vitest (`npm --prefix server test`) and currently cover:
  - `gameLogic`, `rpsLogic`, `skillLogic`, `protocol_contract`, `roomManager`
- `server/socketHandlers.js` now contains payload-level JSDoc typedefs for key `client:*` inbound events and core `room:*` outbound payloads to stabilize checkJs feedback without changing runtime behavior.

Online multiplayer flow (current)
- Room IDs are 4-digit numeric IDs (not 6-digit).
- Supports two entry paths:
  - room-code flow (`client:create_room`, `client:join_room`)
  - lobby flow (`client:lobby_list`, `client:lobby_create`, `client:lobby_join`)
- Match sequence:
  1. room waiting
  2. RPS (`client:rps_choice`)
  3. winner side choice (`client:side_choice`)
  4. draft phase (`client:draft_pick`, `room:draft_start`, `room:draft_update`, `room:draft_complete`)
     - picker timeout is 10s per turn; on timeout server auto-picks the first available skill in configured order
  5. game start (`room:game_start` carries `playerSkills`, `timeRemaining`, `match`)
  6. gameplay events (`client:place_piece`, `client:use_skill`, undo/surrender/rematch)
  7. timer sync and timeout (`room:timer_sync`, `room:time_out`)
- Reconnect/disconnect handling supports both host and guest during active match flow:
  - disconnect enters reconnect window (`room:opponent_disconnected`) instead of immediately destroying room
  - reconnect window timeout is 10 seconds
  - frontend auto-sends `client:reconnect` with `{ roomId, oldSocketId }` after socket re-establish
  - server validates `oldSocketId` and returns extended reconnect snapshot with `myColor`, `opponent`, `match`

Online gameplay config details (important compatibility notes)
- Lobby create path supports: rule preset, enabled-skill subset, and optional 4-digit room password (`client:lobby_create` payload).
- Room ID compatibility is split by design: backend canonical length is 4 (`/api/status -> roomIdLength: 4`), while join UI still accepts 4-6 digits for legacy compatibility.
- `/api/status` now carries runtime metadata (`version`, `lobbySupported`, `roomIdLength`) for frontend capability checks.

Backend architecture (server)
- `server/index.js`
  - serves static frontend from project root (`express.static(..)`).
  - adds SPA-style fallback for non-API/non-asset routes (for local paths like `/测试`) to `index.html`.
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
- `Dockerfile.lysh-server` is kept as a service-name Dockerfile alias for Zeabur dockerfile-name resolution.
- `zbpack.json` keeps `ignore_dockerfile=false` and provides Node build/start fallback commands.
- `zbpack.lysh-server.json` is the service-scoped override (`lysh-server`) to force Dockerfile preference and direct Node startup fallback.
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
- Top-right controls include a resource-download SVG button (next to appearance/skin) with arrow-fill and circular progress UI driven by `js/resource_pack.js`.
- Under `file://` direct-open mode, resource download action is blocked by click-time prompt; project test entry should be `http://localhost:3000` or deployed HTTPS URL.

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
