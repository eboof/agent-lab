// PM2 Ecosystem Configuration for Agent-Lab
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'agent-lab-server',
      script: 'ts-node',
      args: 'index.ts',
      cwd: './server',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: './logs/server.log',
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      restart_delay: 1000,
      watch: false,
      instances: 1
    },
    {
      name: 'agent-lab-rag',
      script: 'python',
      args: 'api.py',
      cwd: './server',
      interpreter: 'python',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_file: './logs/rag.log',
      error_file: './logs/rag-error.log', 
      out_file: './logs/rag-out.log',
      restart_delay: 1000,
      watch: false,
      instances: 1
    }
  ]
};