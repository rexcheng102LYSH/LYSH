const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

function nowIso() {
  return new Date().toISOString();
}

function makeSnapshotId() {
  return nowIso().replace(/[:.]/g, "-");
}

function appendLogLine(logPath, line) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  if (fs.existsSync(logPath)) {
    const txt = fs.readFileSync(logPath, "utf8");
    if (txt.length > 0 && !txt.endsWith("\n")) fs.appendFileSync(logPath, "\n", "utf8");
  }
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

class HistoryItem extends vscode.TreeItem {
  constructor(entry) {
    super(entry.label, vscode.TreeItemCollapsibleState.None);
    this.description = entry.timeText;
    this.tooltip = `${entry.timeText}\n${entry.message}`;
    this.contextValue = "codexHistoryItem";
    this.iconPath = new vscode.ThemeIcon("history");
    this.command = {
      command: "codexHistory.openEntry",
      title: "打开历史项",
      arguments: [entry],
    };
  }
}

class CodexHistoryProvider {
  constructor(workspaceRoot, output) {
    this.workspaceRoot = workspaceRoot;
    this.output = output;
    this.logPath = path.join(workspaceRoot, ".vscode", "codex-timeline.log");
    this.snapshotsRoot = path.join(workspaceRoot, ".vscode", "codex-snapshots");
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.activeRelPath = null;
    this._watcher = null;
    this._startWatch();
  }

  dispose() {
    if (this._watcher) this._watcher.close();
    this._onDidChangeTreeData.dispose();
  }

  setActiveFile(absPath) {
    this.activeRelPath = this._toRel(absPath);
    this.refresh();
  }

  refresh() {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    const entries = this.readEntries();
    const filtered = this.activeRelPath
      ? entries.filter((e) => this._matchFile(e.message, this.activeRelPath))
      : entries;

    if (filtered.length === 0) {
      const tip = new HistoryItem({
        label: this.activeRelPath ? "当前文件暂无存根记录" : "暂无存根记录",
        timeText: "",
        message: "",
        snapshotId: null,
      });
      tip.iconPath = new vscode.ThemeIcon("info");
      tip.command = undefined;
      return [tip];
    }

    return filtered.slice(0, 300).map((e) => new HistoryItem(e));
  }

  _startWatch() {
    try {
      const dir = path.dirname(this.logPath);
      this._watcher = fs.watch(dir, { persistent: false }, (_, fileName) => {
        if (String(fileName || "") === "codex-timeline.log") this.refresh();
      });
      this.output.appendLine(`watch: ${this.logPath}`);
    } catch (err) {
      this.output.appendLine(`watch error: ${err && err.message ? err.message : String(err)}`);
    }
  }

  readEntries() {
    try {
      if (!fs.existsSync(this.logPath)) return [];
      const txt = fs.readFileSync(this.logPath, "utf8");
      const lines = txt.split(/\r?\n/).filter(Boolean);
      const out = [];
      for (let i = lines.length - 1; i >= 0; i--) {
        const m = lines[i].match(/^\[(.+?)\]\s*(.*)$/);
        if (!m) continue;
        const ts = new Date(m[1]).getTime();
        if (!Number.isFinite(ts)) continue;

        const rawMsg = m[2] || "";
        const snap = rawMsg.match(/\|\s*snapshot=([A-Za-z0-9._-]+)/);
        const message = rawMsg.replace(/\s*\|\s*snapshot=[A-Za-z0-9._-]+/, "");
        out.push({
          ts,
          timeText: m[1],
          message,
          label: message || "(empty)",
          snapshotId: snap ? snap[1] : null,
        });
      }
      return out;
    } catch (err) {
      this.output.appendLine(`read error: ${err && err.message ? err.message : String(err)}`);
      return [];
    }
  }

