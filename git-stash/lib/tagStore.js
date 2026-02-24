"use strict";

const fs = require("fs/promises");
const path = require("path");
const os = require("os");

const legacyDataFile = path.resolve(__dirname, "..", "data", "stash-tags.json");
const appDataDir = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, "lysh-git-stash")
  : path.join(os.homedir(), ".lysh-git-stash");
const dataFile = path.join(appDataDir, "stash-tags.json");

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch (_err) {
    return false;
  }
}

async function ensureStore() {
  await fs.mkdir(appDataDir, { recursive: true });

  const targetExists = await fileExists(dataFile);
  if (targetExists) return;

  const legacyExists = await fileExists(legacyDataFile);
  if (legacyExists) {
    // 新增：自动迁移旧标签数据到仓库外，避免反复污染 git changes
    const legacyRaw = await fs.readFile(legacyDataFile, "utf8");
    await fs.writeFile(dataFile, legacyRaw, "utf8");
    return;
  }

  const init = { tagsByCommit: {} };
  await fs.writeFile(dataFile, JSON.stringify(init, null, 2), "utf8");
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    return { tagsByCommit: {} };
  }
  if (!parsed.tagsByCommit || typeof parsed.tagsByCommit !== "object") {
    parsed.tagsByCommit = {};
  }
  return parsed;
}

async function writeStore(data) {
  await ensureStore();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}

async function listTags() {
  const store = await readStore();
  return store.tagsByCommit;
}

async function setTag(commit, tag) {
  if (!commit || typeof commit !== "string") {
    throw new Error("commit is required");
  }
  const normalized = {
    label: typeof tag.label === "string" ? tag.label.trim() : "",
    color: typeof tag.color === "string" ? tag.color.trim() : "#4f46e5",
    note: typeof tag.note === "string" ? tag.note.trim() : "",
    updatedAt: new Date().toISOString()
  };
  const store = await readStore();
  store.tagsByCommit[commit] = normalized;
  await writeStore(store);
  return normalized;
}

async function removeTag(commit) {
  if (!commit || typeof commit !== "string") {
    throw new Error("commit is required");
  }
  const store = await readStore();
  delete store.tagsByCommit[commit];
  await writeStore(store);
}

module.exports = {
  listTags,
  setTag,
  removeTag,
  dataFile
};
