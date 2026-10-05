# Deploying to a VPS

Advanced self-hosting guidance, not a tested managed-cloud release. Read
[CLOUD-ACCESS.md](CLOUD-ACCESS.md) for current limitations and the future phase.

Run this locally first (`npm start`) and confirm exports work. Then host it when you want
it reachable from anywhere or shared with a team.

> ⚠️ **The studio ships with no authentication.** It is built to bind to `127.0.0.1`.
> The moment it is reachable from the internet, anyone can render files on your box.
> **Step 5 (auth) is not optional.**

---

## 0. Pick a box

| Templates | Concurrency | Spec |
|---|---|---|
| < 50 | 1 person | 2 vCPU / 4 GB |
| 50 to 200 | small team | 4 vCPU / 8 GB |
| 200+ | shared/agency | 8 vCPU / 16 GB + object storage |

Headless Chrome is the memory hog: budget ~500 MB per concurrent render. Ubuntu 22.04+ LTS.

---

## 1. System dependencies

```bash
sudo apt update && sudo apt install -y curl git ffmpeg fonts-liberation
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs

# Chrome + the shared libs headless needs
wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y ./google-chrome-stable_current_amd64.deb
```

- [ ] `google-chrome --version` prints a version
- [ ] `ffmpeg -version` prints a version (only needed for video export)
- [ ] Install any **custom brand fonts** into `/usr/share/fonts/` + run `fc-cache -fv`
      (self-hosted fonts render identically; Google Fonts requires outbound network)

## 2. Deploy the app

```bash
sudo adduser --system --group --home /srv/studio studio
sudo -u studio git clone <your-fork> /srv/studio/app
cd /srv/studio/app && sudo -u studio npm ci --omit=dev && sudo -u studio npm run build
```

- [ ] `build/manifest.json` exists
- [ ] The app directory is writable by the `studio` user, including configuration saves, staged build directories, `uploads/`, `.cache/`, `build/` and `exports/`

## 3. Run it as a service

`/etc/systemd/system/studio.service`:

```ini
[Unit]
Description=Brand Foundry
After=network.target

[Service]
Type=simple
User=studio
WorkingDirectory=/srv/studio/app
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=4800
Environment=CHROME_PATH=/usr/bin/google-chrome
ExecStart=/usr/bin/node server.mjs
Restart=always
RestartSec=5
MemoryMax=6G

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now studio
```

- [ ] `systemctl status studio` is active
- [ ] `curl localhost:4800/api/manifest` returns JSON
- [ ] **Keep `HOST=127.0.0.1`** so only the reverse proxy can reach it

## 4. Reverse proxy + TLS

Current gap: Brand Settings compares the browser origin with the backend protocol.
TLS termination can cause settings requests to return 403. Implement and test
proxy-aware origin handling with a narrowly trusted proxy; this example alone
does not resolve it. Preserve origin validation.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

`/etc/nginx/sites-available/studio`:

```nginx
server {
  server_name studio.yourdomain.com;
  client_max_body_size 30M;              # image uploads

  location / {
    proxy_pass http://127.0.0.1:4800;
    proxy_set_header Host $host;
    proxy_read_timeout 900s;             # video renders are slow
  }
  # thumbnails are content-hashed and immutable
  location /thumbs/ { proxy_pass http://127.0.0.1:4800; expires 1y; add_header Cache-Control "public, immutable"; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d studio.yourdomain.com
```

- [ ] HTTPS loads the dashboard
- [ ] `client_max_body_size` is above your largest upload
- [ ] `proxy_read_timeout` is above your slowest render

## 5. Lock it down (required)

Pick one:

- **Basic auth** (fastest): `sudo htpasswd -c /etc/nginx/.htpasswd you`, then in the nginx
  `server` block so every location inherits it: `auth_basic "Studio"; auth_basic_user_file /etc/nginx/.htpasswd;`
- **Identity proxy** (best for teams): Cloudflare Access or oauth2-proxy. A public tunnel alone does not provide authentication
- **Private network only**: skip public DNS, reach it over Tailscale/WireGuard

Also:

- [ ] `sudo ufw allow 22,80,443/tcp && sudo ufw enable`. Never expose 4800
- [ ] Unattended security upgrades on
- [ ] Uploads are size- and MIME-limited (already enforced in `server.mjs`)

## 6. Operate it

- [ ] **Deploys rebuild**: `git pull && npm ci --omit=dev && npm run build && systemctl restart studio`
- [ ] **Warm the cache** after deploy: the server warms thumbnails at boot; watch
      `journalctl -u studio -f` for the warming line
- [ ] **Prune exports.** They accumulate:
      `find /srv/studio/app/exports -type f -mtime +7 -delete` (daily cron)
- [ ] **Back up** `templates/`, `uploads/` and `studio.config.json`; keep exports until delivered.
      `build/` and `.cache/` are regenerable; unsaved per-export variables may be needed to reproduce an export.
- [ ] **Monitor** disk and memory; a runaway Chrome is the usual failure

---

## Optional: Docker

Containerizing solves the Chrome-dependency mess. Sketch:

```dockerfile
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y chromium ffmpeg fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
ENV CHROME_PATH=/usr/bin/chromium HOST=0.0.0.0 PORT=4800
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 4800
CMD ["node", "server.mjs"]
```

Run with `--shm-size=1g` (Chrome crashes on the default 64 MB) and mount volumes for
`exports/`, `uploads/`, and `.cache/`. Put the same auth in front of it.
The server binds to `HOST`, but internal screenshot requests use loopback when
bound to `0.0.0.0` or `::`. The container recipe itself still requires deployment testing.

---

## Scaling later

- Move `exports/` to S3/R2 and return signed URLs instead of local paths
- Put video renders on a queue (BullMQ + Redis); the server currently allows one at a time
- Split render workers onto their own box; the dashboard is tiny, Chrome is not
- Serve `/thumbs` and `/build` from a CDN
