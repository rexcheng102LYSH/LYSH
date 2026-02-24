"use strict";

const MODE_KEY = "git-stash-ui-mode";
const QUICKSAVE_KEEP_CODE_KEY = "git-stash-ui-quicksave-keep-code";
const CHANGES_MODE_KEY = "git-stash-ui-changes-mode";

const state = {
  stashes: [],
  selectedRef: null,
  filterText: "",
  mode: localStorage.getItem(MODE_KEY) || "simple",
  keepCodeAfterQuickSave: localStorage.getItem(QUICKSAVE_KEEP_CODE_KEY) !== "0",
  changesMode: localStorage.getItem(CHANGES_MODE_KEY) || "working",
  connected: false
};

const el = {
  repoInfo: document.getElementById("repoInfo"),
  connectInfo: document.getElementById("connectInfo"),
  fileProtocolHint: document.getElementById("fileProtocolHint"),
  modeSimpleBtn: document.getElementById("modeSimpleBtn"),
  modeProBtn: document.getElementById("modeProBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  simpleMode: document.getElementById("simpleMode"),
  proMode: document.getElementById("proMode"),

  simpleQuickSaveBtn: document.getElementById("simpleQuickSaveBtn"),
  simpleRefreshBtn: document.getElementById("simpleRefreshBtn"),
  simpleSafeLoadBtn: document.getElementById("simpleSafeLoadBtn"),
  simpleRecoveryBtn: document.getElementById("simpleRecoveryBtn"),
  simpleRollbackToggleBtn: document.getElementById("simpleRollbackToggleBtn"),
  simplePrepareReleaseBtn: document.getElementById("simplePrepareReleaseBtn"),
  simpleBatchApplyReleaseBtn: document.getElementById("simpleBatchApplyReleaseBtn"),
  simpleCommitReleaseBtn: document.getElementById("simpleCommitReleaseBtn"),
  simpleReleaseTitle: document.getElementById("simpleReleaseTitle"),
  simpleReleaseDesc: document.getElementById("simpleReleaseDesc"),
  simpleTagName: document.getElementById("simpleTagName"),
  simpleTagMessage: document.getElementById("simpleTagMessage"),
  simpleCreateTagBtn: document.getElementById("simpleCreateTagBtn"),
  simpleStashList: document.getElementById("simpleStashList"),
  simpleChangesMode: document.getElementById("simpleChangesMode"),
  simpleCheckChangesBtn: document.getElementById("simpleCheckChangesBtn"),
  simpleChangesSummary: document.getElementById("simpleChangesSummary"),
  simpleChangesOutput: document.getElementById("simpleChangesOutput"),
  simpleOutput: document.getElementById("simpleOutput"),

  stashList: document.getElementById("stashList"),
  detailOutput: document.getElementById("detailOutput"),
  logOutput: document.getElementById("logOutput"),
  filterInput: document.getElementById("filterInput"),
  pushForm: document.getElementById("pushForm"),
  pushMessage: document.getElementById("pushMessage"),
  pushPathspecs: document.getElementById("pushPathspecs"),
  pushUntracked: document.getElementById("pushUntracked"),
  pushIgnored: document.getElementById("pushIgnored"),
  pushKeepIndex: document.getElementById("pushKeepIndex"),
  pushPatch: document.getElementById("pushPatch"),
  pushStaged: document.getElementById("pushStaged"),
  applyBtn: document.getElementById("applyBtn"),
  popBtn: document.getElementById("popBtn"),
  dropBtn: document.getElementById("dropBtn"),
  showBtn: document.getElementById("showBtn"),
  showPatchBtn: document.getElementById("showPatchBtn"),
  reinstateIndex: document.getElementById("reinstateIndex"),
  safetyMode: document.getElementById("safetyMode"),
  autoCheckpoint: document.getElementById("autoCheckpoint"),
  precheckBtn: document.getElementById("precheckBtn"),
  safeRollbackBtn: document.getElementById("safeRollbackBtn"),
  safetyOutput: document.getElementById("safetyOutput"),

  checkConflictBtn: document.getElementById("checkConflictBtn"),
  createRecoveryBranchBtn: document.getElementById("createRecoveryBranchBtn"),
  exportPatchBtn: document.getElementById("exportPatchBtn"),
  recoveryBranchName: document.getElementById("recoveryBranchName"),
  patchNote: document.getElementById("patchNote"),
  conflictOutput: document.getElementById("conflictOutput"),

  tagLabel: document.getElementById("tagLabel"),
  tagColor: document.getElementById("tagColor"),
  tagNote: document.getElementById("tagNote"),
  saveTagBtn: document.getElementById("saveTagBtn"),
  removeTagBtn: document.getElementById("removeTagBtn"),

  branchName: document.getElementById("branchName"),
  branchBtn: document.getElementById("branchBtn"),
  createMessage: document.getElementById("createMessage"),
  createBtn: document.getElementById("createBtn"),
  storeCommit: document.getElementById("storeCommit"),
  storeMessage: document.getElementById("storeMessage"),
  storeBtn: document.getElementById("storeBtn"),
  exportToRef: document.getElementById("exportToRef"),
  exportBtn: document.getElementById("exportBtn"),
  importCommit: document.getElementById("importCommit"),
  importBtn: document.getElementById("importBtn"),
  clearBtn: document.getElementById("clearBtn"),
  rawArgs: document.getElementById("rawArgs"),
  rawRunBtn: document.getElementById("rawRunBtn"),
  exportLogBtn: document.getElementById("exportLogBtn"),
  stashItemTpl: document.getElementById("stashItemTpl")
};

function nowText() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function log(msg, type = "info") {
  const line = `[${nowText()}] [${type}] ${msg}\n`;
  el.logOutput.textContent = line + (el.logOutput.textContent || "");
}

function setDetail(text) { el.detailOutput.textContent = text || ""; }
function setSimple(text) { el.simpleOutput.textContent = text || ""; }
function setSimpleChanges(text) {
  if (!el.simpleChangesOutput) return;
  el.simpleChangesOutput.textContent = text || "";
}
function setSafety(text) { el.safetyOutput.textContent = text || ""; }
function setConflict(text) { el.conflictOutput.textContent = text || ""; }

function renderQuickSaveRollbackToggle() {
  if (!el.simpleRollbackToggleBtn) return;
  const keepCode = !!state.keepCodeAfterQuickSave;
  el.simpleRollbackToggleBtn.textContent = keepCode
    ? "文件回滚：关（保留代码）"
    : "文件回滚：开（快存后回滚）";
  el.simpleRollbackToggleBtn.classList.toggle("primary", keepCode);
}

function setMode(mode) {
  state.mode = mode === "pro" ? "pro" : "simple";
  localStorage.setItem(MODE_KEY, state.mode);
  const simple = state.mode === "simple";
  el.simpleMode.classList.toggle("hidden", !simple);
  el.proMode.classList.toggle("hidden", simple);
  el.modeSimpleBtn.classList.toggle("primary", simple);
  el.modeProBtn.classList.toggle("primary", !simple);
  renderQuickSaveRollbackToggle();
}

function setConnected(ok, text) {
  state.connected = ok;
  el.connectInfo.textContent = text;
  el.connectInfo.style.color = ok ? "#0f7b2f" : "#b42318";
}

// Override with enhanced error details (keep duplicate-save reason for UI prompts).
async function parseResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_err) {
    const reqUrl = (() => {
      try {
        return new URL(res.url).pathname || res.url || "(unknown)";
      } catch (_e) {
        return res.url || "(unknown)";
      }
    })();
    const fileModeHint = window.location.protocol === "file:"
      ? "\nDetected file:// mode. Please open via http://localhost:3760."
      : "";
    const currentChangesHint = (res.status === 404 && /\/api\/current-changes\b/.test(reqUrl))
      ? "\nBackend does not provide /api/current-changes (likely an old server process). Please restart git-stash service."
      : "";
    throw new Error("Backend returned non-JSON.\nRequest: " + reqUrl + "\nHTTP " + res.status + fileModeHint + currentChangesHint + "\nResponse snippet: " + text.slice(0, 180));
  }
  if (!data.ok) {
    const detail = data.result
      ? (data.error + (data.result.reason ? "\nreason: " + data.result.reason : "") + "\n\ncommand: " + data.result.command + "\nstderr:\n" + (data.result.stderr || "(empty)"))
      : data.error;
    throw new Error(detail);
  }
  return data.data;
}

