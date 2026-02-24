"use strict";

const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");
const gitService = require("./gitStashService");

const tempRoot = path.resolve(__dirname, "..", "temp");

function normalizeRef(ref) {
  if (typeof ref !== "string") return "stash@{0}";
  const v = ref.trim();
  return v || "stash@{0}";
}

function normalizeMode(mode) {
  return mode === "pop" ? "pop" : "apply";
}

function runGitAt(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      shell: false
    });

    let stdout = "";
    let stderr = "";
    child.stdin.end();

    child.stdout.on("data", (buf) => {
      stdout += buf.toString("utf8");
    });
    child.stderr.on("data", (buf) => {
      stderr += buf.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const result = {
        ok: code === 0,
        code,
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        command: ["git", ...args].join(" "),
        cwd
      };
      if (code === 0) resolve(result);
      else {
        const err = new Error(result.stderr || "Git command failed");
        err.result = result;
        reject(err);
      }
    });
  });
}

function buildCheckpointMessage() {
  const t = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `safety-checkpoint ${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
}

function hasConflictText(text) {
  const t = (text || "").toLowerCase();
  return /conflict|merge conflict|could not|overwritten/.test(t);
}

async function getChangedFiles() {
  const result = await gitService.runGit(["status", "--porcelain"]).catch(() => ({ stdout: "" }));
  return result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}

async function precheck(payload = {}) {
  const ref = normalizeRef(payload.ref);
  const mode = normalizeMode(payload.mode);
  const reinstateIndex = Boolean(payload.reinstateIndex);

  const repo = await gitService.getRepoInfo();
  const changedFiles = await getChangedFiles();

  let stashExists = true;
  let stashCommit = "";
  try {
    const verify = await gitService.runGit(["rev-parse", "--verify", ref]);
    stashCommit = verify.stdout.trim();
  } catch (_err) {
    stashExists = false;
  }

  const checks = {
    stashExists,
    hasChanges: repo.hasChanges,
    changedFilesCount: changedFiles.length,
    changedFiles: changedFiles.slice(0, 80),
    dryRun: {
      attempted: false,
      ok: false,
      conflictLikely: false,
      stdout: "",
      stderr: ""
    }
  };

  if (stashExists) {
    // 新增：在临时 worktree 中演练 apply，用于预估冲突风险，避免污染当前工作区
    await fs.mkdir(tempRoot, { recursive: true });
    const name = `precheck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempWorktree = path.join(tempRoot, name);

    try {
      await gitService.runGit(["worktree", "add", "--detach", tempWorktree, "HEAD"]);
      checks.dryRun.attempted = true;

      const args = ["stash", "apply"];
      if (reinstateIndex) args.push("--index");
      args.push(ref);

      try {
        const dryResult = await runGitAt(tempWorktree, args);
        checks.dryRun.ok = dryResult.ok;
        checks.dryRun.stdout = dryResult.stdout;
        checks.dryRun.stderr = dryResult.stderr;
      } catch (err) {
        const result = err.result || {};
        checks.dryRun.ok = false;
        checks.dryRun.stdout = result.stdout || "";
        checks.dryRun.stderr = result.stderr || err.message;
        checks.dryRun.conflictLikely = hasConflictText(`${checks.dryRun.stdout}\n${checks.dryRun.stderr}`);
      }
    } finally {
      try {
        await gitService.runGit(["worktree", "remove", "--force", tempWorktree]);
      } catch (_err) {
        // 保底清理：worktree remove 失败时尝试删除目录，避免临时目录残留
        await fs.rm(tempWorktree, { recursive: true, force: true }).catch(() => {});
      }
    }
  }

  let riskLevel = "low";
  const advice = [];

  if (!checks.stashExists) {
    riskLevel = "blocked";
    advice.push("目标 stash 不存在，无法执行回滚。");
  } else if (checks.dryRun.conflictLikely) {
    riskLevel = "high";
    advice.push("预检发现疑似冲突，建议先创建分支再回滚。");
  } else if (checks.hasChanges) {
    riskLevel = "medium";
    advice.push("当前工作区有未提交改动，建议先创建安全快照。");
  } else {
    advice.push("风险较低，可执行回滚。");
  }

  if (mode === "pop") {
    advice.push("你选择的是 pop：成功后会删除该 stash。");
  } else {
    advice.push("你选择的是 apply：stash 会保留。");
  }

  return {
    ref,
    mode,
    reinstateIndex,
    stashCommit,
    repo,
    checks,
    riskLevel,
    advice
  };
}

async function safeRollback(payload = {}) {
  const ref = normalizeRef(payload.ref);
  const mode = normalizeMode(payload.mode);
  const reinstateIndex = Boolean(payload.reinstateIndex);
  const autoCheckpoint = payload.autoCheckpoint !== false;

  let checkpoint = {
    attempted: false,
    created: false,
    message: "",
    ref: ""
  };

  if (autoCheckpoint) {
    // 新增：执行前自动快照，给回滚失败提供“回到执行前”抓手
    checkpoint.attempted = true;
    checkpoint.message = buildCheckpointMessage();
    const before = await gitService.listStashes().catch(() => []);
    await gitService.pushStash({
      includeUntracked: true,
      message: checkpoint.message
    }).catch(() => {});
    const after = await gitService.listStashes().catch(() => []);
    if (after.length > before.length && after[0] && after[0].message && after[0].message.includes(checkpoint.message)) {
      checkpoint.created = true;
      checkpoint.ref = after[0].ref;
    }
  }

  const args = ["stash", mode];
  if (reinstateIndex) args.push("--index");
  args.push(ref);

  try {
    const result = await gitService.runGit(args);
    return {
      ok: true,
      ref,
      mode,
      reinstateIndex,
      checkpoint,
      result
    };
  } catch (err) {
    return {
      ok: false,
      ref,
      mode,
      reinstateIndex,
      checkpoint,
      result: err.result || null,
      error: err.message
    };
  }
}

module.exports = {
  precheck,
  safeRollback
};
