# Multi-stage build for efficiency
FROM golang:1.21-alpine AS go-builder
WORKDIR /app
# Copy backend Go files
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/main.go ./
RUN go build -o server main.go

FROM node:18-alpine AS frontend-builder
WORKDIR /app
# Copy frontend files with correct path
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/index.html frontend/vite.config.ts frontend/tsconfig*.json frontend/tailwind.config.js frontend/postcss.config.js ./
COPY frontend/src ./src
RUN npm run build

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
COPY models/model.pkl models/features.txt models/

# Create supervisord config
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
stderr_logfile_maxbytes=0\n\
\n\
[program:mlserver]\n\
command=python model_server.py\n\
environment=PORT=5001\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0' > /etc/supervisor/conf.d/supervisord.conf

# Expose port
EXPOSE 8080

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]