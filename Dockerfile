# Project Lysh - Full-Stack Dockerfile
# 前端静态文件 + Node.js WebSocket 后端，一个镜像搞定

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 先复制 server 的 package 文件并安装依赖（利用 Docker 缓存层）
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# 复制整个项目（前端 + 后端）
COPY . .

# 暴露端口（Zeabur 通过 PORT 环境变量指定）
EXPOSE 3000

# 从 server 目录启动
WORKDIR /app/server
CMD ["node", "index.js"]
