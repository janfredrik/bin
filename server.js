'use strict';

// bin — paste text, pick an expiry, get a short link.
// Zero dependencies: node:http, node:sqlite, node:crypto.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const env = (k, d) => (process.env[k] === undefined || process.env[k] === '' ? d : process.env[k]);
const PORT = Number(env('PORT', 8080));
const DATA_DIR = env('DATA_DIR', path.join(__dirname, 'data'));
const PUBLIC_URL = env('PUBLIC_URL', '').replace(/\/+$/, '');
const TRUST_PROXY = env('TRUST_PROXY', '1') === '1';
const MAX_PASTE_BYTES = Number(env('MAX_PASTE_KB', 512)) * 1024;
const ID_LENGTH = Math.min(8, Math.max(3, Number(env('ID_LENGTH', 4))));
const CREATE_LIMIT = Number(env('RATE_CREATE_PER_10MIN', 30));
const READ_LIMIT = Number(env('RATE_READ_PER_MIN', 120));

// Lowercase letters and digits without look-alikes (0/o, 1/l/i): easy to type and read aloud.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const ID_RE = new RegExp(`^[${ALPHABET}]{3,8}$`);
const RESERVED = new Set(['api', 'raw', 'new', 'static', 'vendor', 'health']);

const EXPIRIES = { '10m': 600, '1h': 3600, '1d': 86400, '7d': 604800, '30d': 2592000 };
const LANG_RE = /^[a-z0-9+#-]{1,24}$/;

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'bin.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS pastes (
    id         TEXT PRIMARY KEY,
    content    BLOB NOT NULL,
    language   TEXT NOT NULL DEFAULT 'auto',
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    burn       INTEGER NOT NULL DEFAULT 0,
    salt       BLOB,
    iv         BLOB,
    tag        BLOB,
    size       INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS pastes_expires ON pastes (expires_at);
`);

const q = {
  insert: db.prepare(`INSERT INTO pastes (id, content, language, created_at, expires_at, burn, salt, iv, tag, size)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  exists: db.prepare('SELECT 1 FROM pastes WHERE id = ?'),
  get: db.prepare('SELECT * FROM pastes WHERE id = ? AND expires_at > ?'),
  del: db.prepare('DELETE FROM pastes WHERE id = ?'),
  purge: db.prepare('DELETE FROM pastes WHERE expires_at <= ?'),
};

const now = () => Math.floor(Date.now() / 1000);
setInterval(() => q.purge.run(now()), 60_000).unref();
q.purge.run(now());

// ---------- ids ----------

function randomId(len) {
  const bytes = crypto.randomBytes(len * 2);
  let out = '';
  for (let i = 0; out.length < len && i < bytes.length; i++) {
    // Rejection sampling keeps the distribution uniform over the 31-char alphabet.
    if (bytes[i] < 248) out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out.length === len ? out : randomId(len);
}

function newId() {
  for (let len = ID_LENGTH; len <= 8; len++) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const id = randomId(len);
      if (!RESERVED.has(id) && !q.exists.get(id)) return id;
    }
  }
  throw new Error('id space exhausted');
}

// ---------- password encryption ----------

function deriveKey(password, salt) {
  return crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
}

function encrypt(text, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(password, salt), iv);
  const content = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return { content, salt, iv, tag: cipher.getAuthTag() };
}

