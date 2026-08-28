# ☕🐧 Host café swaraaa on Oracle Cloud — Free Tier (forever)

The site is **100% static** (HTML + CSS + JS built into `dist/`), so the
cheapest and most reliable home for it is an **Always Free VM running Nginx**.
Oracle's Always Free tier never expires and never asks for a card charge:

- up to **4 ARM Ampere cores / 24 GB RAM** (VM.Standard.A1.Flex), or
- 2 × AMD micro VMs (VM.Standard.E2.1.Micro)

Everything below fits in the free tier.

---

## Step 1 — Create the Always Free VM (≈ 5 min)

1. Sign in at [cloud.oracle.com](https://cloud.oracle.com) (create an account
   if you don't have one — you need an email + any credit/debit card for
   identity verification; you will **not** be charged for Always Free shapes).
2. **Menu → Compute → Instances → Create instance**.
3. Name it `cafe-swaraaa`.
4. **Image and shape → Edit**:
   - Image: **Ubuntu 22.04** (or 24.04) — Canonical Ubuntu.
   - Shape: **Change shape → Ampere → VM.Standard.A1.Flex** → 1 OCPU / 6 GB
     (or the AMD **E2.1.Micro**). Anything marked **"Always Free eligible"** works.
5. **Add SSH keys**: *Generate a key pair* → **Save Private Key**. Keep that
   `.key` file safe — it's your only way in.
6. **Networking**: keep the defaults (a new VCN + public subnet are created).
7. Click **Create** and wait for **Provisioning → Running**. Copy the
   **Public IP address**.

> 💡 **Tip — keep a permanent IP:** free VMs get an *ephemeral* public IP that
> can change on reboot. On the instance page, next to *Public IP address*,
> click **Edit → Create reserved IP** (still free) so your URL never changes.

## Step 2 — Open port 80 in the VCN security list

This is the #1 reason "my site won't load":

1. On the instance page, click the **Subnet** link.
2. Click the **Security List** (e.g. *Default Security List*).
3. **Add Ingress Rules** — one rule:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: **TCP**, Destination Port Range: **80**
   - (add a second one for **443** if you plan to add HTTPS later)
4. Save. Takes effect immediately.

## Step 3 — Set up the server (one command)

From this project folder on your laptop:

```bash
ssh -i ~/Downloads/your-key.key ubuntu@<vm-public-ip> 'bash -s' < deploy/server-setup.sh
```

(If you chose an **Oracle Linux** image instead of Ubuntu, SSH in as
`opc@...` and install with `sudo dnf install -y nginx rsync`, then copy
`deploy/server-setup.sh`'s nginx block into
`/etc/nginx/conf.d/cafe-swaraaa.conf`.)

This installs Nginx, creates `/var/www/cafe-swaraaa`, writes the site config,
and opens the firewall. You should end with `✅ Server ready!`.

## Step 4 — Deploy!

```bash
KEY=~/Downloads/your-key.key ./deploy/deploy.sh <vm-public-ip>
```

That's it — the script runs `npm run build` and syncs `dist/` to the VM.
Open **`http://<vm-public-ip>`** and watch Swaraaa ask the question. 🐧

Every future change is just that one command again.

---

## Optional — custom domain + HTTPS

1. Buy/point any domain's **A record** at your VM's public IP (or use a free
   subdomain service like [nip.io](https://nip.io) for testing:
   `http://1-2-3-4.nip.io` works instantly with no setup).
2. On the VM:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot edits the nginx config, installs a free Let's Encrypt certificate,
and auto-renews it. (Port **443** must be open in the security list — see
Step 2.)

---

## Alternative — no VM at all (Object Storage static hosting)

If you'd rather not manage a machine:

1. **Menu → Storage → Buckets → Create Bucket** (name it `cafe-swaraaa`,
   storage tier: *Standard*).
2. Bucket details → **Edit Visibility → Public**.
3. Bucket details → bottom: **Static Website** → enable.
4. Upload everything inside `dist/` (not the folder itself) into the bucket.
5. Use the URL shown under *Static Website* — done.

Caveat: the object-storage URL is long and ugly, which is why the VM + Nginx
route above is nicer for a portfolio link.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Works with `curl http://localhost` **on the VM**, but not from your laptop | Security list (Step 2). 90% of the time it's the missing port-80 ingress rule. |
| Still blocked after the security list | Firewall on the box: Ubuntu → `sudo ufw allow 80/tcp`; Oracle Linux → `sudo firewall-cmd --permanent --add-service=http && sudo firewall-cmd --reload` (or `sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT`) |
| `Permission denied (publickey)` when SSH'ing | Wrong user or key: Ubuntu images use `ubuntu@`, Oracle Linux uses `opc@`, and `-i` must point at the private `.key` you downloaded in Step 1. |
| `403 Forbidden` after deploying | File permissions: `sudo chown -R $USER /var/www/cafe-swaraaa && sudo chmod -R a+rX /var/www/cafe-swaraaa`, then `sudo systemctl reload nginx` |
| Google Calendar button does nothing when hosted | Popup blockers can swallow `window.open` after a redirect — the site's "It's a date!" screen also shows a direct **Open Google Calendar** link as backup. |

## Updating the site later

```bash
KEY=~/Downloads/your-key.key ./deploy/deploy.sh <vm-public-ip>
```

Same one-liner, forever, for free. ☕
