"use strict";

const gitService = require("./gitStashService");

function normalizeText(v) {
  return typeof v === "string" ? v.trim() : "";
}

function validateTagName(tag) {
  if (!tag) throw new Error("tag 不能为空");
  if (/\s/.test(tag)) throw new Error("tag 不能包含空格");
  if (tag.startsWith("-")) throw new Error("tag 不能以 - 开头");
}

async function prepareRelease(payload = {}) {
  const clearAfterApply = payload.clearAfterApply !== false;
  const reinstateIndex = Boolean(payload.reinstateIndex);

  const stashes = await gitService.listStashes();
  const ordered = stashes.slice().reverse(); // 旧 -> 新，尽量按时间顺序叠加
  const appliedRefs = [];

  for (const item of ordered) {
    try {
      await gitService.applyStash(item.ref, reinstateIndex);
      appliedRefs.push(item.ref);
    } catch (err) {
      return {
        ok: false,
        phase: "apply",
        appliedRefs,
        failedRef: item.ref,
        error: err.message,
        result: err.result || null
      };
    }
  }

  if (clearAfterApply && ordered.length > 0) {
    await gitService.clearStash();
  }

  const status = await gitService.runGit(["status", "--short"]).catch(() => ({ stdout: "" }));
  return {
    ok: true,
    appliedRefs,
    stashCount: ordered.length,
    clearAfterApply,
    statusShort: status.stdout || ""
  };
}

async function commitRelease(payload = {}) {
  const title = normalizeText(payload.title);
  const description = normalizeText(payload.description);

  if (!title) {
    throw new Error("title 不能为空");
  }

  const effective = await gitService.getEffectiveChangePaths();
  if (effective.length === 0) {
    throw new Error("没有可提交的源码改动。");
  }

  await gitService.runGit(["add", "-A"]);
  const args = ["commit", "-m", title];
  if (description) args.push("-m", description);
  const result = await gitService.runGit(args);

  return {
    ok: true,
    title,
    description,
    changedFilesCount: effective.length,
    result
  };
}

async function createTag(payload = {}) {
  const tag = normalizeText(payload.tag);
  const message = normalizeText(payload.message);
  const target = normalizeText(payload.target) || "HEAD";
  const annotated = payload.annotated !== false;

  validateTagName(tag);

  const tagExists = await gitService.runGit(["rev-parse", "-q", "--verify", `refs/tags/${tag}`])
    .then(() => true)
    .catch(() => false);
  if (tagExists) {
    throw new Error(`tag 已存在: ${tag}`);
  }

  const args = ["tag"];
  if (annotated) {
    args.push("-a", tag, "-m", message || tag, target);
  } else {
    args.push(tag, target);
  }
  const result = await gitService.runGit(args);

  const show = await gitService.runGit(["show", "--quiet", "--oneline", tag]).catch(() => ({ stdout: "" }));
  return {
    ok: true,
    tag,
    target,
    annotated,
    result,
    preview: show.stdout || ""
  };
}

module.exports = {
  prepareRelease,
  commitRelease,
  createTag
};
