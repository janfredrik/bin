<div align="center">

<img src="public/favicon.svg" alt="bin logo" width="72" height="72">

# bin

[![Docker image](https://img.shields.io/github/actions/workflow/status/janfredrik/bin/docker.yml?branch=main&label=docker%20image&style=flat-square)](https://github.com/janfredrik/bin/actions/workflows/docker.yml)
[![GHCR](https://img.shields.io/badge/ghcr.io-janfredrik%2Fbin-0b4f8a?style=flat-square&logo=docker&logoColor=white)](https://github.com/janfredrik/bin/pkgs/container/bin)
![Node.js 24](https://img.shields.io/badge/node-24-339933?style=flat-square&logo=node.js&logoColor=white)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-blue?style=flat-square)

Paste text, pick an expiry, get a link short enough to read aloud.

[Features](#features) • [Getting started](#getting-started) • [Reverse proxy](#reverse-proxy) • [Configuration](#configuration) • [Terminal use](#terminal-use) • [API](#api)

</div>

**bin** is a small, self-hosted pastebin for handing a script, a JSON blob or a log excerpt to someone else in seconds. You paste, choose how long it lives, and get a link like `https://bin.example.com/k7qx`. The person you send it to can read it in the browser with syntax highlighting, copy it, or fetch the raw text from a terminal.

It runs as one container with no npm dependencies and stores everything in a single SQLite file.

## Features

- **Short links**: 4-character IDs from an alphabet without look-alikes (`0/o`, `1/l/i`), so they are easy to type. The ID length grows on its own if the space fills up.
- **Syntax highlighting** for PowerShell, Python, JSON, XML, logs and about 40 other languages, with automatic detection.
- **Rendered Markdown**: Markdown pastes open rendered (headings, lists, task lists, tables, code blocks, links), with a Rendered / Source switch. Raw HTML is shown as text and never run.
- **Ephemeral by design**: pastes expire after 10 minutes, 1 hour, 1 day, 7 days or 30 days. Expired pastes are purged every minute. There are no permanent pastes.
- **Burn after reading**: optionally delete a paste the first time it is opened.
- **Password protection**: optionally encrypt a paste at rest with AES-256-GCM, using a key derived from the password with scrypt.
- **Raw first**: every paste is available as plain text at `/raw/<id>` for `curl` and `Invoke-RestMethod`.
- **Keyboard friendly**: paste, set options and submit with <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd>, without touching the mouse. Light and dark themes follow the system setting.
- **Safe to expose**: per-IP rate limits, a size cap, a strict Content Security Policy and `noindex` on every page.

## Getting started

### Docker Compose

The image is published to `ghcr.io/janfredrik/bin` for `linux/amd64` and `linux/arm64`. Grab [docker-compose.yml](docker-compose.yml), then run:

```bash
docker compose pull && docker compose up -d
```

bin now listens on `127.0.0.1:8080` and keeps its data in the `bin-data` volume. Put a reverse proxy in front of it to serve it publicly (see [Reverse proxy](#reverse-proxy)).

> [!NOTE]
> GitHub Actions builds `latest` on every push to `main`. Pushing a `v*` tag also publishes a version tag, such as `1.2.0`. To build the image yourself, run `docker build -t ghcr.io/janfredrik/bin:latest .`.

### Run locally

You need [Node.js 24](https://nodejs.org) or later, which provides the built-in `node:sqlite` module. There is nothing to install:

```bash
node --disable-warning=ExperimentalWarning server.js
```

Open http://localhost:8080. Pastes are stored in `./data/bin.db`.

## Reverse proxy

bin speaks plain HTTP and expects TLS to end at a reverse proxy. It reads `X-Forwarded-Proto` / `X-Forwarded-Host` to build links and `X-Real-IP` / `X-Forwarded-For` for rate limiting. A complete nginx site is in [nginx.example.conf](nginx.example.conf). These are the important parts:

```nginx
client_max_body_size 2m;   # a little above MAX_PASTE_KB

location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
}
```

If nginx runs in Docker on the same network, remove the `ports:` mapping from the compose file and proxy to `http://bin:8080` instead.

> [!TIP]
> Behind Cloudflare, every request reaches nginx from a Cloudflare edge IP, so all visitors would share one rate-limit bucket. The example config restores the real client IP from `CF-Connecting-IP` with `set_real_ip_from`, trusting only Cloudflare's ranges.

> [!IMPORTANT]
> If you expose bin directly without a proxy, set `TRUST_PROXY=0`. Otherwise clients can spoof `X-Forwarded-*` headers to get around rate limits or change the generated links.

## Configuration

Set these environment variables in `docker-compose.yml` or your shell:

| Variable | Default | Description |
|---|---|---|
| `PUBLIC_URL` | *(empty)* | Base URL for generated links. When empty, it is derived from the `X-Forwarded-*` headers. |
| `TRUST_PROXY` | `1` | Trust `X-Real-IP` / `X-Forwarded-*`. Set to `0` when exposed directly. |
| `ID_LENGTH` | `4` | Starting length of paste IDs (3–8). |
| `MAX_PASTE_KB` | `512` | Maximum paste size in KB. |
| `RATE_CREATE_PER_10MIN` | `30` | Pastes one IP can create per 10 minutes. |
| `RATE_READ_PER_MIN` | `120` | Reads one IP can make per minute. |
| `PORT` | `8080` | HTTP port to listen on. |
| `DATA_DIR` | `./data` (`/data` in the image) | Directory for the SQLite database. |

## Terminal use

Fetch a paste:

```bash
curl -s https://bin.example.com/raw/k7qx
```

```powershell
irm https://bin.example.com/raw/k7qx

# Password-protected paste
irm https://bin.example.com/raw/k7qx -Headers @{ 'X-Paste-Password' = 'secret' }
```

Create a paste from a file:

```bash
jq -Rs '{content: ., expires: "1d"}' script.ps1 \
  | curl -s -H 'content-type: application/json' -d @- https://bin.example.com/api/paste
```

> [!WARNING]
> Fetching `/raw/<id>` opens the paste, so a burn-after-reading paste is deleted on the first `curl`. In the browser, these pastes wait behind an "Open and delete" button, so link previews in chat apps don't burn them.

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/paste` | Create a paste. Returns `id`, `url`, `raw`, `expiresAt`, `burn` and `locked`. |
| `GET` | `/api/paste/<id>` | Get metadata, plus the content for pastes that are neither burned on read nor password-protected. Never burns. |
| `POST` | `/api/paste/<id>` | Open a paste. Body: `{"password": "…"}` when needed. Burns burn-after-reading pastes. |
| `GET` | `/raw/<id>` | Plain-text content. Send the password in the `X-Paste-Password` header. |
| `GET` | `/health` | Returns `ok`. Used by the container health check. |

The body for `POST /api/paste` accepts these fields:

```json
{
  "content": "Write-Host 'hello'",
  "expires": "10m | 1h | 1d | 7d | 30d",
  "language": "auto",
  "burn": false,
  "password": ""
}
```

Only `content` is required. `expires` defaults to `1d` and `language` to `auto`.

> [!NOTE]
> The server encrypts password-protected pastes and does not store the password. Encryption happens on the server, though, so the password does reach it in transit: this is protection at rest, not end-to-end encryption.

## How it's built

- **Server**: one file, [server.js](server.js), using only Node built-ins (`node:http`, `node:sqlite`, `node:crypto`).
- **Frontend**: static HTML, CSS and vanilla JS in [public/](public), with [highlight.js](https://highlightjs.org) vendored and a small built-in Markdown renderer. No build step.
- **Storage**: a single SQLite database in WAL mode. Rate limits are kept in memory.
