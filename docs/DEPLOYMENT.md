# Agent-Lab Deployment Guide

Complete guide for deploying Agent-Lab v4.0.1 in development and production environments.

---

## 🎯 Overview

Agent-Lab consists of three main services:
- **Frontend UI** (React/Vite) - Port 5173
- **Agent Server** (Node.js/Express) - Port 3001  
- **RAG System** (Python/FastAPI) - Port 8000

This guide covers local development, staging, and production deployment strategies.

---

## 🚀 Development Setup

### Prerequisites

**System Requirements:**
- **Node.js 18+** (LTS recommended)
- **Python 3.8+** 
- **pnpm** (recommended) or npm
- **Git**
- **4GB RAM minimum** (8GB recommended)

**API Keys (Optional):**
- OpenAI API key for GPT integration
- Anthropic API key for Claude integration
- Email SMTP credentials for notifications

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd agent-lab

# Install dependencies
pnpm install
cd server && pnpm install && cd ..
cd ui && pnpm install && cd ..

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start all services
./start-agent-lab.sh
```

### Manual Service Start

If you prefer to start services individually:

```bash
# Terminal 1: RAG Server
cd server
python api.py

# Terminal 2: Agent Server  
cd server
pnpm run dev

# Terminal 3: Frontend UI
cd ui
pnpm dev
```

### Development Environment Variables

Create `.env` file in the project root:

```bash
# AI API Keys (optional)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Agent Lab <your-email@gmail.com>

# Development Settings
NODE_ENV=development
DEBUG=agent-lab:*
LOG_LEVEL=debug

# Database (if using custom database)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agentlab
DB_USER=postgres
DB_PASS=password
```

---

## 🏗️ Production Deployment

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Reverse Proxy  │────│   Agent Server  │
│   (Cloudflare)  │    │     (Nginx)      │    │   (Node.js)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                ┌─────────────────┐
                                │                │   RAG System    │
                                │                │   (Python)      │
                                │                └─────────────────┘
                                │
                       ┌──────────────────┐
                       │   Static Files   │
                       │   (Frontend)     │
                       └──────────────────┘
```

### Option 1: VPS/Cloud Server Deployment

#### Server Requirements

**Minimum Specs:**
- **CPU**: 2 cores
- **RAM**: 4GB  
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+

**Recommended Specs:**
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS

#### Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.9+
sudo apt install python3 python3-pip python3-venv -y

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

#### Application Deployment

```bash
# Clone and setup application
git clone <repository-url> /opt/agent-lab
cd /opt/agent-lab

# Install dependencies
pnpm install
cd server && pnpm install && cd ..
cd ui && pnpm install && cd ..

# Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Build frontend
cd ui && pnpm build && cd ..

# Create production environment file
sudo nano /opt/agent-lab/.env
```

#### Production Environment Variables

```bash
# Production .env
NODE_ENV=production
PORT=3001

# API Keys
OPENAI_API_KEY=your-production-openai-key
ANTHROPIC_API_KEY=your-production-anthropic-key

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Database (if using external DB)
DATABASE_URL=postgresql://user:pass@localhost:5432/agentlab

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn (optional)

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=15

# File Upload Limits
MAX_FILE_SIZE=50MB
UPLOAD_DIR=/opt/agent-lab/uploads
```

#### Process Management with PM2

Create PM2 ecosystem file:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'agent-server',
      script: 'server/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      cwd: '/opt/agent-lab',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/agent-lab/agent-server.error.log',
      out_file: '/var/log/agent-lab/agent-server.out.log',
      log_file: '/var/log/agent-lab/agent-server.combined.log'
    },
    {
      name: 'rag-server',
      script: 'server/api.py',
      interpreter: '/opt/agent-lab/venv/bin/python',
      cwd: '/opt/agent-lab',
      env: {
        PYTHONPATH: '/opt/agent-lab/server',
        PORT: 8000
      },
      instances: 1,
      max_memory_restart: '2G',
      error_file: '/var/log/agent-lab/rag-server.error.log',
      out_file: '/var/log/agent-lab/rag-server.out.log',
      log_file: '/var/log/agent-lab/rag-server.combined.log'
    }
  ]
};
```

Start services:

```bash
# Create log directory
sudo mkdir -p /var/log/agent-lab
sudo chown $USER:$USER /var/log/agent-lab

