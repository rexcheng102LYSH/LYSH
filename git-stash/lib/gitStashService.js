"use strict";

const { spawn } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");

function runGit(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: repoRoot,
      stdio: ["pipe", "pipe", "pipe"],
      shell: false
    });

    let stdout = "";
    let stderr = "";

    if (options.stdinText) {
      child.stdin.write(options.stdinText);
    }
    child.stdin.end();

    child.stdout.on("data", (buf) => {
      stdout += buf.toString("utf8");
    });

    child.stderr.on("data", (buf) => {
      stderr += buf.toString("utf8");
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      const result = {
        ok: code === 0,
        code,
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        command: ["git", ...args].join(" ")
      };

      if (code === 0) {
        resolve(result);
      } else {
        const error = new Error(result.stderr || "Git command failed");
        error.result = result;
        reject(error);
      }
    });
  });
}

function ensureString(value, field) {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`);
  }
  return value;
}

function ensureBoolean(value, field) {
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be a boolean`);
  }
  return value;
}

function ensureArray(value, field) {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }
  return value;
}

function normalizeRef(ref) {
  if (typeof ref !== "string") return "stash@{0}";
  const v = ref.trim();
  return v || "stash@{0}";
}

function parseStashListLine(line) {
  const firstColon = line.indexOf(":");
  if (firstColon < 0) {
    return {
      ref: line.trim(),
      title: "",
      message: "",
      raw: line
    };
  }

  const ref = line.slice(0, firstColon).trim();
  const rest = line.slice(firstColon + 1).trim();
  const secondColon = rest.indexOf(":");

  if (secondColon < 0) {
    return {
      ref,
      title: rest,
      message: "",
      raw: line
    };
  }

  return {
    ref,
    title: rest.slice(0, secondColon).trim(),
    message: rest.slice(secondColon + 1).trim(),
    raw: line
  };
}

function parsePorcelainPaths(statusText) {
  const lines = (statusText || "").split(/\r?\n/).filter(Boolean);
  const out = [];
  for (const line of lines) {
    if (line.length < 4) continue;
    let p = line.slice(3).trim();
    if (p.includes(" -> ")) {
      p = p.split(" -> ").pop().trim();
    }
    if (p) out.push(p);
  }
  return out;
}

function parseNameStatusLine(line) {
  const raw = (line || "").trim();
  if (!raw) return null;
  const parts = raw.split("\t").filter(Boolean);
  if (parts.length < 2) return null;
  const statusToken = parts[0].trim();
  const status = statusToken ? statusToken.charAt(0).toUpperCase() : "M";
  if (status === "R" && parts.length >= 3) {
    return {
      status,
      path: parts[2].trim(),
      oldPath: parts[1].trim()
    };
  }
  return {
    status,
    path: parts[1].trim()
  };
}

function parsePorcelainLine(line) {
  const raw = (line || "");
  if (raw.length < 4) return null;
  const code = raw.slice(0, 2);
  const normalizedStatus = code === "??" ? "U" : (code.trim() || "M");
  let pathPart = raw.slice(3).trim();
  if (!pathPart) return null;
  if (pathPart.includes(" -> ")) {
    const parts = pathPart.split(" -> ");
    const oldPath = (parts[0] || "").trim();
    const newPath = (parts[parts.length - 1] || "").trim();
    if (!newPath) return null;
    return {
      status: normalizedStatus,
      path: newPath,
      oldPath: oldPath || undefined
    };
  }
  return {
    status: normalizedStatus,
    path: pathPart
  };
}

function isInternalMetaPath(filePath) {
  const p = (filePath || "").replace(/\\/g, "/");
  return (
    p === "git-stash/data/stash-tags.json" ||
    p.startsWith("git-stash/data/") ||
    p.startsWith("git-stash/exports/")
  );
}

