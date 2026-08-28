#!/usr/bin/env bash
# ------------------------------------------------------------------
# One-time setup ON the Oracle Cloud Always-Free VM (Ubuntu 22.04+).
# Installs Nginx and serves /var/www/cafe-swaraaa on port 80.
#
# Run it from your laptop like this (no need to copy it over first):
#   ssh -i ~/.ssh/your-key.key ubuntu@<vm-public-ip> 'bash -s' < deploy/server-setup.sh
# ------------------------------------------------------------------
set -euo pipefail

echo "==> Installing nginx + rsync..."
sudo apt-get update -y
sudo apt-get install -y nginx rsync

echo "==> Preparing web folder..."
sudo mkdir -p /var/www/cafe-swaraaa
sudo chown -R "$USER:$USER" /var/www/cafe-swaraaa

echo "==> Writing nginx site config..."
sudo tee /etc/nginx/sites-available/cafe-swaraaa > /dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/cafe-swaraaa;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;

    # single-page app fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # hashed build assets can be cached for a week
    location ~* \.(js|css|svg|png|jpg|jpeg|ico|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/cafe-swaraaa /etc/nginx/sites-enabled/cafe-swaraaa
sudo rm -f /etc/nginx/sites-enabled/default

echo "==> Enabling nginx..."
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# Open the firewall if it is active (Ubuntu images usually have ufw off,
# Oracle Linux uses iptables instead — see DEPLOY.md troubleshooting).
if command -v ufw >/dev/null 2>&1 && sudo ufw status 2>/dev/null | grep -q "Status: active"; then
  echo "==> Opening ports 80/443 in ufw..."
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
fi

IP="$(hostname -I | awk '{print $1}')"
echo ""
echo "✅ Server ready! Nginx is serving /var/www/cafe-swaraaa"
echo "   Local check:  curl -I http://localhost"
echo "   Public (after security-list step):  http://$IP"
