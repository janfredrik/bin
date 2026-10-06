# bin

Paste text, pick an expiry, get a short link like `https://bin.example.com/k7qx`.

- Paste only: PowerShell, Python, JSON, XML, logs, plain text and ~40 other languages, with auto-detection and syntax highlighting
- Markdown pastes open rendered (headings, lists, task lists, tables, code blocks, links), with a Rendered / Source switch. Raw HTML is shown as text, never run
- Expiry: 10 min, 1 hour, 1 day, 7 days, 30 days (expired pastes are purged every minute)
- Optional **burn after reading** (deleted on first open) and **password** (stored encrypted, AES-256-GCM + scrypt)
- Raw text at `/raw/<id>` for `curl` / `Invoke-RestMethod`
- 4-character IDs from `23456789abcdefghjkmnpqrstuvwxyz` (no look-alikes), grown automatically on collision
- Zero npm dependencies: Node 24 (`node:http`, `node:sqlite`, `node:crypto`), one SQLite file on a volume

## Run with Docker Compose

```bash
docker compose pull && docker compose up -d
```

The image `ghcr.io/janfredrik/bin:latest` is built for amd64 and arm64 by GitHub Actions ([.github/workflows/docker.yml](.github/workflows/docker.yml)) on every push to `main`. Tags `v*` also publish a version tag. To build locally instead: `docker build -t ghcr.io/janfredrik/bin:latest .`

The container listens on `127.0.0.1:8080` and stores data in the `bin-data` volume.

## nginx

See [nginx.example.conf](nginx.example.conf). The important parts:

```nginx
client_max_body_size 2m;
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
}
```

If nginx runs in Docker on the same network, drop the `ports:` mapping and proxy to `http://bin:8080`.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `PUBLIC_URL` | *(empty)* | Base URL for generated links; empty = derived from `X-Forwarded-*` |
| `TRUST_PROXY` | `1` | Trust `X-Real-IP` / `X-Forwarded-*` (set `0` if exposed directly) |
| `ID_LENGTH` | `4` | Starting ID length (3–8) |
| `MAX_PASTE_KB` | `512` | Maximum paste size |
| `RATE_CREATE_PER_10MIN` | `30` | Pastes per IP per 10 minutes |
| `RATE_READ_PER_MIN` | `120` | Reads per IP per minute |

## Terminal use

```bash
curl -s https://bin.example.com/raw/k7qx
```

```powershell
irm https://bin.example.com/raw/k7qx
# password-protected paste
irm https://bin.example.com/raw/k7qx -Headers @{ 'X-Paste-Password' = 'secret' }
```

Create from a terminal:

```bash
jq -Rs '{content: ., expires: "1d"}' script.ps1 | curl -s -H 'content-type: application/json' -d @- https://bin.example.com/api/paste
```

## Local development

```bash
node --disable-warning=ExperimentalWarning server.js   # http://localhost:8080
```
