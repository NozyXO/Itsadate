#!/usr/bin/env bash
# ------------------------------------------------------------------
# Builds the site and ships it to your Oracle Cloud VM.
#
# Usage (from the project root):
#   ./deploy/deploy.sh <vm-public-ip>
#
# Options via env vars:
#   VM_USER=ubuntu   (default: ubuntu — use "opc" for Oracle Linux)
#   KEY=~/.ssh/k.key (default: ~/.ssh/id_rsa)
#
# Example:
#   KEY=~/Downloads/ssh-key-2026.key ./deploy/deploy.sh 140.83.55.12
# ------------------------------------------------------------------
set -euo pipefail

HOST="${1:?Usage: ./deploy/deploy.sh <vm-public-ip>}"
VM_USER="${VM_USER:-ubuntu}"
KEY="${KEY:-$HOME/.ssh/id_rsa}"

cd "$(dirname "$0")/.."

echo "==> Building production bundle..."
npm run build

echo "==> Uploading dist/ to $VM_USER@$HOST ..."
rsync -az --delete -e "ssh -i $KEY -o StrictHostKeyChecking=accept-new" \
  dist/ "$VM_USER@$HOST:/var/www/cafe-swaraaa/"

echo ""
echo "🐧☕ Deployed! Open:  http://$HOST"