  createSnapshotForFile(relPath, reasonText) {
    if (!relPath) return null;
    const src = path.join(this.workspaceRoot, relPath);
    if (!fs.existsSync(src)) return null;

    const snapshotId = makeSnapshotId();
    const snapBase = path.join(this.snapshotsRoot, snapshotId);
    const dst = path.join(snapBase, relPath);
    try {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      const manifest = {
        snapshotId,
        createdAt: nowIso(),
        files: [relPath],
        reason: reasonText,
      };
      fs.writeFileSync(path.join(snapBase, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
      appendLogLine(this.logPath, `[${nowIso()}] ${reasonText} -> ${relPath} | snapshot=${snapshotId}`);
      return snapshotId;
    } catch (err) {
      this.output.appendLine(`snapshot error: ${err && err.message ? err.message : String(err)}`);
      return null;
    }
  }

  restoreActiveFileFromEntry(entry) {
    if (!entry || !entry.snapshotId) {
      return { ok: false, reason: "该记录没有快照，无法回滚。" };
    }
    if (!this.activeRelPath) {
      return { ok: false, reason: "当前没有激活文件，请先打开要回滚的文件。" };
    }

    const rel = this.activeRelPath;
    const src = path.join(this.snapshotsRoot, entry.snapshotId, rel);
    const dst = path.join(this.workspaceRoot, rel);
    if (!fs.existsSync(src)) {
      return { ok: false, reason: `快照中没有当前文件：${rel}` };
    }

    // 变更原因：回滚前自动备份“当前状态”，确保回滚操作本身可逆
    const backupId = this.createSnapshotForFile(rel, "rollback-backup");
    if (!backupId) {
      return { ok: false, reason: "回滚前备份失败，已终止回滚以保护当前文件。" };
    }

    try {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      appendLogLine(this.logPath, `[${nowIso()}] rollback-apply -> ${rel} | snapshot=${entry.snapshotId}`);
      return { ok: true, backupId };
    } catch (err) {
      return { ok: false, reason: `回滚失败：${err && err.message ? err.message : String(err)}` };
    }
  }

  _toRel(absPath) {
    if (!absPath) return null;
    try {
      const rel = path.relative(this.workspaceRoot, absPath);
      if (!rel || rel.startsWith("..")) return null;
      return rel.split(path.sep).join("/");
    } catch {
      return null;
    }
  }

  _matchFile(message, relPath) {
    if (!message || !relPath) return false;
    const base = path.basename(relPath);
    const normalized = String(message).replace(/\\/g, "/");
    return normalized.includes(relPath) || normalized.includes(base);
  }
}

function activate(context) {
  const output = vscode.window.createOutputChannel("Codex History");
  output.appendLine("activate: start");

  const folder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  if (!folder) {
    output.appendLine("activate: no workspace folder");
    return;
  }

  const provider = new CodexHistoryProvider(folder.uri.fsPath, output);
  const view = vscode.window.createTreeView("codexHistoryView", { treeDataProvider: provider });

  const updateActive = () => {
    const editor = vscode.window.activeTextEditor;
    const abs = editor && editor.document ? editor.document.uri.fsPath : null;
    provider.setActiveFile(abs);
  };

  const cmdRefresh = vscode.commands.registerCommand("codexHistory.refresh", () => provider.refresh());

  const cmdShowAll = vscode.commands.registerCommand("codexHistory.showAll", async () => {
    const items = provider.readEntries().slice(0, 300);
    await vscode.window.showQuickPick(items.map((i) => ({ label: i.label, description: i.timeText })), {
      placeHolder: "Codex 存根历史（全部）",
    });
  });

  const cmdShowCurrent = vscode.commands.registerCommand("codexHistory.showCurrentFile", async () => {
    const rel = provider.activeRelPath;
    if (!rel) {
      vscode.window.showInformationMessage("当前没有激活文件。");
      return;
    }
    const items = provider.readEntries().filter((i) => provider._matchFile(i.message, rel)).slice(0, 300);
    await vscode.window.showQuickPick(items.map((i) => ({ label: i.label, description: i.timeText })), {
      placeHolder: `Codex 存根历史（${rel}）`,
    });
  });

  const cmdOpenEntry = vscode.commands.registerCommand("codexHistory.openEntry", async (entry) => {
    if (!entry) return;

    const action = await vscode.window.showQuickPick(
      [
        { label: "查看详情", value: "detail" },
        { label: "回滚当前文件到此记录", value: "rollback" },
      ],
      { placeHolder: "选择操作" }
    );
    if (!action) return;

    if (action.value === "detail") {
      vscode.window.showInformationMessage(`${entry.timeText} | ${entry.message}`);
      return;
    }

    const confirm = await vscode.window.showWarningMessage(
      `确认将当前文件回滚到：\n${entry.timeText}\n\n回滚前会自动做一份备份。`,
      { modal: true },
      "确认回滚"
    );
    if (confirm !== "确认回滚") return;

    const ret = provider.restoreActiveFileFromEntry(entry);
    if (!ret.ok) {
      vscode.window.showErrorMessage(ret.reason);
      return;
    }

    provider.refresh();
    vscode.window.showInformationMessage(`回滚完成。已自动备份当前状态（snapshot=${ret.backupId}）。`);
  });

  const onEditor = vscode.window.onDidChangeActiveTextEditor(updateActive);
  updateActive();

  context.subscriptions.push(
    provider,
    view,
    cmdRefresh,
    cmdShowAll,
    cmdShowCurrent,
    cmdOpenEntry,
    onEditor,
    output
  );
  output.appendLine("activate: ready");
}

function deactivate() {}

module.exports = { activate, deactivate };
