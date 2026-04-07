# Deployment Guide

This guide covers deploying Vipera on a remote Linux server (Ubuntu/Debian).

## Prerequisites

- A server with Node.js v20+ installed
- Open port (default: 8801 for production)
- API keys for OpenRouter and Replicate

## Step 1: Server Setup

```bash
# Install Node.js 20 (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v20.x.x
npm --version
```

## Step 2: Deploy the Application

```bash
# Clone repository (or copy files to server)
git clone https://github.com/your-org/vipera.git /opt/vipera
cd /opt/vipera

# Install dependencies
npm install

# Configure environment
cp .env.example .env.production
nano .env.production
# Set your API keys:
#   NEXT_OPENROUTER_KEY=sk-or-v1-...
#   REPLICATE_API_TOKEN=r8_...
#   PORT=8801

# Build for production
npm run build
```

## Step 3: Run with PM2 (Recommended)

PM2 keeps the app running and restarts it on crashes or reboots.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
NODE_ENV=production pm2 start server.js --name vipera

# Save the process list and enable startup on boot
pm2 save
pm2 startup
# Follow the printed instructions (copy & run the sudo command)

# Useful PM2 commands:
pm2 status          # Check if running
pm2 logs vipera     # View logs
pm2 restart vipera  # Restart after updates
pm2 stop vipera     # Stop the app
```

## Step 4: Reverse Proxy with Nginx (Optional but Recommended)

If you want to serve Vipera on port 80/443 or behind a domain:

```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/vipera`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://127.0.0.1:8801;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for LLM calls
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;

        # Increase body size for image uploads
        client_max_body_size 50M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vipera /etc/nginx/sites-enabled/
sudo nginx -t        # Test configuration
sudo systemctl reload nginx
```

For HTTPS, use [Certbot](https://certbot.eff.org/):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 5: Updating

```bash
cd /opt/vipera
git pull
npm install
npm run build
pm2 restart vipera
```

## Storage Considerations

When `NEXT_PUBLIC_SAVE_MODE=true`, generated images and scene graphs are saved to `public/temp_images/` and `public/temp_graphs/`. For a long-running demo, monitor disk usage:

```bash
du -sh public/temp_images/ public/temp_graphs/ public/temp_labels/
```

To clear cached data:

```bash
rm -rf public/temp_images/* public/temp_graphs/* public/temp_labels/*
```

## Troubleshooting

| Issue | Solution |
|---|---|
| `EACCES` permission errors | Run `sudo chown -R $USER:$USER /opt/vipera` |
| LLM calls failing | Check `NEXT_OPENROUTER_KEY` is set and valid; check `pm2 logs vipera` for details |
| Images not generating | Check `REPLICATE_API_TOKEN` is set and valid |
| Port already in use | Change `PORT` in `.env.production` or stop the conflicting process |
| Build fails with memory error | Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096" npm run build` |
| Nginx 502 Bad Gateway | Ensure PM2 process is running: `pm2 status` |
