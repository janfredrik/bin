# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: one small self-contained container running Node.js with zero npm dependencies (built-in `node:http`, `node:sqlite`, `node:crypto`), serving a static frontend, with SQLite on a mounted volume. Go was the first idea. Node was chosen so the build could be run and verified locally, and it still gives a tiny image with no external services. Deployed with `docker compose` and hosted behind an existing nginx reverse proxy (TLS terminates at nginx; the app honours `X-Forwarded-*` / `X-Real-IP` and listens on a plain internal HTTP port).

## Users

Anyone on the internet who needs to hand a piece of code or text to someone else fast: typically an admin or developer mid-task who has a PowerShell script, a Python snippet, an XML/JSON blob, a log excerpt or plain text in the clipboard and wants a link to drop into chat, a ticket or a terminal. The owner runs the instance; visitors need no account.

## Product Purpose

Paste text, choose how long it should live, get a very short link. Success is: clipboard to shareable link in seconds, and the recipient can read, copy or fetch the raw content without friction.

## Positioning

Paste-only and short-link-first: links are 3–4 characters (e.g. `/k7Qx`) so they can be typed by hand or read aloud, and every paste has a raw endpoint suitable for `curl` or `Invoke-WebRequest`. Self-hosted, so the owner controls retention.

## Operating Context

- Content arrives by paste only; there is no file upload.
- Common content types: PowerShell, plain text, Python, XML, JSON, and many other languages/formats.
- Links are shared in chat, tickets, email and terminals; raw fetch is a first-class use, not an afterthought.
- The interface is in English.

## Capabilities and Constraints

- The paste area is the dominant element of the create page; options are secondary.
- Expiry options: 10 minutes, 1 hour, 1 day, 7 days, 30 days. No permanent pastes.
- Short IDs of 3–4 characters; collisions must be handled and the space grown if it fills.
- Syntax highlighting on the view page, by chosen or detected language.
- Raw view (plain text endpoint) and a copy button.
- Optional per-paste: burn after reading (deleted after first view) and password protection (reader must enter a password).
- Open to the public: anyone can create pastes, so the service needs rate limiting, a maximum paste size, and automatic purging of expired content.
- Name: **bin** (decided). Domain: open.

## Evidence on Hand

None yet. No logo, name, users or usage data exist; future work must not fabricate any.

## Product Principles

1. The paste is the product: maximum room for content, minimum ceremony around it.
2. Short links are a promise: never longer than needed, always typeable.
3. Raw is first-class: anything readable in the browser is fetchable from a terminal.
4. Ephemeral by design: everything expires, and burn/password are opt-in, never in the way.
5. Simple to operate: one compose file, one volume, sane behaviour behind a reverse proxy.

## Accessibility & Inclusion

Must be fully keyboard-operable (paste, choose options and submit without a mouse; a submit shortcut such as Ctrl/Cmd+Enter). Code must stay legible with a monospace face and sufficient contrast in both light and dark modes.