function decrypt(row, password) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(password, row.salt), row.iv);
    decipher.setAuthTag(row.tag);
    return Buffer.concat([decipher.update(row.content), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// ---------- rate limiting (fixed window, in memory) ----------

const buckets = new Map();
function limited(kind, ip, limit, windowSec) {
  const key = `${kind}:${ip}`;
  const t = now();
  let b = buckets.get(key);
  if (!b || b.reset <= t) {
    b = { count: 0, reset: t + windowSec };
    buckets.set(key, b);
  }
  b.count++;
  return b.count > limit ? b.reset - t : 0;
}
setInterval(() => {
  const t = now();
  for (const [k, b] of buckets) if (b.reset <= t) buckets.delete(k);
}, 60_000).unref();

// ---------- http helpers ----------

function clientIp(req) {
  if (TRUST_PROXY) {
    const real = req.headers['x-real-ip'];
    if (real) return String(real).trim();
    const fwd = req.headers['x-forwarded-for'];
    if (fwd) return String(fwd).split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function baseUrl(req) {
  if (PUBLIC_URL) return PUBLIC_URL;
  const proto = (TRUST_PROXY && req.headers['x-forwarded-proto']) || 'http';
  const host = (TRUST_PROXY && req.headers['x-forwarded-host']) || req.headers.host || `localhost:${PORT}`;
  return `${String(proto).split(',')[0].trim()}://${String(host).split(',')[0].trim()}`;
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
};
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

function json(res, status, obj, headers = {}) {
  send(res, status, JSON.stringify(obj), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ---------- static files ----------

const PUBLIC_DIR = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};
const staticCache = new Map();
function loadStatic(rel) {
  if (staticCache.has(rel)) return staticCache.get(rel);
  const file = path.join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return null;
  let entry = null;
  try {
    const body = fs.readFileSync(file);
    entry = {
      body,
      type: TYPES[path.extname(file)] || 'application/octet-stream',
      etag: '"' + crypto.createHash('sha1').update(body).digest('base64url').slice(0, 16) + '"',
    };
  } catch {}
  if (process.env.NODE_ENV === 'production') staticCache.set(rel, entry);
  return entry;
}

function serveStatic(req, res, rel, cache = rel.startsWith('fonts/') ? 'public, max-age=31536000, immutable' : 'no-cache') {
  const f = loadStatic(rel);
  if (!f) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  if (req.headers['if-none-match'] === f.etag) return send(res, 304, '', { ETag: f.etag });
  const headers = { 'Content-Type': f.type, 'Cache-Control': cache, ETag: f.etag };
  if (f.type.startsWith('text/html')) headers['Content-Security-Policy'] = CSP;
  send(res, 200, req.method === 'HEAD' ? '' : f.body, headers);
}

// ---------- paste logic ----------

function openPaste(id, password) {
  const row = q.get.get(id, now());
  if (!row) return { status: 404, error: 'This paste does not exist or has expired.' };
  const locked = !!row.salt;
  let content;
  if (locked) {
    if (!password) return { status: 401, error: 'This paste is password protected.', locked: true, burn: !!row.burn };
    content = decrypt(row, password);
    if (content === null) return { status: 403, error: 'Wrong password.', locked: true, burn: !!row.burn };
  } else {
    content = Buffer.from(row.content).toString('utf8');
  }
  if (row.burn) q.del.run(id);
  return { status: 200, row, content };
}

async function createPaste(req, res) {
  const ip = clientIp(req);
  const wait = limited('create', ip, CREATE_LIMIT, 600);
  if (wait) return json(res, 429, { error: `Too many pastes. Try again in ${Math.ceil(wait / 60)} min.` }, { 'Retry-After': String(wait) });

  let body;
  try {
    body = JSON.parse((await readBody(req, MAX_PASTE_BYTES * 2 + 4096)).toString('utf8'));
  } catch (e) {
    if (e.status === 413) return json(res, 413, { error: `Paste is larger than ${MAX_PASTE_BYTES / 1024} KB.` });
    return json(res, 400, { error: 'Invalid request body.' });
  }

  const content = typeof body.content === 'string' ? body.content : '';
  if (!content.trim()) return json(res, 400, { error: 'Nothing to paste.' });
  const size = Buffer.byteLength(content, 'utf8');
  if (size > MAX_PASTE_BYTES) return json(res, 413, { error: `Paste is larger than ${MAX_PASTE_BYTES / 1024} KB.` });

  const ttl = EXPIRIES[body.expires] || EXPIRIES['1d'];
  const language = typeof body.language === 'string' && LANG_RE.test(body.language) ? body.language : 'auto';
  const burn = body.burn ? 1 : 0;
  const password = typeof body.password === 'string' && body.password.length ? body.password.slice(0, 256) : '';

  let stored = { content: Buffer.from(content, 'utf8'), salt: null, iv: null, tag: null };
  if (password) stored = encrypt(content, password);

  const created = now();
  const expires = created + ttl;
  const id = newId();
  q.insert.run(id, stored.content, language, created, expires, burn, stored.salt, stored.iv, stored.tag, size);

  const base = baseUrl(req);
  json(res, 201, {
    id,
    url: `${base}/${id}`,
    raw: `${base}/raw/${id}`,
    expiresAt: expires * 1000,
    burn: !!burn,
    locked: !!password,
  });
}

async function readPaste(req, res, id) {
  const ip = clientIp(req);
  const wait = limited('read', ip, READ_LIMIT, 60);
  if (wait) return json(res, 429, { error: 'Slow down.' }, { 'Retry-After': String(wait) });

  if (req.method === 'GET') {
    // Metadata only: never burns, so link unfurlers and the reveal step are safe.
    const row = q.get.get(id, now());
    if (!row) return json(res, 404, { error: 'This paste does not exist or has expired.' });
    if (row.burn || row.salt) {
      return json(res, 200, {
        id, language: row.language, size: row.size, createdAt: row.created_at * 1000,
        expiresAt: row.expires_at * 1000, burn: !!row.burn, locked: !!row.salt,
      });
    }
    return json(res, 200, {
      id, language: row.language, size: row.size, createdAt: row.created_at * 1000,
      expiresAt: row.expires_at * 1000, burn: false, locked: false,
      content: Buffer.from(row.content).toString('utf8'),
    });
  }

  // POST = open (reveals burn-after-reading pastes, unlocks password pastes).
  let password = '';
  try {
    const body = JSON.parse((await readBody(req, 4096)).toString('utf8') || '{}');
    if (typeof body.password === 'string') password = body.password;
  } catch {
    return json(res, 400, { error: 'Invalid request body.' });
  }
  if (password && limited('pw', ip, 20, 600)) return json(res, 429, { error: 'Too many password attempts. Try again later.' });
  const r = openPaste(id, password);
  if (r.status !== 200) return json(res, r.status, { error: r.error, locked: r.locked, burn: r.burn });
  json(res, 200, {
    id, language: r.row.language, size: r.row.size, createdAt: r.row.created_at * 1000,
    expiresAt: r.row.expires_at * 1000, burn: !!r.row.burn, locked: !!r.row.salt,
    burned: !!r.row.burn, content: r.content,
  });
}

function rawPaste(req, res, id) {
  const ip = clientIp(req);
  const wait = limited('read', ip, READ_LIMIT, 60);
  const text = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' };
  if (wait) return send(res, 429, 'Slow down.\n', { ...text, 'Retry-After': String(wait) });
  const password = req.headers['x-paste-password'] ? String(req.headers['x-paste-password']) : '';
  if (password && limited('pw', ip, 20, 600)) return send(res, 429, 'Too many password attempts.\n', text);
  const r = openPaste(id, password);
  if (r.status === 401) return send(res, 401, 'This paste is password protected. Send the password in the X-Paste-Password header.\n', text);
  if (r.status !== 200) return send(res, r.status, r.error + '\n', text);
  send(res, 200, req.method === 'HEAD' ? '' : r.content, { ...text, 'X-Robots-Tag': 'noindex' });
}

// ---------- router ----------

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    const m = req.method;

    if (p === '/health') return send(res, 200, 'ok', { 'Content-Type': 'text/plain' });
    if (p === '/api/paste' && m === 'POST') return await createPaste(req, res);

    let mm = p.match(/^\/api\/paste\/([^/]+)$/);
    if (mm && ID_RE.test(mm[1]) && (m === 'GET' || m === 'POST')) return await readPaste(req, res, mm[1]);

    mm = p.match(/^\/raw\/([^/]+)$/);
    if (mm && ID_RE.test(mm[1]) && (m === 'GET' || m === 'HEAD')) return rawPaste(req, res, mm[1]);

    if (m !== 'GET' && m !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });

    if (p === '/' || (ID_RE.test(p.slice(1)) && !RESERVED.has(p.slice(1)))) {
      return serveStatic(req, res, 'index.html', 'no-cache');
    }
    if (p === '/robots.txt') return serveStatic(req, res, 'robots.txt');
    if (p === '/favicon.svg') return serveStatic(req, res, 'favicon.svg');
    if (p.startsWith('/static/')) return serveStatic(req, res, p.slice(8));

    send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) json(res, 500, { error: 'Something went wrong.' });
    else res.end();
  }
});

server.listen(PORT, () => console.log(`bin listening on :${PORT}`));

const shutdown = () => server.close(() => { db.close(); process.exit(0); });
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