async function api(url, options = {}) {
  if (!state.connected) throw new Error("Backend not connected. Please run start-git-stash.bat first.");
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new Error("API request timeout after " + timeoutMs + "ms: " + url);
    }
    throw new Error("Unable to reach backend: " + err.message);
  } finally {
    clearTimeout(timer);
  }
  return parseResponse(res);
}

async function checkConnection() {
  if (window.location.protocol === "file:") {
    el.fileProtocolHint.classList.remove("hidden");
    setConnected(false, "检测到 file:// 打开方式，后端不可用。请双击 start-git-stash.bat。");
    return false;
  }
  el.fileProtocolHint.classList.add("hidden");
  try {
    const health = await fetch("/api/health");
    const data = await parseResponse(health);
    setConnected(true, `后端已连接: ${data.service}`);
    return true;
  } catch (err) {
    setConnected(false, `后端未连接: ${err.message}`);
    return false;
  }
}

function parseRawArgs(input) {
  const out = [];
  let token = "";
  let quote = null;
  let esc = false;
  for (const ch of input) {
    if (esc) { token += ch; esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if ((ch === "\"" || ch === "'") && !quote) { quote = ch; continue; }
    if (ch === quote) { quote = null; continue; }
    if (!quote && /\s/.test(ch)) {
      if (token) out.push(token);
      token = "";
      continue;
    }
    token += ch;
  }
  if (token) out.push(token);
  return out;
}

function getSelectedItem() {
  return state.stashes.find((s) => s.ref === state.selectedRef) || null;
}

function requireSelectedRef() {
  if (!state.selectedRef) {
    alert("请先在左侧选中一个 stash。");
    return null;
  }
  return state.selectedRef;
}

function applyTagToForm(item) {
  const tag = item && item.tag ? item.tag : null;
  el.tagLabel.value = tag ? tag.label || "" : "";
  el.tagColor.value = tag ? tag.color || "#4f46e5" : "#4f46e5";
  el.tagNote.value = tag ? tag.note || "" : "";
}

function renderSimpleList() {
  el.simpleStashList.innerHTML = "";
  if (state.stashes.length === 0) {
    const li = document.createElement("li");
    li.className = "simple-item";
    li.textContent = "当前没有存档。先点“一键快存”。";
    el.simpleStashList.appendChild(li);
    return;
  }
  state.stashes.slice(0, 10).forEach((item) => {
    const li = document.createElement("li");
    li.className = "simple-item";
    li.textContent = `${item.ref} | ${item.message || item.title || "无备注"}`;
    el.simpleStashList.appendChild(li);
  });
}

function renderStashList() {
  el.stashList.innerHTML = "";
  let list = state.stashes.slice();
  const q = state.filterText.trim().toLowerCase();
  if (q) {
    list = list.filter((item) => {
      const text = [
        item.ref, item.title, item.message, item.raw, item.commit,
        item.tag && item.tag.label, item.tag && item.tag.note
      ].filter(Boolean).join(" ").toLowerCase();
      return text.includes(q);
    });
  }

  if (list.length === 0) {
    const li = document.createElement("li");
    li.style.color = "#5c6780";
    li.textContent = state.stashes.length === 0 ? "当前没有 stash。" : "没有匹配结果。";
    el.stashList.appendChild(li);
    return;
  }

  list.forEach((item) => {
    const node = el.stashItemTpl.content.firstElementChild.cloneNode(true);
    const btn = node.querySelector(".stash-btn");
    const refEl = node.querySelector(".ref");
    const msgEl = node.querySelector(".msg");
    const metaEl = node.querySelector(".meta");

    refEl.textContent = item.ref;
    msgEl.textContent = item.message || item.title || item.raw;
    const commitShort = item.commit ? item.commit.slice(0, 10) : "";
    const tagHtml = item.tag && item.tag.label
      ? `<span class="tag-pill" style="background:${item.tag.color || "#4f46e5"}">${item.tag.label}</span>`
      : "";
    metaEl.innerHTML = `${tagHtml}${commitShort}`;

    if (item.ref === state.selectedRef) btn.classList.add("active");
    btn.addEventListener("click", () => {
      state.selectedRef = item.ref;
      renderStashList();
      applyTagToForm(item);
      setDetail(`已选中 ${item.ref}\n${item.raw}\ncommit: ${item.commit || "N/A"}`);
    });

    el.stashList.appendChild(node);
  });
}

async function loadRepoInfo() {
  const info = await api("/api/repo");
  const capExport = info.capabilities && info.capabilities.supportsExport ? "支持" : "不支持";
  const capImport = info.capabilities && info.capabilities.supportsImport ? "支持" : "不支持";
  el.repoInfo.textContent =
    `仓库: ${info.repoRoot} | 分支: ${info.branch} | 工作区改动: ${info.hasChanges ? "有" : "无"} | 有效改动: ${info.effectiveChangeCount || 0} | ${info.gitVersion} | export:${capExport} import:${capImport}`;
}

async function loadStashes() {
  const list = await api("/api/stash");
  state.stashes = list;
  if (state.selectedRef && !list.find((x) => x.ref === state.selectedRef)) {
    state.selectedRef = null;
  }
  if (!state.selectedRef && list.length > 0) state.selectedRef = list[0].ref;
  renderSimpleList();
  renderStashList();
  const selected = getSelectedItem();
  if (selected) applyTagToForm(selected);
}

async function runAction(actionName, fn, output = setDetail) {
  try {
    const result = await fn();
    const text = `${result.command || actionName}\n\nstdout:\n${result.stdout || "(empty)"}\n\nstderr:\n${result.stderr || "(empty)"}`;
    output(text);
    log(`${actionName} 成功`);
    await loadRepoInfo();
    await loadStashes();
    await loadCurrentChanges();
  } catch (err) {
    output(err.message);
    log(`${actionName} 失败: ${err.message}`, "error");
  }
}

function buildQuickSaveMessage() {
  const t = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `quick-save ${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

function renderPrecheck(data) {
  const lines = [];
  lines.push(`risk: ${data.riskLevel}`);
  lines.push(`ref: ${data.ref}`);
  lines.push(`mode: ${data.mode}`);
  lines.push(`hasChanges: ${data.checks.hasChanges ? "true" : "false"} (${data.checks.changedFilesCount})`);
  lines.push(`dryRunOk: ${data.checks.dryRun.ok ? "true" : "false"}`);
  lines.push(`conflictLikely: ${data.checks.dryRun.conflictLikely ? "true" : "false"}`);
  lines.push("");
  lines.push("advice:");
  (data.advice || []).forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  return lines.join("\n");
}

function renderSafeRollback(data) {
  const lines = [];
  lines.push(`ok: ${data.ok ? "true" : "false"}`);
  lines.push(`mode: ${data.mode}`);
  lines.push(`ref: ${data.ref}`);
  lines.push(`checkpoint: ${data.checkpoint && data.checkpoint.created ? data.checkpoint.ref : "未创建"}`);
  if (data.result) {
    lines.push("");
    lines.push(`command: ${data.result.command || "N/A"}`);
    lines.push(data.result.stdout || "(empty)");
    if (data.result.stderr) lines.push(data.result.stderr);
  }
  if (!data.ok && data.error) lines.push(`error: ${data.error}`);
  return lines.join("\n");
}

function renderConflictState(data) {
  const lines = [];
  lines.push(`hasConflicts: ${data.hasConflicts ? "true" : "false"}`);
  lines.push(`unmergedCount: ${data.unmergedCount}`);
  if (data.unmergedFiles && data.unmergedFiles.length > 0) {
    lines.push("unmerged files:");
    data.unmergedFiles.forEach((f) => lines.push(`- ${f}`));
  }
  return lines.join("\n");
}

function renderCurrentChanges(data) {
  if (!el.simpleChangesSummary || !el.simpleChangesOutput) return;
  const mode = data && data.mode ? data.mode : state.changesMode;

  if (mode === "stash" && (!data || !data.available)) {
    el.simpleChangesSummary.textContent = "Stash \u5bf9\u6bd4\u6a21\u5f0f\uff1a\u6682\u65e0\u53ef\u6bd4\u8f83\u57fa\u7ebf\uff08stash@{0} \u4e0d\u5b58\u5728\uff09";
    setSimpleChanges("\u8fd8\u6ca1\u6709\u5386\u53f2 stash\uff0c\u65e0\u6cd5\u505a\u201c\u5f53\u524d\u4ee3\u7801 vs \u6700\u65b0 stash\u201d\u7684\u4e25\u683c\u5bf9\u6bd4\u3002");
    return;
  }

  if (!data) {
    el.simpleChangesSummary.textContent = "\u5de5\u4f5c\u533a\u6a21\u5f0f\uff1a\u6682\u65f6\u65e0\u6cd5\u83b7\u53d6\u53d8\u66f4";
    setSimpleChanges("\u65e0\u6cd5\u8bfb\u53d6\u5f53\u524d\u5de5\u4f5c\u533a\u53d8\u66f4\u3002");
    return;
  }

  if (!data.hasChanges) {
    el.simpleChangesSummary.textContent = mode === "stash"
      ? `Stash \u5bf9\u6bd4\u6a21\u5f0f\uff1a\u6700\u65b0\u5b58\u6863 ${data.baselineRef || "stash@{0}"}\uff0c\u6ca1\u6709\u4e0d\u540c`
      : "\u5de5\u4f5c\u533a\u6a21\u5f0f\uff1a\u4e0e main \u89c6\u56fe\u4e00\u81f4\uff0c\u5f53\u524d\u6ca1\u6709\u53d8\u66f4";
    setSimpleChanges("\u6ca1\u6709\u4e0d\u540c\u3002");
    return;
  }

  if (mode === "stash") {
    const shortCommit = data.baselineCommit ? data.baselineCommit.slice(0, 10) : "N/A";
    el.simpleChangesSummary.textContent = `Stash \u5bf9\u6bd4\u6a21\u5f0f\uff1a${data.baselineRef} (${shortCommit})\uff0c\u5171 ${data.changedFilesCount} \u4e2a\u53d8\u66f4`;
  } else {
    el.simpleChangesSummary.textContent = `\u5de5\u4f5c\u533a\u6a21\u5f0f\uff1a\u5171 ${data.changedFilesCount} \u4e2a\u53d8\u66f4\uff08\u9075\u5faa .gitignore\uff0c\u4e0e main \u540c\u6b65\uff09`;
  }

  const lines = data.changedFiles.map((item) => {
    const status = item.status || "M";
    const prefix = item.oldPath ? `${item.oldPath} -> ` : "";
    return `[${status}] ${prefix}${item.path}`;
  });
  setSimpleChanges(lines.join("\n"));
}

function renderCurrentChangesError(err) {
  if (!el.simpleChangesSummary || !el.simpleChangesOutput) return;
  const msg = err && err.message ? err.message : String(err || "Unknown error");
  el.simpleChangesSummary.textContent = "Changes check failed";
  setSimpleChanges(msg);
}

async function loadCurrentChanges(options = {}) {
  const rethrow = !!options.rethrow;
  const mode = options.mode || state.changesMode || "working";
  try {
    const data = await api(`/api/current-changes?mode=${encodeURIComponent(mode)}`);
    renderCurrentChanges(data);
    return data;
  } catch (err) {
    renderCurrentChangesError(err);
    if (rethrow) throw err;
    return null;
  }
}

function bindEvents() {
  if (el.simpleChangesMode) {
    const initialMode = state.changesMode === "stash" ? "stash" : "working";
    state.changesMode = initialMode;
    el.simpleChangesMode.value = initialMode;
    localStorage.setItem(CHANGES_MODE_KEY, initialMode);
    el.simpleChangesMode.addEventListener("change", async () => {
      const next = el.simpleChangesMode.value === "stash" ? "stash" : "working";
      state.changesMode = next;
      localStorage.setItem(CHANGES_MODE_KEY, next);
      await loadCurrentChanges();
    });
  }

  el.modeSimpleBtn.addEventListener("click", () => setMode("simple"));
  el.modeProBtn.addEventListener("click", () => setMode("pro"));
  el.refreshBtn.addEventListener("click", async () => {
    try {
      await loadRepoInfo();
      await loadStashes();
      await loadCurrentChanges();
      setSimple("\u5df2\u5237\u65b0\u3002");
    } catch (err) {
      setSimple(err.message);
      setDetail(err.message);
      log(`\u5237\u65b0\u5931\u8d25: ${err.message}`, "error");
    }
  });

  el.simpleQuickSaveBtn.addEventListener("click", async () => {
    try {
      const compare = await loadCurrentChanges({ mode: "stash" });
      if (compare && compare.available && !compare.hasChanges) {
        const msg = "\u4ee3\u7801\u4e0e\u4e0a\u4e00\u6b21\u4e0a\u4f20\u5230 stash \u7684\u7248\u672c\u5b8c\u5168\u76f8\u540c\uff0c\u4e0d\u53ef\u91cd\u590d\u50a8\u5b58\u3002";
        setSimple(msg);
        alert(msg);
        log("quick-save blocked: duplicate with latest stash");
        return;
      }

      const keepCode = !!state.keepCodeAfterQuickSave;
      const repoBefore = await api("/api/repo");
      const hadChangesBefore = !!repoBefore.hasChanges;

      const pushResult = await api("/api/stash/push", {
        method: "POST",
        body: {
          message: buildQuickSaveMessage(),
          includeUntracked: true,
          keepWorkingTree: keepCode,
          force: false
        }
      });

      let finalResult = pushResult;
      let feedback = "";

      if (keepCode && hadChangesBefore) {
        const repoAfter = await api("/api/repo");
        if (!repoAfter.hasChanges) {
          const retryApply = await api("/api/stash/apply", {
            method: "POST",
            body: { ref: "stash@{0}", reinstateIndex: true }
          });
          finalResult = {
            ...finalResult,
            command: `${finalResult.command} && ${retryApply.command}`,
            stdout: [finalResult.stdout, retryApply.stdout].filter(Boolean).join("\n\n"),
            stderr: [finalResult.stderr, retryApply.stderr].filter(Boolean).join("\n"),
            restoredWorkingTree: true,
            workingTreePreserved: true,
            workingTreeRolledBack: false
          };
          feedback = "\u68c0\u6d4b\u5230\u5feb\u5b58\u540e\u5de5\u4f5c\u533a\u5f02\u5e38\uff0c\u5df2\u81ea\u52a8\u6062\u590d\u4ee3\u7801\u3002";
        }
      }

      if (finalResult.duplicateSkipped) {
        feedback = "\u4f60\u7684\u4ee3\u7801\u4e0e\u4e0a\u4e00\u6b21\u4e00\u6a21\u4e00\u6837\uff0c\u5df2\u8df3\u8fc7\u91cd\u590d\u5b58\u6863\uff0c\u8bf7\u4e0d\u8981\u91cd\u590d\u70b9\u51fb\u3002";
      } else if (!feedback && finalResult.workingTreeRolledBack) {
        feedback = "\u5b58\u6863\u5df2\u63d0\u4ea4\uff0c\u4ee3\u7801\u5df2\u56de\u6eda\uff0cChanges \u5df2\u6e05\u9664\u3002";
      } else if (!feedback) {
        feedback = "\u5b58\u6863\u5df2\u63d0\u4ea4\uff0c\u4ee3\u7801\u672a\u56de\u6eda\u3002";
      }

      const text = `${finalResult.command || "quick-save"}\n\nstdout:\n${finalResult.stdout || "(empty)"}\n\nstderr:\n${finalResult.stderr || "(empty)"}\n\n\u7ed3\u679c: ${feedback}`;
      setSimple(text);
      alert(feedback);
      log(`quick-save result: ${feedback}`);
      await loadRepoInfo();
      await loadStashes();
      await loadCurrentChanges();
    } catch (err) {
      const duplicate = /DUPLICATE_WITH_LATEST_STASH|identical to latest stash snapshot/i.test(err.message);
      const msg = duplicate
        ? "\u4ee3\u7801\u4e0e\u4e0a\u4e00\u6b21\u4e0a\u4f20\u5230 stash \u7684\u7248\u672c\u5b8c\u5168\u76f8\u540c\uff0c\u4e0d\u53ef\u91cd\u590d\u50a8\u5b58\u3002"
        : `\u4e00\u952e\u5feb\u5b58\u5931\u8d25: ${err.message}`;
      setSimple(msg);
      alert(msg);
      log(`quick-save failed: ${err.message}`, "error");
    }
  });

  if (el.simpleRollbackToggleBtn) {
    el.simpleRollbackToggleBtn.addEventListener("click", () => {
      state.keepCodeAfterQuickSave = !state.keepCodeAfterQuickSave;
      localStorage.setItem(QUICKSAVE_KEEP_CODE_KEY, state.keepCodeAfterQuickSave ? "1" : "0");
      renderQuickSaveRollbackToggle();
      setSimple(state.keepCodeAfterQuickSave
        ? "已切换：快存后保留代码（不回滚）"
        : "已切换：快存后回滚工作区");
    });
  }

  el.simpleRefreshBtn.addEventListener("click", async () => {
    try {
      await loadRepoInfo();
      await loadStashes();
      await loadCurrentChanges();
      setSimple("\u5b58\u6863\u5217\u8868\u5df2\u5237\u65b0\u3002");
    } catch (err) {
      setSimple(err.message);
    }
  });

  if (el.simpleCheckChangesBtn) {
    el.simpleCheckChangesBtn.addEventListener("click", async () => {
      try {
        await loadCurrentChanges();
      } catch (err) {
        setSimpleChanges(err.message);
      }
    });
  }

  el.simpleSafeLoadBtn.addEventListener("click", async () => {
    if (!confirm("确认安全读档最新（stash@{0}）？")) return;
    try {
      const result = await api("/api/safety/rollback", {
        method: "POST",
        body: { ref: "stash@{0}", mode: "apply", reinstateIndex: false, autoCheckpoint: true }
      });
      const text = renderSafeRollback(result);
      setSimple(text);
      setSafety(text);
      await loadRepoInfo();
      await loadStashes();
      log("安全读档完成");
    } catch (err) {
      setSimple(err.message);
      log(`安全读档失败: ${err.message}`, "error");
    }
  });

  el.simpleRecoveryBtn.addEventListener("click", async () => {
    try {
      const result = await api("/api/conflict/recovery-branch", { method: "POST", body: {} });
      const text = `已创建恢复分支: ${result.branch}`;
      setSimple(text);
      setConflict(text);
      await loadRepoInfo();
    } catch (err) {
      setSimple(err.message);
      log(`创建恢复分支失败: ${err.message}`, "error");
    }
  });

  el.simplePrepareReleaseBtn.addEventListener("click", async () => {
    const title = (el.simpleReleaseTitle.value || "").trim();
    if (!title) return alert("请填写提交标题。");
    if (!confirm("确认执行一键发布提交？")) return;
    try {
      const result = await api("/api/release/commit", {
        method: "POST",
        body: {
          title,
          description: (el.simpleReleaseDesc.value || "").trim()
        }
      });
      const text = `发布提交成功\ntitle: ${result.title}\nchanged files: ${result.changedFilesCount}`;
      setSimple(text);
      setDetail(`${text}\n\n${result.result.command}\n${result.result.stdout || "(empty)"}`);
      await loadRepoInfo();
      await loadStashes();
      log("一键发布提交成功");
    } catch (err) {
      setSimple(err.message);
      log(`一键发布提交失败: ${err.message}`, "error");
    }
  });

  if (el.simpleBatchApplyReleaseBtn) {
    el.simpleBatchApplyReleaseBtn.addEventListener("click", async () => {
      if (!confirm("危险操作：将按顺序把全部存档合并到当前代码，是否继续？")) return;
      if (!confirm("二次确认：该操作可能产生冲突，确定现在执行吗？")) return;
      try {
        const result = await api("/api/release/prepare", {
          method: "POST",
          body: { clearAfterApply: false, reinstateIndex: false }
        });
        if (result.ok) {
          const text = `批量合并完成（stash 保留）\n应用数量: ${result.stashCount}\n${result.statusShort || "(empty)"}`;
          setSimple(text);
          setDetail(text);
          log("批量 apply stash 成功");
        } else {
          const text = `批量合并失败\n失败项: ${result.failedRef}\n${result.error}`;
          setSimple(text);
          setDetail(text);
          log(`批量 apply stash 失败: ${result.error}`, "error");
        }
        await loadRepoInfo();
        await loadStashes();
      } catch (err) {
        setSimple(err.message);
        log(`批量 apply stash 失败: ${err.message}`, "error");
      }
    });
  }

  el.simpleCommitReleaseBtn.addEventListener("click", async () => {
    if (!confirm("确认现在清除全部 stash 吗？该操作不可恢复。")) return;
    if (!confirm("二次确认：确定要清空所有 stash 记录吗？")) return;
    try {
      const result = await api("/api/stash/clear", { method: "POST" });
      const text = `已清除全部 stash\n${result.command || "stash clear"}`;
      setSimple(text);
      setDetail(text);
      await loadRepoInfo();
      await loadStashes();
      log("已清除全部 stash");
    } catch (err) {
      setSimple(err.message);
      log(`清除 stash 失败: ${err.message}`, "error");
    }
  });
  el.simpleCreateTagBtn.addEventListener("click", async () => {
    const tag = (el.simpleTagName.value || "").trim();
    if (!tag) return alert("请填写 Tag 名称。");
    if (!confirm(`确认创建 Tag: ${tag} ?`)) return;
    try {
      const result = await api("/api/release/tag", {
        method: "POST",
        body: {
          tag,
          message: (el.simpleTagMessage.value || "").trim(),
          target: "HEAD",
          annotated: true
        }
      });
      const text = `Tag 创建成功: ${result.tag}\n${result.preview || ""}`;
      setSimple(text);
      setDetail(text);
      log(`已创建 Tag: ${result.tag}`);
    } catch (err) {
      setSimple(err.message);
      log(`创建 Tag 失败: ${err.message}`, "error");
    }
  });

  el.filterInput.addEventListener("input", () => {
    state.filterText = el.filterInput.value || "";
    renderStashList();
  });

  el.pushForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pathspecs = (el.pushPathspecs.value || "").split(",").map((s) => s.trim()).filter(Boolean);
    await runAction("stash push", () => api("/api/stash/push", {
      method: "POST",
      body: {
        message: el.pushMessage.value.trim(),
        includeUntracked: el.pushUntracked.checked,
        includeIgnored: el.pushIgnored.checked,
        keepIndex: el.pushKeepIndex.checked,
        patch: el.pushPatch.checked,
        staged: el.pushStaged.checked,
        pathspecs
      }
    }));
  });

  el.showBtn.addEventListener("click", async () => {
    const ref = requireSelectedRef(); if (!ref) return;
    await runAction("stash show", () => api(`/api/stash/show?ref=${encodeURIComponent(ref)}`));
  });
  el.showPatchBtn.addEventListener("click", async () => {
    const ref = requireSelectedRef(); if (!ref) return;
    await runAction("stash show -p", () => api(`/api/stash/show?patch=1&ref=${encodeURIComponent(ref)}`));
  });
  el.applyBtn.addEventListener("click", async () => {
    const ref = requireSelectedRef(); if (!ref) return;
    await runAction("stash apply", () => api("/api/stash/apply", {
      method: "POST",
      body: { ref, reinstateIndex: el.reinstateIndex.checked }
    }));
  });
  el.popBtn.addEventListener("click", async () => {
    const ref = requireSelectedRef(); if (!ref) return;
    if (!confirm(`确认 pop ${ref} ?`)) return;
    await runAction("stash pop", () => api("/api/stash/pop", {
      method: "POST",
      body: { ref, reinstateIndex: el.reinstateIndex.checked }
    }));
  });
  el.dropBtn.addEventListener("click", async () => {
    const ref = requireSelectedRef(); if (!ref) return;
    if (!confirm(`确认 drop ${ref} ?`)) return;
    await runAction("stash drop", () => api("/api/stash/drop", { method: "POST", body: { ref } }));
  });
  el.clearBtn.addEventListener("click", async () => {
    if (!confirm("确认清空全部 stash 吗？")) return;
    if (!confirm("二次确认：清空后无法恢复，确定继续吗？")) return;
    await runAction("stash clear", () => api("/api/stash/clear", { method: "POST" }));
  });

  el.precheckBtn.addEventListener("click", async () => {
    const ref = requireSelectedRef(); if (!ref) return;
    try {
      const result = await api("/api/safety/precheck", {
        method: "POST",
        body: { ref, mode: el.safetyMode.value, reinstateIndex: el.reinstateIndex.checked }
      });
      setSafety(renderPrecheck(result));
      log(`安全预检完成: ${result.riskLevel}`);
    } catch (err) {
      setSafety(err.message);
      log(`安全预检失败: ${err.message}`, "error");
    }
  });
  el.safeRollbackBtn.addEventListener("click", async () => {
    const ref = requireSelectedRef(); if (!ref) return;
    if (!confirm(`确认执行安全回滚？ref=${ref}`)) return;
    try {
      const result = await api("/api/safety/rollback", {
        method: "POST",
        body: {
          ref,
          mode: el.safetyMode.value,
          reinstateIndex: el.reinstateIndex.checked,
          autoCheckpoint: el.autoCheckpoint.checked
        }
      });
      const text = renderSafeRollback(result);
      setSafety(text);
      setDetail(text);
      if (!result.ok) {
        const conflict = await api("/api/conflict/state");
        setConflict(renderConflictState(conflict));
      }
      await loadRepoInfo();
      await loadStashes();
    } catch (err) {
      setSafety(err.message);
      log(`安全回滚失败: ${err.message}`, "error");
    }
  });

  el.checkConflictBtn.addEventListener("click", async () => {
    try {
      const result = await api("/api/conflict/state");
      setConflict(renderConflictState(result));
      log(`冲突检查完成: ${result.unmergedCount}`);
    } catch (err) {
      setConflict(err.message);
      log(`冲突检查失败: ${err.message}`, "error");
    }
  });
  el.createRecoveryBranchBtn.addEventListener("click", async () => {
    try {
      const result = await api("/api/conflict/recovery-branch", {
        method: "POST",
        body: { branchName: (el.recoveryBranchName.value || "").trim() }
      });
      const text = `已创建恢复分支: ${result.branch}`;
      setConflict(text);
      setSimple(text);
      await loadRepoInfo();
    } catch (err) {
      setConflict(err.message);
      log(`创建恢复分支失败: ${err.message}`, "error");
    }
  });
  el.exportPatchBtn.addEventListener("click", async () => {
    try {
      const result = await api("/api/conflict/export-patch", {
        method: "POST",
        body: { note: (el.patchNote.value || "").trim() }
      });
      setConflict(`补丁已导出:\n${result.file}\nbytes:${result.bytes}`);
    } catch (err) {
      setConflict(err.message);
      log(`导出补丁失败: ${err.message}`, "error");
    }
  });

  el.saveTagBtn.addEventListener("click", async () => {
    const item = getSelectedItem();
    if (!item || !item.commit) return alert("请先选中一个 stash。");
    await runAction("save tag", () => api("/api/tags/set", {
      method: "POST",
      body: {
        commit: item.commit,
        label: (el.tagLabel.value || "").trim(),
        color: el.tagColor.value,
        note: (el.tagNote.value || "").trim()
      }
    }));
  });
  el.removeTagBtn.addEventListener("click", async () => {
    const item = getSelectedItem();
    if (!item || !item.commit) return alert("请先选中一个 stash。");
    await runAction("remove tag", () => api("/api/tags/remove", {
      method: "POST",
      body: { commit: item.commit }
    }));
  });

  el.branchBtn.addEventListener("click", async () => {
    const ref = requireSelectedRef(); if (!ref) return;
    const branchName = (el.branchName.value || "").trim();
    if (!branchName) return alert("请填写分支名。");
    await runAction("stash branch", () => api("/api/stash/branch", {
      method: "POST",
      body: { ref, branchName }
    }));
  });
  el.createBtn.addEventListener("click", async () => {
    await runAction("stash create", () => api("/api/stash/create", {
      method: "POST",
      body: { message: (el.createMessage.value || "").trim() }
    }));
  });
  el.storeBtn.addEventListener("click", async () => {
    const commit = (el.storeCommit.value || "").trim();
    if (!commit) return alert("请填写 commit id。");
    await runAction("stash store", () => api("/api/stash/store", {
      method: "POST",
      body: { commit, message: (el.storeMessage.value || "").trim() }
    }));
  });
  el.exportBtn.addEventListener("click", async () => {
    const ref = requireSelectedRef(); if (!ref) return;
    await runAction("stash export", () => api("/api/stash/export", {
      method: "POST",
      body: { ref, toRef: (el.exportToRef.value || "").trim() }
    }));
  });
  el.importBtn.addEventListener("click", async () => {
    const commit = (el.importCommit.value || "").trim();
    if (!commit) return alert("请填写 commit id。");
    await runAction("stash import", () => api("/api/stash/import", {
      method: "POST",
      body: { commit }
    }));
  });
  el.rawRunBtn.addEventListener("click", async () => {
    const input = (el.rawArgs.value || "").trim();
    if (!input) return alert("请填写 raw 参数。");
    await runAction("stash raw", () => api("/api/stash/raw", {
      method: "POST",
      body: { args: parseRawArgs(input) }
    }));
  });

  el.exportLogBtn.addEventListener("click", () => {
    const blob = new Blob([el.logOutput.textContent || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `git-stash-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function bootstrap() {
  setMode(state.mode);
  renderQuickSaveRollbackToggle();
  bindEvents();
  const connected = await checkConnection();
  if (!connected) {
    setSimple("后端未连接。请双击 start-git-stash.bat。");
    renderCurrentChanges(null);
    return;
  }
  try {
    await loadRepoInfo();
    await loadStashes();
    await loadCurrentChanges();
    setSimple("已连接成功。你可以先点“一键快存”。");
  } catch (err) {
    setSimple(err.message);
    setDetail(err.message);
    log(`初始化失败: ${err.message}`, "error");
  }
}

bootstrap();
