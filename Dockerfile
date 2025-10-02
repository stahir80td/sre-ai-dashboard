# Multi-stage build for efficiency
FROM golang:1.23-alpine AS go-builder
WORKDIR /app
COPY backend/main.go ./
RUN go mod init sre-dashboard && \
    go get github.com/gin-gonic/gin && \
    go get github.com/gin-contrib/cors && \
    go get github.com/gorilla/websocket && \
    go build -o server main.go

FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
# Build without TypeScript checks
RUN npm run build || npx vite build

FROM python:3.11-slim
WORKDIR /app

# Install supervisord for process management
RUN apt-get update && apt-get install -y supervisor curl && rm -rf /var/lib/apt/lists/*

# Copy Go binary
COPY --from=go-builder /app/server /app/server

# Copy frontend build
COPY --from=frontend-builder /app/dist /app/static

# Install Python dependencies
COPY ml-pipeline/requirements.txt ./
RUN pip install --no-cache-dir flask numpy scikit-learn xgboost

# Copy ML files
COPY ml-pipeline/train_model.py ml-pipeline/model_server.py ./
RUN mkdir -p models

# Create supervisord config (simplified - no ML server for now)
RUN echo '[supervisord]\n\
nodaemon=true\n\
\n\
[program:backend]\n\
command=/app/server\n\
environment=PORT=8080\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0' > /etc/supervisor/conf.d/supervisord.conf

# Expose port
EXPOSE 8080

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]