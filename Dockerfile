# Project Lysh - Full-Stack Dockerfile
# Single service: static frontend + Node Socket.IO backend

FROM node:18-alpine

# Application root
WORKDIR /app

# Install backend dependencies first (better cache hit)
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy full project (frontend + backend)
COPY . .

# Zeabur provides PORT via env; app defaults to 3000 if not provided
EXPOSE 3000

# Start backend that also serves frontend static files
WORKDIR /app/server
CMD ["node", "index.js"]