async function getTreePathSet(ref) {
  const tree = await runGit(["ls-tree", "-r", "--name-only", normalizeRef(ref)]).catch(() => ({ stdout: "" }));
  const set = new Set();
  const lines = (tree.stdout || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  for (const line of lines) {
    set.add(line);
  }
  return set;
}

async function getCurrentVsLatestStashChanges() {
  let baselineCommit = "";
  try {
    const verify = await runGit(["rev-parse", "--verify", "stash@{0}"]);
    baselineCommit = (verify.stdout || "").trim();
  } catch (_err) {
    return {
      available: false,
      baselineRef: null,
      baselineCommit: "",
      hasChanges: false,
      changedFiles: [],
      changedFilesCount: 0,
      message: "NO_BASELINE_STASH"
    };
  }

  const [diffRes, untrackedRes, baselineTreeSet] = await Promise.all([
    runGit(["diff", "--name-status", "--find-renames", "stash@{0}", "--"]).catch(() => ({ stdout: "" })),
    runGit(["ls-files", "--others", "--exclude-standard"]).catch(() => ({ stdout: "" })),
    getTreePathSet("stash@{0}")
  ]);

  const map = new Map();
  const lines = (diffRes.stdout || "").split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const parsed = parseNameStatusLine(line);
    if (!parsed || !parsed.path) continue;
    if (isInternalMetaPath(parsed.path)) continue;
    map.set(parsed.path, parsed);
  }

  const untracked = (untrackedRes.stdout || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  for (const file of untracked) {
    if (isInternalMetaPath(file)) continue;
    if (!baselineTreeSet.has(file) && !map.has(file)) {
      map.set(file, { status: "A", path: file });
    }
  }

  const changedFiles = Array.from(map.values())
    .filter((it) => it && it.path)
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    available: true,
    baselineRef: "stash@{0}",
    baselineCommit,
    hasChanges: changedFiles.length > 0,
    changedFiles,
    changedFilesCount: changedFiles.length,
    message: changedFiles.length > 0 ? "HAS_CHANGES" : "NO_CHANGES"
  };
}

async function getWorkingTreeChanges() {
  const statusRes = await runGit(["status", "--porcelain", "--untracked-files=normal"]).catch(() => ({ stdout: "" }));
  const lines = (statusRes.stdout || "").split(/\r?\n/).filter(Boolean);
  const changedFiles = lines
    .map(parsePorcelainLine)
    .filter((it) => it && it.path)
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    available: true,
    mode: "working",
    baselineRef: "HEAD",
    baselineCommit: "",
    hasChanges: changedFiles.length > 0,
    changedFiles,
    changedFilesCount: changedFiles.length,
    message: changedFiles.length > 0 ? "HAS_WORKING_CHANGES" : "NO_WORKING_CHANGES"
  };
}

async function getCurrentChanges(mode) {
  const m = typeof mode === "string" ? mode.trim().toLowerCase() : "";
  if (m === "stash") {
    const data = await getCurrentVsLatestStashChanges();
    return { ...data, mode: "stash" };
  }
  return getWorkingTreeChanges();
}

async function getGitVersion() {
  const result = await runGit(["--version"]);
  return result.stdout;
}

async function getCapabilities() {
  const help = await runGit(["stash", "-h"]).catch(() => ({ stdout: "", stderr: "" }));
  const text = `${help.stdout}\n${help.stderr}`;
  return {
    supportsExport: /stash\s+export/.test(text),
    supportsImport: /stash\s+import/.test(text)
  };
}

async function resolveStashCommit(ref) {
  const target = normalizeRef(ref);
  const result = await runGit(["rev-parse", target]);
  return result.stdout.trim();
}

async function getRepoInfo() {
  const [isRepo, branch, status, gitVersion, capabilities] = await Promise.all([
    runGit(["rev-parse", "--is-inside-work-tree"]),
    runGit(["branch", "--show-current"]).catch(() => ({ stdout: "" })),
    runGit(["status", "--short"]).catch(() => ({ stdout: "" })),
    getGitVersion(),
    getCapabilities()
  ]);

  return {
    isRepo: isRepo.stdout === "true",
    branch: branch.stdout || "(detached)",
    hasChanges: Boolean(status.stdout && status.stdout.trim()),
    repoRoot,
    gitVersion,
    capabilities
  };
}