# Start services with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/agent-lab
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Frontend (Static Files)
    location / {
        root /opt/agent-lab/ui/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Endpoints
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Agent Execution
    location /run {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Longer timeout for agent execution
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # RAG System
    location /rag/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # RAG queries can take time
        proxy_connect_timeout 180s;
        proxy_send_timeout 180s;
        proxy_read_timeout 180s;
    }
    
    # File Upload Size
    client_max_body_size 50M;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/agent-lab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Option 2: Docker Deployment

#### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  agent-server:
    build:
      context: .
      dockerfile: Dockerfile.server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./agents:/app/agents
      - ./uploads:/app/uploads
    depends_on:
      - rag-server
    restart: unless-stopped

  rag-server:
    build:
      context: .
      dockerfile: Dockerfile.rag
    ports:
      - "8000:8000"
    volumes:
      - ./server/db:/app/db
      - ./docs:/app/docs
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - agent-server
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - frontend
    restart: unless-stopped
```

#### Dockerfile Examples

**Server Dockerfile:**
```dockerfile
# Dockerfile.server
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install -g pnpm
RUN pnpm install
RUN cd server && pnpm install

# Copy source code
COPY . .

# Build application
RUN cd server && pnpm build

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
```

**RAG Dockerfile:**
```dockerfile
# Dockerfile.rag
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY server/ ./

EXPOSE 8000

CMD ["python", "api.py"]
```

**Frontend Dockerfile:**
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies
COPY ui/package*.json ./
RUN npm install -g pnpm
RUN pnpm install

# Copy source and build
COPY ui/ .
RUN pnpm build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Start with Docker:

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🔧 Configuration Management

### Environment-Specific Configs

**Development (.env.development):**
```bash
NODE_ENV=development
DEBUG=agent-lab:*
LOG_LEVEL=debug
RATE_LIMIT_MAX=10000
```

**Staging (.env.staging):**
```bash
NODE_ENV=staging
LOG_LEVEL=info
RATE_LIMIT_MAX=5000
SENTRY_DSN=your-staging-sentry-dsn
```

**Production (.env.production):**
```bash
NODE_ENV=production
LOG_LEVEL=warn
RATE_LIMIT_MAX=1000
SENTRY_DSN=your-production-sentry-dsn
```

### Configuration Management Tools

**Using dotenv-cli:**
```bash
# Install dotenv-cli
npm install -g dotenv-cli

# Run with specific environment
dotenv -e .env.production -- node server/index.js
```

**Using PM2 with environments:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'agent-lab',
    script: 'server/index.ts',
    env_development: {
      NODE_ENV: 'development',
      DEBUG: 'agent-lab:*'
    },
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn'
    }
  }]
};
```

---

## 📊 Monitoring & Logging

### Application Monitoring

**PM2 Monitoring:**
```bash
# View process status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart services
pm2 restart all
```

**System Monitoring:**
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor system resources
htop
iotop
nethogs
```

### Log Management

**Log Rotation:**
```bash
# Install logrotate configuration
sudo nano /etc/logrotate.d/agent-lab

# Configuration
/var/log/agent-lab/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 user user
    postrotate
        pm2 reload all
    endscript
}
```

**Centralized Logging (Optional):**
```bash
# Install filebeat for log shipping
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.15.0-amd64.deb
sudo dpkg -i filebeat-7.15.0-amd64.deb

# Configure filebeat
sudo nano /etc/filebeat/filebeat.yml
```

### Error Tracking with Sentry

```bash
# Install Sentry SDK
npm install @sentry/node @sentry/tracing

# Add to server configuration
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## 🔒 Security Hardening

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### SSL/TLS Configuration

