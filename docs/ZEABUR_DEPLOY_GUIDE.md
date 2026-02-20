# Project Lysh - Zeabur 一条龙部署指南

## 目录
1. [前置准备](#前置准备)
2. [Zeabur 账号注册](#zeabur-账号注册)
3. [部署服务端](#部署服务端)
4. [部署前端](#部署前端)
5. [配置环境变量](#配置环境变量)
6. [测试验证](#测试验证)
7. [常见问题](#常见问题)

---

## 前置准备

### 需要的账号
- GitHub 账号（用于代码托管和 Zeabur 登录）
- Zeabur 账号（可通过 GitHub 直接登录）

### 本地工具
- Git（用于代码推送）
- VS Code（可选，用于本地测试）

---

## Zeabur 账号注册

### 步骤 1: 访问 Zeabur
1. 打开 https://zeabur.com
2. 点击右上角 **"Login"** 或 **"Sign up"**

### 步骤 2: 使用 GitHub 登录
1. 选择 **"Continue with GitHub"**
2. 授权 Zeabur 访问你的 GitHub 账号
3. 登录成功后会自动跳转到 Zeabur 控制台

### 步骤 3: 创建项目
1. 点击 **"Create Project"** 创建新项目
2. 输入项目名称，例如 `lysh-game`
3. 选择地区：**Singapore (新加坡)** - 延迟最低
4. 点击确认创建

---

## 部署服务端

### 方法 A: 从 GitHub 部署（推荐）

#### 1. 将代码推送到 GitHub
```bash
# 在项目根目录执行
cd c:/Users/21518/Desktop/lysh

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "准备 Zeabur 部署"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/lysh.git

# 推送到 GitHub
git push -u origin main
```

#### 2. 在 Zeabur 部署服务
1. 进入你的 Zeabur 项目
2. 点击 **"Add Service"** → **"Git"**
3. 选择你的 GitHub 仓库 `lysh`
4. **重要**: 设置 **Root Directory** 为 `server`
   - 点击 "Advanced" 展开高级设置
   - 在 "Root Directory" 输入 `server`
5. 点击 **"Deploy"** 开始部署

### 方法 B: 使用 Docker 部署

如果需要更精确的控制，可以在 `server/` 目录创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 部署前端

### 选项 1: Zeabur 静态站点部署（推荐）

1. 在同一项目中点击 **"Add Service"** → **"Git"**
2. 再次选择同一个仓库 `lysh`
3. 配置：
   - **Root Directory**: 留空（或填 `.`）
   - 需要创建 `zeabur.yaml` 配置文件（见下文）

### 选项 2: GitHub Pages / Vercel / Netlify

前端可以部署到任何静态托管服务，只需修改服务器地址配置。

### 创建 zeabur.yaml 配置文件

在项目根目录创建 `zeabur.yaml`：

```yaml
# zeabur.yaml - 前端静态站点配置
services:
  - type: static
    name: lysh-frontend
    buildCommand: echo "No build required"
    outputDirectory: .
    routes:
      - src: /.*
        dest: /index.html
```

---

## 配置环境变量

### 服务端环境变量

在 Zeabur 的服务端服务中设置以下环境变量：

1. 进入你的服务端服务（例如 `lysh-server`）
2. 点击 **"Variables"** 标签页
3. 添加以下变量：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `ALLOWED_ORIGINS` | `https://lysh-frontend.zeabur.app,https://你的域名.com` | 允许的前端域名（逗号分隔） |
| `ZEABUR_DOMAIN` | 自动填充 | Zeabur 自动注入 |

### 配置步骤

1. **获取前端域名**
   - 部署前端后，Zeabur 会分配一个域名
   - 例如：`https://lysh-game-web-xxx.zeabur.app`

2. **设置 ALLOWED_ORIGINS**
   ```
   ALLOWED_ORIGINS=https://lysh-game-web-xxx.zeabur.app
   ```

3. **添加自定义域名（可选）**
   - 在服务设置中添加自定义域名
   - 记得更新 `ALLOWED_ORIGINS`

---

## 更新客户端配置

### 方法 1: 修改 config.js（推荐）

部署后，修改 [`js/network/config.js`](../js/network/config.js) 中的服务器地址：

```javascript
// 生产环境服务器地址（部署时修改这里！）
const PRODUCTION_SERVER_URL = 'https://你的服务器域名.zeabur.app';
```

### 方法 2: 使用环境变量

如果使用构建工具，可以通过环境变量注入。

### 方法 3: 自动检测（已内置）

代码已经内置了自动检测逻辑：
- 如果部署在同一域名下，会自动使用当前域名
- 如果 `PRODUCTION_SERVER_URL` 为空且不是 localhost，会自动检测

---

## 测试验证

### 1. 检查服务端健康状态

访问你的服务端域名：
```
https://你的服务器.zeabur.app/
```

应该看到类似响应：
```json
{
  "status": "ok",
  "name": "Project Lysh Server",
  "version": "1.0.0",
  "rooms": 0,
  "connections": 0
}
```

### 2. 测试前端连接

1. 打开前端页面
2. 打开浏览器开发者工具 (F12)
3. 查看 Console 控制台
4. 应该看到：
   ```
   [Config] Network configuration loaded
   [Config] Server URL: https://你的服务器.zeabur.app
   [Socket] Connecting to https://...
   [Socket] Connected: xxxxx
   ```

### 3. 测试联网对战

1. 在两个不同的浏览器/设备打开游戏
2. 一个创建房间，另一个加入房间
3. 验证猜拳、下棋、技能等功能

---

## 常见问题

### Q: 连接失败，显示 CORS 错误
**A:** 检查服务端的 `ALLOWED_ORIGINS` 环境变量是否包含前端域名

### Q: Socket 连接超时
**A:** 
1. 确认服务器正在运行（访问健康检查接口）
2. 检查防火墙/网络设置
3. 确认 WebSocket 支持已启用

### Q: 前端无法找到服务器
**A:** 
1. 检查 [`js/network/config.js`](../js/network/config.js) 中的 `PRODUCTION_SERVER_URL`
2. 查看浏览器控制台的连接日志

### Q: 如何查看服务器日志
**A:** 
1. 在 Zeabur 控制台进入服务
2. 点击 **"Logs"** 标签页
3. 可以看到实时日志

### Q: 如何重启服务
**A:** 
1. 进入服务详情页
2. 点击右上角的 **"Redeploy"** 按钮

---

## 快速检查清单

- [ ] GitHub 仓库已创建并推送代码
- [ ] Zeabur 项目已创建（选择新加坡节点）
- [ ] 服务端已部署（Root Directory: server）
- [ ] 服务端环境变量已配置
- [ ] 前端已部署
- [ ] config.js 中的服务器地址已更新
- [ ] 健康检查接口返回正常
- [ ] 联网对战功能测试通过

---

## 费用说明

Zeabur 免费套餐包含：
- 每月 $5 免费额度
- 适合小型项目测试使用

如需更大流量或更多资源，可考虑付费套餐。

---

## 联系支持

- Zeabur 文档：https://zeabur.com/docs
- Zeabur Discord：https://discord.gg/zeabur

---

*最后更新: 2026-02-18*