async function listStashes() {
  const result = await runGit(["stash", "list"]);
  const lines = result.stdout ? result.stdout.split(/\r?\n/) : [];
  const basic = lines.filter(Boolean).map(parseStashListLine);

  const withCommit = await Promise.all(
    basic.map(async (item) => {
      try {
        const commit = await resolveStashCommit(item.ref);
        return { ...item, commit };
      } catch (_err) {
        return { ...item, commit: "" };
      }
    })
  );

  return withCommit;
}

async function getStatusPaths() {
  const result = await runGit(["status", "--porcelain"]);
  return parsePorcelainPaths(result.stdout);
}

async function getEffectiveChangePaths() {
  const all = await getStatusPaths();
  return all.filter((p) => !isInternalMetaPath(p));
}

async function showStash(ref, includePatch) {
  const args = ["stash", "show"];
  if (includePatch) args.push("-p");
  args.push(normalizeRef(ref));
  return runGit(args);
}

async function getStashTree(ref) {
  const result = await runGit(["rev-parse", `${normalizeRef(ref)}^{tree}`]);
  return result.stdout.trim();
}

async function isTopStashDuplicateOfPrevious() {
  try {
    const [topTree, prevTree] = await Promise.all([
      getStashTree("stash@{0}"),
      getStashTree("stash@{1}")
    ]);
    return Boolean(topTree && prevTree && topTree === prevTree);
  } catch (_err) {
    return false;
  }
}

async function pushStash(payload) {
  const force = Boolean(payload.force);
  const keepWorkingTree = payload.keepWorkingTree !== undefined
    ? ensureBoolean(payload.keepWorkingTree, "keepWorkingTree")
    : false;

  if (!force) {
    // Prevent meaningless quick-saves when only internal metadata changed.
    const effective = await getEffectiveChangePaths();
    if (effective.length === 0) {
      const err = new Error("No effective source-code changes to stash.");
      err.result = {
        ok: false,
        code: 1,
        stdout: "",
        stderr: "",
        command: "git stash push",
        reason: "NO_EFFECTIVE_CHANGES"
      };
      throw err;
    }

    // Prevent duplicate quick-saves when current code matches latest stash baseline.
    const compare = await getCurrentVsLatestStashChanges();
    if (compare.available && !compare.hasChanges) {
      const err = new Error("Current code is identical to latest stash snapshot.");
      err.result = {
        ok: false,
        code: 1,
        stdout: "",
        stderr: "",
        command: "git stash push",
        reason: "DUPLICATE_WITH_LATEST_STASH"
      };
      throw err;
    }
  }

  const args = ["stash", "push"];

  if (payload.includeUntracked !== undefined && ensureBoolean(payload.includeUntracked, "includeUntracked")) {
    args.push("-u");
  }
  if (payload.includeIgnored !== undefined && ensureBoolean(payload.includeIgnored, "includeIgnored")) {
    args.push("-a");
  }
  if (payload.keepIndex !== undefined && ensureBoolean(payload.keepIndex, "keepIndex")) {
    args.push("-k");
  }
  if (payload.patch !== undefined && ensureBoolean(payload.patch, "patch")) {
    args.push("-p");
  }
  if (payload.staged !== undefined && ensureBoolean(payload.staged, "staged")) {
    args.push("--staged");
  }
  if (payload.message) {
    args.push("-m", ensureString(payload.message, "message"));
  }
  if (payload.pathspecs) {
    const specs = ensureArray(payload.pathspecs, "pathspecs");
    if (specs.length > 0) {
      args.push("--", ...specs.map((it) => ensureString(it, "pathspec item")));
    }
  }

  const pushResult = await runGit(args);
  const duplicated = await isTopStashDuplicateOfPrevious();

  if (duplicated) {
    await runGit(["stash", "drop", "stash@{0}"]);

    if (keepWorkingTree) {
      const applyPrev = await runGit(["stash", "apply", "--index", "stash@{0}"]);
      return {
        ...pushResult,
        command: `${pushResult.command} && git stash drop stash@{0} && ${applyPrev.command}` ,
        stdout: [pushResult.stdout, applyPrev.stdout].filter(Boolean).join("\n\n"),
        stderr: [pushResult.stderr, applyPrev.stderr].filter(Boolean).join("\n"),
        restoredWorkingTree: true,
        duplicateSkipped: true,
        workingTreePreserved: true,
        workingTreeRolledBack: false
      };
    }

    return {
      ...pushResult,
      command: `${pushResult.command} && git stash drop stash@{0}` ,
      duplicateSkipped: true,
      workingTreePreserved: false,
      workingTreeRolledBack: true
    };
  }

  if (!keepWorkingTree) {
    return {
      ...pushResult,
      workingTreePreserved: false,
      workingTreeRolledBack: true
    };
  }

  const applyResult = await runGit(["stash", "apply", "--index", "stash@{0}"]);
  return {
    ...pushResult,
    command: `${pushResult.command} && ${applyResult.command}` ,
    stdout: [pushResult.stdout, applyResult.stdout].filter(Boolean).join("\n\n"),
    stderr: [pushResult.stderr, applyResult.stderr].filter(Boolean).join("\n"),
    restoredWorkingTree: true,
    workingTreePreserved: true,
    workingTreeRolledBack: false
  };
}