```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### API Security

**Rate Limiting:**
```typescript
// In server/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

**Input Validation:**
```typescript
import { body, validationResult } from 'express-validator';

app.post('/api/agents/create',
  body('name').isLength({ min: 1, max: 100 }).trim().escape(),
  body('description').isLength({ max: 500 }).trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

### File System Security

```bash
# Set proper permissions
sudo chown -R www-data:www-data /opt/agent-lab
sudo chmod -R 750 /opt/agent-lab
sudo chmod -R 640 /opt/agent-lab/.env*

# Secure uploaded files
sudo mkdir -p /opt/agent-lab/uploads
sudo chown www-data:www-data /opt/agent-lab/uploads
sudo chmod 750 /opt/agent-lab/uploads
```

---

## 🔄 Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/agent-lab"
mkdir -p $BACKUP_DIR

# Backup ChromaDB
tar -czf $BACKUP_DIR/chromadb_$DATE.tar.gz /opt/agent-lab/server/db/

# Backup agent files
tar -czf $BACKUP_DIR/agents_$DATE.tar.gz /opt/agent-lab/agents/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Application Backup

```bash
#!/bin/bash
# backup-app.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/agent-lab"
APP_DIR="/opt/agent-lab"

# Full application backup
tar --exclude='node_modules' \
    --exclude='ui/dist' \
    --exclude='server/db' \
    -czf $BACKUP_DIR/app_$DATE.tar.gz $APP_DIR

# Environment files
cp $APP_DIR/.env* $BACKUP_DIR/
```

### Automated Backups

```bash
# Add to crontab
sudo crontab -e

# Daily database backup at 2 AM
0 2 * * * /opt/scripts/backup-database.sh

# Weekly full backup on Sundays at 3 AM
0 3 * * 0 /opt/scripts/backup-app.sh
```

---

## 🚀 Performance Optimization

### Node.js Optimization

```bash
# PM2 cluster mode
pm2 start ecosystem.config.js --env production

# Memory optimization
export NODE_OPTIONS="--max-old-space-size=2048"
```

### Database Optimization

```python
# ChromaDB optimization
CHROMA_DB_SETTINGS = {
    "allow_reset": False,
    "anonymized_telemetry": False,
    "batch_size": 1000,
    "max_connections": 50
}
```

### Frontend Optimization

```bash
# Build with optimizations
cd ui
pnpm build

# Analyze bundle size
pnpm build-analyze

# Enable compression in Nginx
# (already included in Nginx config above)
```

---

## 🔍 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using a port
sudo netstat -tlnp | grep :3001
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

**Permission issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/agent-lab
sudo chmod -R 755 /opt/agent-lab
```

**Service not starting:**
```bash
# Check PM2 logs
pm2 logs

# Check system logs
sudo journalctl -u nginx -f
```

**High memory usage:**
```bash
# Monitor memory
free -h
sudo ps aux --sort=-%mem | head

# Restart services
pm2 restart all
```

### Health Checks

```bash
# Check service health
curl -f http://localhost:3001/health || exit 1
curl -f http://localhost:8000/health || exit 1

# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Code reviewed and tested
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] Database backups created
- [ ] Performance testing completed
- [ ] Security scan completed

### Deployment

- [ ] Services stopped gracefully
- [ ] Code deployed
- [ ] Database migrations run
- [ ] Services started
- [ ] Health checks pass
- [ ] Load balancer updated

### Post-Deployment

- [ ] Application accessible
- [ ] All features working
- [ ] Performance metrics normal
- [ ] Error rates acceptable
- [ ] Monitoring alerts configured
- [ ] Documentation updated

---

## 📚 Additional Resources

- **[PM2 Documentation](https://pm2.keymetrics.io/docs/)**
- **[Nginx Configuration](https://nginx.org/en/docs/)**
- **[Let's Encrypt Guide](https://letsencrypt.org/getting-started/)**
- **[Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)**
- **[Node.js Production Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)**

---

**Ready for production deployment?** 🚀

Choose the deployment option that best fits your infrastructure and requirements!