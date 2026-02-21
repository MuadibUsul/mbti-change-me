# Production deploy notes (Ubuntu + existing site)

This project is deployed by GitHub Actions to Ubuntu using Docker and GHCR.
It is designed to coexist with an existing website by binding only to `127.0.0.1:3001` and using Nginx reverse proxy.

## 1) Server prerequisites (once)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx
sudo systemctl enable --now docker nginx
```

## 2) GitHub Secrets required

Set these in repository settings -> Secrets and variables -> Actions:

- `SERVER_HOST`: Ubuntu public IP or domain
- `SERVER_USER`: SSH user (e.g. `ubuntu`)
- `SERVER_SSH_KEY`: private key (PEM) for that user
- `SERVER_SSH_PORT`: usually `22`
- `SERVER_APP_DIR`: e.g. `/opt/mbtichange`
- `APP_NAME`: e.g. `mbtichange` (must be unique per site on same server)
- `APP_PORT`: e.g. `3001`
- `APP_ENV`: full production `.env` content (multi-line)
- `GHCR_USERNAME`: github username with package read permission
- `GHCR_TOKEN`: PAT with at least `read:packages`

### APP_ENV example

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db-host:5432/mbtichange?schema=public
AUTH_SECRET=replace-with-long-random-string
AUTH_URL=https://mbti.yourdomain.com
```

Add any other env vars used by your app into `APP_ENV`.

## 3) Nginx config (coexist with existing site)

Create a new server block for a subdomain (recommended):

```nginx
server {
    listen 80;
    server_name mbti.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable it and reload:

```bash
sudo ln -s /etc/nginx/sites-available/mbtichange.conf /etc/nginx/sites-enabled/mbtichange.conf
sudo nginx -t
sudo systemctl reload nginx
```

Then issue TLS certificate (optional but recommended):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d mbti.yourdomain.com
```

## Coexist with another site on same Ubuntu host

Use unique values per site:

- Different `server_name` in Nginx
- Different `APP_PORT` (`3001`, `3002`, ...)
- Different `SERVER_APP_DIR` (`/opt/mbtichange`, `/opt/otherapp`)
- Different `APP_NAME` (`mbtichange`, `otherapp`)

Example:

- Site A: `APP_NAME=main-site`, `APP_PORT=3000`, `server_name=www.example.com`
- Site B: `APP_NAME=mbti-site`, `APP_PORT=3001`, `server_name=mbti.example.com`

## 4) Deploy trigger

Push to `main` branch (or run workflow manually). The workflow will:

1. lint + test + build
2. build/push image to GHCR
3. SSH to server and:
   - update compose file
   - write `.env.production`
   - run `npx prisma migrate deploy`
   - restart app container

## 5) Verify on server

```bash
cd /opt/mbtichange
sudo docker compose -f docker-compose.prod.yml ps
sudo docker logs -f mbtichange-web
```

## 6) Rollback

To rollback quickly:

```bash
cd /opt/mbtichange
export IMAGE=ghcr.io/<owner>/mbtichange:<old_sha>
sudo docker compose -f docker-compose.prod.yml up -d web
```

