const fs = require("fs");
const path = require("path");

const root = process.cwd();
const timelinePath = path.join(root, ".vscode", "codex-timeline.log");
const heartbeatPath = path.join(root, ".vscode", "codex-heartbeat.txt");
const snapshotsRoot = path.join(root, ".vscode", "codex-snapshots");

const IGNORE_PREFIX = [
  ".git/",
  "node_modules/",
  ".history/",
  "backup/",
  "save/",
  ".kiro/",
  ".kilocode/",
  "server/node_modules/",
];

const IGNORE_EXACT = new Set([
  ".vscode/codex-timeline.log",
  ".vscode/codex-heartbeat.txt",
]);

const IGNORE_EXT = new Set([
  ".mp3",
  ".m4a",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".keystore",
]);

let changed = new Set();
let timer = null;
const lastStampedMtime = new Map();

function nowISO() {
  return new Date().toISOString();
}

function ensureDir() {
  fs.mkdirSync(path.dirname(timelinePath), { recursive: true });
}

function relPath(p) {
  return p.split(path.sep).join("/");
}

function shouldIgnore(rel) {
  if (!rel) return true;
  if (IGNORE_EXACT.has(rel)) return true;
  for (const prefix of IGNORE_PREFIX) {
    if (rel.startsWith(prefix)) return true;
  }
  const ext = path.extname(rel).toLowerCase();
  return IGNORE_EXT.has(ext);
}

function appendLog(line) {
  ensureDir();
  if (fs.existsSync(timelinePath)) {
    const tail = fs.readFileSync(timelinePath, "utf8");
    if (tail.length > 0 && !tail.endsWith("\n")) {
      fs.appendFileSync(timelinePath, "\n", "utf8");
    }
  }
  fs.appendFileSync(timelinePath, line + "\n", "utf8");
}

function writeHeartbeat(message) {
  ensureDir();
  fs.writeFileSync(
    heartbeatPath,
    `last_update=${nowISO()}\nmessage=${message}\n`,
    "utf8"
  );
}

function snapshotIdNow() {
  return nowISO().replace(/[:.]/g, "-");
}

function writeSnapshot(snapshotId, files) {
  const base = path.join(snapshotsRoot, snapshotId);
  fs.mkdirSync(base, { recursive: true });
  const manifest = {
    snapshotId,
    createdAt: nowISO(),
    files,
  };
  for (const rel of files) {
    try {
      const src = path.join(root, rel);
      const dst = path.join(base, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    } catch (_) {
      // Ignore copy failure for deleted/transient files.
    }
  }
  fs.writeFileSync(path.join(base, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
}

function readMtimeMs(rel) {
  try {
    const abs = path.join(root, rel);
    const st = fs.statSync(abs);
    if (!st.isFile()) return null;
    return st.mtimeMs;
  } catch (_) {
    return null;
  }
}

function flush(reason) {
  if (changed.size === 0) return;
  const files = Array.from(changed).sort();
  changed.clear();
  const stampedFiles = [];

  for (const rel of files) {
    const mtimeMs = readMtimeMs(rel);
    if (mtimeMs == null) continue;
    const prev = lastStampedMtime.get(rel);
    // 变更原因：同一次保存可能触发多次watch事件，用mtime去重，保证单次改动只记录一次
    if (prev === mtimeMs) continue;
    lastStampedMtime.set(rel, mtimeMs);
    stampedFiles.push(rel);
  }

  if (stampedFiles.length === 0) return;

  const snapshotId = snapshotIdNow();
  writeSnapshot(snapshotId, stampedFiles);
  const preview = stampedFiles.slice(0, 6).join(", ");
  const suffix = stampedFiles.length > 6 ? ` ... +${stampedFiles.length - 6}` : "";
  const msg = `[${nowISO()}] auto-stamp(${reason}): ${stampedFiles.length} file(s) changed -> ${preview}${suffix} | snapshot=${snapshotId}`;
  appendLog(msg);
  writeHeartbeat(`auto-stamp ${stampedFiles.length} file(s)`);
}

function scheduleFlush(reason) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => flush(reason), 1200);
}

function onChange(fileName) {
  if (!fileName) return;
  const rel = relPath(String(fileName));
  if (shouldIgnore(rel)) return;
  changed.add(rel);
  scheduleFlush("debounce");
}

function startWatcher() {
  const initLine = `[${nowISO()}] auto-stamp watcher started`;
  appendLog(initLine);
  writeHeartbeat("auto-stamp watcher started");

  if (process.argv.includes("--init-only")) {
    console.log(initLine);
    return;
  }

  fs.watch(root, { recursive: true }, (_, fileName) => onChange(fileName));
  console.log("[codex_autostamp] watching workspace:", root);
}

startWatcher();
