"use strict";

const express = require("express");
const path = require("path");
const service = require("./lib/gitStashService");
const tagStore = require("./lib/tagStore");
const safetyService = require("./lib/safetyService");
const conflictService = require("./lib/conflictService");
const releaseService = require("./lib/releaseService");

const app = express();
const PORT = process.env.PORT || 3760;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function ok(res, data) {
  res.json({ ok: true, data });
}

function fail(res, err) {
  const result = err && err.result ? err.result : null;
  res.status(400).json({
    ok: false,
    error: err && err.message ? err.message : "Unknown error",
    result
  });
}

app.get("/api/health", (_req, res) => {
  ok(res, {
    service: "git-stash-ui",
    status: "ok"
  });
});

app.get("/api/repo", async (_req, res) => {
  try {
    const [info, effectivePaths] = await Promise.all([
      service.getRepoInfo(),
      service.getEffectiveChangePaths().catch(() => [])
    ]);
    info.effectiveChangeCount = effectivePaths.length;
    info.effectiveChangePaths = effectivePaths.slice(0, 100);
    ok(res, info);
  } catch (err) {
    fail(res, err);
  }
});

app.get("/api/stash", async (_req, res) => {
  try {
    const [list, tags] = await Promise.all([service.listStashes(), tagStore.listTags()]);
    const data = list.map((item) => ({
      ...item,
      tag: item.commit ? tags[item.commit] || null : null
    }));
    ok(res, data);
  } catch (err) {
    fail(res, err);
  }
});

app.get("/api/stash/show", async (req, res) => {
  try {
    const ref = (req.query.ref || "stash@{0}").toString();
    const patch = req.query.patch === "1" || req.query.patch === "true";
    const result = await service.showStash(ref, patch);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.get("/api/current-changes", async (req, res) => {
  try {
    const mode = (req.query.mode || "working").toString();
    const result = await service.getCurrentChanges(mode);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/push", async (req, res) => {
  try {
    const result = await service.pushStash(req.body || {});
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/apply", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await service.applyStash(body.ref, !!body.reinstateIndex);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/pop", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await service.popStash(body.ref, !!body.reinstateIndex);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/drop", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await service.dropStash(body.ref);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/clear", async (_req, res) => {
  try {
    const result = await service.clearStash();
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/branch", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await service.branchFromStash(body.branchName, body.ref);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/create", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await service.createStash(body.message || "");
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/store", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await service.storeStash(body.commit, body.message || "");
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/export", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await service.exportStash(body.ref || "", body.toRef || "");
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/import", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await service.importStash(body.commit);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/stash/raw", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await service.runRawStash(body.args || []);
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/safety/precheck", async (req, res) => {
  try {
    // 新增：安全预检接口，返回风险等级与建议
    const body = req.body || {};
    const result = await safetyService.precheck({
      ref: body.ref,
      mode: body.mode,
      reinstateIndex: !!body.reinstateIndex
    });
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/safety/rollback", async (req, res) => {
  try {
    // 新增：安全执行接口，可选自动创建 checkpoint
    const body = req.body || {};
    const result = await safetyService.safeRollback({
      ref: body.ref,
      mode: body.mode,
      reinstateIndex: !!body.reinstateIndex,
      autoCheckpoint: body.autoCheckpoint !== false
    });
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/release/prepare", async (req, res) => {
  try {
    const body = req.body || {};
    // 新增：一键准备发布（按时间顺序应用全部 stash，并可清空 stash）
    const result = await releaseService.prepareRelease({
      clearAfterApply: body.clearAfterApply !== false,
      reinstateIndex: !!body.reinstateIndex
    });
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/release/commit", async (req, res) => {
  try {
    const body = req.body || {};
    // 新增：一键发布提交（Summary + Description）
    const result = await releaseService.commitRelease({
      title: body.title,
      description: body.description
    });
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/release/tag", async (req, res) => {
  try {
    const body = req.body || {};
    // 新增：一键打 Tag（默认在 HEAD 上创建注释标签）
    const result = await releaseService.createTag({
      tag: body.tag,
      message: body.message,
      target: body.target,
      annotated: body.annotated !== false
    });
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.get("/api/conflict/state", async (_req, res) => {
  try {
    // 新增：冲突状态探测，汇总未合并文件与标记计数
    const result = await conflictService.getConflictState();
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/conflict/recovery-branch", async (req, res) => {
  try {
    // 新增：一键创建恢复分支，便于安全修冲突
    const body = req.body || {};
    const result = await conflictService.createRecoveryBranch(body.branchName || "");
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/conflict/export-patch", async (req, res) => {
  try {
    // 新增：导出当前工作区补丁，作为二次保险
    const body = req.body || {};
    const result = await conflictService.exportPatch(body.note || "");
    ok(res, result);
  } catch (err) {
    fail(res, err);
  }
});

app.get("/api/tags", async (_req, res) => {
  try {
    const tags = await tagStore.listTags();
    ok(res, tags);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/tags/set", async (req, res) => {
  try {
    const body = req.body || {};
    const tag = await tagStore.setTag(body.commit, {
      label: body.label,
      color: body.color,
      note: body.note
    });
    ok(res, tag);
  } catch (err) {
    fail(res, err);
  }
});

app.post("/api/tags/remove", async (req, res) => {
  try {
    const body = req.body || {};
    await tagStore.removeTag(body.commit);
    ok(res, { removed: true });
  } catch (err) {
    fail(res, err);
  }
});

app.listen(PORT, () => {
  console.log(`git-stash UI started: http://localhost:${PORT}`);
  console.log(`target repo root: ${service.repoRoot}`);
});
