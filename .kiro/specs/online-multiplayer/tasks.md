# 联网对战开发任务清单

## Phase 1: 基础房间对战 + 技能同步（本地测试）

### 1.1 后端基础搭建
- [ ] 初始化 Node.js 项目 (`server/package.json`)
- [ ] 安装依赖 (express, socket.io, cors)
- [ ] 创建主入口 `server/index.js`
- [ ] 创建配置文件 `server/config.js`

### 1.2 房间管理系统
- [ ] 实现 `RoomManager` 类
  - [ ] `generateRoomId()` - 生成 6 位纯数字房间号
  - [ ] `createRoom()` - 创建房间
  - [ ] `joinRoom()` - 加入房间
  - [ ] `leaveRoom()` - 离开房间
  - [ ] `getRoom()` - 获取房间信息
  - [ ] `cleanupRooms()` - 清理过期房间

### 1.3 猜拳选边系统（服务端）
- [ ] 实现 `rpsLogic.js`
  - [ ] `startRPS()` - 开始猜拳
  - [ ] `submitChoice()` - 提交猜拳选择
  - [ ] `determineWinner()` - 判定胜负
  - [ ] `handleTimeout()` - 超时随机选择
  - [ ] `submitSideChoice()` - 提交选边

### 1.4 游戏逻辑（服务端）
- [ ] 实现 `gameLogic.js`
  - [ ] `isValidMove()` - 验证落子合法性
  - [ ] `checkWin()` - 检查胜负
  - [ ] `initBoard()` - 初始化棋盘
  - [ ] `applySkillEffect()` - 应用技能效果

### 1.5 投降与悔棋（服务端）
- [ ] 实现投降逻辑
  - [ ] `handleSurrender()` - 处理投降
- [ ] 实现悔棋逻辑
  - [ ] `requestUndo()` - 请求悔棋
  - [ ] `respondUndo()` - 回应悔棋
  - [ ] `executeUndo()` - 执行悔棋
  - [ ] 悔棋次数限制检查

### 1.6 技能系统（服务端）
- [ ] 实现 `skillLogic.js`
  - [ ] `isValidSkill()` - 验证技能使用合法性
  - [ ] `executeSkill()` - 执行技能效果
  - [ ] 各技能的服务端逻辑：
    - [ ] 双连 (double)
    - [ ] 巫毒腐蚀 (voodoo)
    - [ ] 移花接木 (move_self)
    - [ ] 乾坤大挪移 (move_enemy)
    - [ ] 领地 (zone)
    - [ ] 时间炸弹 (bomb)
    - [ ] 上帝之手 (god_hand)
    - [ ] 混沌干扰 (chaos)
    - [ ] 短兵相接 (short_battle)
    - [ ] 交换 (swap)

### 1.7 Socket 事件处理
- [ ] 实现 `socketHandlers.js`
  - [ ] 房间事件：create_room, join_room
  - [ ] 猜拳事件：rps_choice, side_choice
  - [ ] 游戏事件：place_piece, use_skill
  - [ ] 投降悔棋：surrender, request_undo, respond_undo
  - [ ] 连接事件：disconnect, reconnect

### 1.8 前端网络模块
- [ ] 创建 `js/network/socket_client.js`
  - [ ] Socket.IO 连接管理
  - [ ] 事件监听封装
  - [ ] 连接状态管理

### 1.9 前端联网游戏逻辑
- [ ] 创建 `js/network/online_game.js`
  - [ ] `createRoom()` - 创建房间
  - [ ] `joinRoom()` - 加入房间
  - [ ] `sendMove()` - 发送落子
  - [ ] `sendSkill()` - 发送技能使用
  - [ ] `sendSurrender()` - 发送投降
  - [ ] `sendUndoRequest()` - 发送悔棋请求
  - [ ] `respondUndoRequest()` - 回应悔棋请求
  - [ ] `handleOpponentMove()` - 处理对手落子
  - [ ] `handleOpponentSkill()` - 处理对手技能
  - [ ] `handleGameOver()` - 处理游戏结束

### 1.10 前端猜拳模块
- [ ] 创建 `js/network/rps_ui.js`
  - [ ] 猜拳界面 UI
  - [ ] 选择动画
  - [ ] 结果展示动画
  - [ ] 选边界面 UI

### 1.11 前端 UI 组件
- [ ] 创建 `js/network/online_ui.js`
  - [ ] 房间创建/加入弹窗
  - [ ] 等待对手界面
  - [ ] 连接状态指示器
  - [ ] 对手昵称显示
  - [ ] 投降确认弹窗
  - [ ] 悔棋请求/回应弹窗

### 1.12 HTML/CSS 更新
- [ ] `index.html` 添加联网入口按钮
- [ ] `index.html` 添加房间弹窗 HTML
- [ ] `index.html` 添加猜拳界面 HTML
- [ ] `index.html` 添加投降确认弹窗 HTML
- [ ] `index.html` 添加悔棋请求弹窗 HTML
- [ ] `index.html` 添加 Socket.IO CDN
- [ ] `style.css` 添加联网 UI 样式
- [ ] `style.css` 添加猜拳界面样式

