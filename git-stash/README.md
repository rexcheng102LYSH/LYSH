# Git Stash 可视化工具（Project Lysh）

这个小应用用于把 `git stash` 做成可视化“快速存档/读档”界面。  
核心原则：`stash` 本体全部走系统 Git，和命令行天然同步、不冲突。  
补充能力：仅额外保存“标签元数据（颜色/备注）”，用于 UI 识别存档，不会改写 Git 数据结构。

## 1. 目录说明

- `git-stash/server.js`：HTTP API 服务入口
- `git-stash/lib/gitStashService.js`：Git 命令执行与参数校验
- `git-stash/public/index.html`：可视化页面
- `git-stash/public/app.js`：前端逻辑
- `git-stash/public/style.css`：样式
- 标签数据默认迁移到系统目录（Windows: `%LOCALAPPDATA%/lysh-git-stash/stash-tags.json`）

## 2. 快速启动

在项目根目录执行：

```bash
cd git-stash
npm install
npm run start
```

打开浏览器访问：

```text
http://localhost:3760
```

推荐（最简单）：直接双击  
`git-stash/start-git-stash.bat`

如果你不想看到命令行窗口（后台运行）：  
双击 `git-stash/start-git-stash-hidden.vbs`

说明：请不要直接双击 `git-stash/public/index.html`。  
直接双击会变成 `file://` 模式，前端无法连接后端 API，日志会全部失败。

如果你在 PowerShell 遇到 `npm.ps1` 被策略拦截，请改用：

```bash
npm.cmd install
npm.cmd run start
```

## 3. 功能覆盖（与 git stash 对应）

- `stash list`
- `stash show` / `stash show -p`
- `stash push`（支持 `-u -a -k -p --staged -m -- <pathspec...>`）
- `stash apply [--index]`
- `stash pop [--index]`
- `stash drop`
- `stash clear`
- `stash branch`
- `stash create`
- `stash store`
- `stash export`
- `stash import`
- `raw` 原始参数模式（应对非常规参数）
- 一键快存（自动 `push -u -m quick-save 时间`）
- 一键读档最新（`apply stash@{0}`）
- 极简模式（给零基础用户的 4 步引导）
- 专业模式（完整 stash 功能，原界面已迁入）
- 一键准备发布（应用并清空全部 stash）
- 一键发布提交（填写 Summary / Description 后直接 commit）
- 一键打 Tag（发布后可选）
- 列表筛选（按 ref/message/commit/标签）
- 标签系统（按 stash commit 绑定颜色、标签名、备注）
- 操作日志导出（txt）
- 安全回滚向导（风险预检 + 安全执行）
- 冲突修复向导（冲突探测 + 恢复分支 + 补丁导出）

## 4. 同步与不冲突说明

1. UI 每次刷新都实时读取 `git stash list`。  
2. 你在命令行新增/删除 stash，UI 立即可见。  
3. 你在 UI 操作，命令行 `git stash list` 也会同步变化。  
4. `stash` 没有“二份数据”，只有 Git 官方那一份。  
5. 标签是附加元数据，不会影响命令行 `stash` 使用。  
6. 快存增加了“有效改动检测”：仅内部元数据变化时会拒绝创建 stash。

## 5. 建议使用习惯

1. 大改动前先 `push -u + message`，相当于“快速存档”。  
2. 恢复建议优先用 `stash branch`，减少冲突。  
3. 危险操作 `drop/clear` 前先 `show -p` 复核。  
4. 正式版本仍用常规 `commit + 版本号`，stash 只做临时进度管理。

## 6. Debug 记录（本版本）

1. 修复了 UI/服务端中文乱码提示问题。  
2. 增加 Git 能力探测（是否支持 `stash export/import`）。  
3. 修复了服务端默认 ref 行为（未提供时使用 `stash@{0}`）。  
4. 增强 raw 参数解析（支持引号和转义）。  
5. 自测通过：`/api/repo`、`/api/stash`、`/api/tags` 返回正常。
6. 新增安全预检：在临时 worktree 演练 `stash apply`，不污染当前工作区。
7. 新增安全执行：支持执行前自动创建安全快照（checkpoint）。
8. 新增冲突修复接口：可读取未合并文件、自动建恢复分支、导出现场补丁。

## 7. 手动验证清单（建议）

1. 在终端执行一次 `git stash push -u -m "cli test"`，确认 UI 刷新可见。  
2. 在 UI 点 `apply`，确认工作区出现改动。  
3. 在 UI 点 `pop`，确认对应条目消失。  
4. 在 UI 用 `raw` 执行 `list`，确认输出正确。  
5. 在终端 `git stash list` 对照 UI，确认完全一致。
6. 在“安全回滚向导”里先点“风险预检”，确认能输出 `risk` 等级。  
7. 勾选“自动创建安全快照”，执行“安全执行回滚”，确认输出包含 `checkpoint ref`。
8. 点“检查冲突状态”，确认可列出未合并文件（无冲突时应为 0）。  
9. 点“创建恢复分支”，确认当前分支名更新。  
10. 点“导出当前补丁”，确认 `git-stash/exports/` 下出现 patch 文件。
