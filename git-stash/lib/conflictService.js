"use strict";

const fs = require("fs/promises");
const path = require("path");
const gitService = require("./gitStashService");

const exportDir = path.resolve(__dirname, "..", "exports");

function pad(n) {
  return String(n).padStart(2, "0");
}

function stamp() {
  const t = new Date();
  return `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}-${pad(t.getHours())}${pad(t.getMinutes())}${pad(t.getSeconds())}`;
}

async function listUnmergedFiles() {
  const result = await gitService.runGit(["diff", "--name-only", "--diff-filter=U"]).catch(() => ({ stdout: "" }));
  return result.stdout
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

async function scanConflictMarkers(relPath) {
  const full = path.resolve(gitService.repoRoot, relPath);
  try {
    const text = await fs.readFile(full, "utf8");
    const matches = text.match(/^(<<<<<<<|=======|>>>>>>>)\s?.*$/gm) || [];
    return {
      file: relPath,
      markerCount: matches.length
    };
  } catch (_err) {
    return {
      file: relPath,
      markerCount: 0
    };
  }
}

async function getConflictState() {
  const [repo, unmerged, statusRes] = await Promise.all([
    gitService.getRepoInfo(),
    listUnmergedFiles(),
    gitService.runGit(["status", "--porcelain"]).catch(() => ({ stdout: "" }))
  ]);

  const markers = await Promise.all(unmerged.map(scanConflictMarkers));
  const statusLines = statusRes.stdout ? statusRes.stdout.split(/\r?\n/).filter(Boolean) : [];

  return {
    repo,
    hasConflicts: unmerged.length > 0,
    unmergedCount: unmerged.length,
    unmergedFiles: unmerged,
    markerSummary: markers,
    statusLines
  };
}

async function createRecoveryBranch(branchName) {
  const target = (branchName || "").trim() || `recover/conflict-${stamp()}`;
  let result;
  try {
    result = await gitService.runGit(["switch", "-c", target]);
  } catch (_err) {
    // 兼容较老 Git：回退到 checkout -b
    result = await gitService.runGit(["checkout", "-b", target]);
  }
  return {
    branch: target,
    result
  };
}

async function exportPatch(note) {
  await fs.mkdir(exportDir, { recursive: true });
  const safeNote = (note || "").trim().replace(/[^\w\u4e00-\u9fa5-]+/g, "_").slice(0, 40);
  const name = safeNote ? `conflict-${stamp()}-${safeNote}.patch` : `conflict-${stamp()}.patch`;
  const target = path.join(exportDir, name);

  const diff = await gitService.runGit(["diff"]).catch(() => ({ stdout: "" }));
  await fs.writeFile(target, diff.stdout || "", "utf8");

  return {
    file: target,
    bytes: Buffer.byteLength(diff.stdout || "", "utf8")
  };
}

module.exports = {
  getConflictState,
  createRecoveryBranch,
  exportPatch
};