### 1.13 UI 逻辑修改
- [ ] 修改退出按钮逻辑（联网时变投降）
- [ ] 修改悔棋按钮逻辑（联网时发请求）
- [ ] 添加悔棋按钮禁用状态

### 1.14 棋子样式同步
- [ ] 加入房间时发送本地棋子样式设置
- [ ] 接收对手棋子样式
- [ ] 渲染时根据规则选择棋子样式

### 1.15 集成与测试
- [ ] 修改 `game_core.js` 添加联网模式分支
- [ ] 修改 `game_skills.js` 添加联网技能发送
- [ ] 修改 `game_ui.js` 添加联网 UI 切换
- [ ] 扩展 `GameState` 添加 online 状态
- [ ] 本地双开浏览器测试完整流程

---

## Phase 2: 断线重连 + 部署

### 2.1 断线重连（服务端）
- [ ] 实现心跳检测
- [ ] 实现断线检测逻辑
- [ ] 实现 30 秒重连窗口
- [ ] 实现 `client:reconnect` 处理
- [ ] 超时判负逻辑
- [ ] 重连时恢复完整状态（棋盘、技能、悔棋）

### 2.2 断线重连（前端）
- [ ] 检测连接断开
- [ ] 自动尝试重连
- [ ] 显示断线警告 UI
- [ ] 显示重连倒计时
- [ ] 恢复棋盘状态和技能状态

### 2.3 部署准备
- [ ] 选择托管平台（Render/Railway）
- [ ] 配置环境变量
- [ ] 配置 CORS 允许域名
- [ ] 部署后端服务

### 2.4 前端配置
- [ ] 添加服务器地址配置
- [ ] 区分开发/生产环境
- [ ] 测试线上连接

---

## Phase 3: BO3 模式 + 数据存储（可选）

### 3.1 BO3 三番战
- [ ] 服务端 BO3 状态管理
- [ ] 局间选边逻辑（败者选边 / 重新猜拳）
- [ ] 比分显示 UI
- [ ] 局间过渡动画

### 3.2 数据库搭建
- [ ] 选择数据库（SQLite/MongoDB）
- [ ] 设计数据表结构
- [ ] 实现数据库连接

### 3.3 对局记录
- [ ] 存储每局棋谱（含技能使用记录）
- [ ] 存储对局结果
- [ ] 实现对局回放（可选）

### 3.4 玩家系统
- [ ] 简单昵称系统
- [ ] 对局统计（胜/负/平）
- [ ] 本地存储玩家 ID

---

## 开发顺序建议

```
Week 1: Phase 1.1 ~ 1.7 (后端基础 + 猜拳 + 技能逻辑)
        ↓
Week 2: Phase 1.8 ~ 1.12 (前端网络模块 + UI)
        ↓
Week 2: Phase 1.13 ~ 1.15 (集成测试)
        ↓
Week 3: Phase 2.1 ~ 2.2 (断线重连)
        ↓
Week 3: Phase 2.3 ~ 2.4 (部署上线)
        ↓
后续:   Phase 3 (按需开发)
```

---

## 依赖安装命令

### 后端
```bash
cd server
npm init -y
npm install express socket.io cors
```

### 前端
```html
<!-- index.html 添加 Socket.IO 客户端 -->
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

---

## 测试检查点

### Phase 1 完成标准
- [ ] 能创建房间并获得 6 位数字房间号
- [ ] 能通过房间号加入房间
- [ ] 猜拳系统正常工作，胜者可选边
- [ ] 猜拳平局时能重新猜拳
- [ ] 双方能轮流落子，实时同步
- [ ] 技能按钮正常显示，每人限用一次
- [ ] 使用技能后对方能看到效果
- [ ] 投降按钮显示正确，确认后判负
- [ ] 悔棋请求能发送，对方能同意/拒绝
- [ ] 悔棋只能用一次，用过后按钮变灰
- [ ] 棋子样式按规则显示（对方选择的样式）
- [ ] 五连后正确显示胜负
- [ ] 能再来一局

### Phase 2 完成标准
- [ ] 断线后能自动重连
- [ ] 重连后棋盘、技能、悔棋状态正确恢复
- [ ] 超时未重连正确判负
- [ ] 线上服务器稳定运行

### Phase 3 完成标准
- [ ] BO3 模式正常工作
- [ ] 局间选边规则正确
- [ ] 对局记录能保存和查看

---

## 注意事项

1. **保持兼容**：联网模块独立，不影响现有本地对战功能
2. **渐进开发**：先实现最小可用版本，再逐步完善
3. **测试优先**：每完成一个模块立即测试
4. **代码规范**：遵循项目现有代码风格
5. **版本控制**：重要节点及时 commit
6. **技能验证**：所有技能效果必须在服务端验证，防止作弊
7. **UI 一致性**：联网 UI 风格与现有 UI 保持一致