function withStashRef(baseArgs, ref) {
  return [...baseArgs, normalizeRef(ref)];
}

async function applyStash(ref, reinstateIndex) {
  const args = ["stash", "apply"];
  if (reinstateIndex) args.push("--index");
  args.push(normalizeRef(ref));
  return runGit(args);
}

async function popStash(ref, reinstateIndex) {
  const args = ["stash", "pop"];
  if (reinstateIndex) args.push("--index");
  args.push(normalizeRef(ref));
  return runGit(args);
}

async function dropStash(ref) {
  return runGit(withStashRef(["stash", "drop"], ref));
}

async function clearStash() {
  return runGit(["stash", "clear"]);
}

async function branchFromStash(branchName, ref) {
  const name = ensureString(branchName, "branchName").trim();
  if (!name) throw new Error("branchName cannot be empty");
  return runGit(["stash", "branch", name, normalizeRef(ref)]);
}

async function createStash(message) {
  const args = ["stash", "create"];
  if (message && message.trim()) args.push(message.trim());
  return runGit(args);
}

async function storeStash(commit, message) {
  const args = ["stash", "store"];
  if (message && message.trim()) args.push("-m", message.trim());
  args.push(ensureString(commit, "commit"));
  return runGit(args);
}

async function exportStash(ref, toRef) {
  const args = ["stash", "export"];
  const stashRef = normalizeRef(ref);
  if (stashRef) args.push(stashRef);
  if (toRef && toRef.trim()) {
    args.push("--to-ref", toRef.trim());
  } else {
    args.push("--print");
  }
  return runGit(args);
}

async function importStash(commit) {
  return runGit(["stash", "import", ensureString(commit, "commit")]);
}

async function runRawStash(rawArgs) {
  const args = ensureArray(rawArgs, "args");
  const normalized = args.map((it) => ensureString(it, "arg").trim()).filter(Boolean);
  if (normalized.length === 0) {
    throw new Error("args cannot be empty");
  }
  return runGit(["stash", ...normalized]);
}

module.exports = {
  repoRoot,
  runGit,
  getRepoInfo,
  listStashes,
  getStatusPaths,
  getEffectiveChangePaths,
  getWorkingTreeChanges,
  getCurrentVsLatestStashChanges,
  getCurrentChanges,
  showStash,
  pushStash,
  applyStash,
  popStash,
  dropStash,
  clearStash,
  branchFromStash,
  createStash,
  storeStash,
  exportStash,
  importStash,
  runRawStash
};
