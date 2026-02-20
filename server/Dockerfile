# Project Lysh Server - Dockerfile
# 用于 Docker 容器化部署

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（生产模式）
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口（Zeabur 会通过 PORT 环境变量指定）
EXPOSE 3000

# 启动服务
CMD ["npm", "start"]
