'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const body = document.body;

  const LANGS = [
    ['auto', 'Auto detect'],
    ['plaintext', 'Plain text'],
    ['powershell', 'PowerShell'],
    ['python', 'Python'],
    ['bash', 'Bash / Shell'],
    ['json', 'JSON'],
    ['xml', 'XML / HTML'],
    ['yaml', 'YAML'],
    ['sql', 'SQL'],
    ['javascript', 'JavaScript'],
    ['typescript', 'TypeScript'],
    ['csharp', 'C#'],
    ['java', 'Java'],
    ['go', 'Go'],
    ['rust', 'Rust'],
    ['c', 'C'],
    ['cpp', 'C++'],
    ['php', 'PHP'],
    ['ruby', 'Ruby'],
    ['kotlin', 'Kotlin'],
    ['swift', 'Swift'],
    ['lua', 'Lua'],
    ['perl', 'Perl'],
    ['r', 'R'],
    ['css', 'CSS'],
    ['markdown', 'Markdown'],
    ['dockerfile', 'Dockerfile'],
    ['nginx', 'nginx'],
    ['makefile', 'Makefile'],
    ['graphql', 'GraphQL'],
  ];
  const LANG_NAME = Object.fromEntries(LANGS);
  // Auto-detect candidates: the formats this tool sees most. Niche grammars (CSS, Lua, R…) win on noise.
  const DETECT = ['powershell', 'python', 'bash', 'json', 'xml', 'yaml', 'sql', 'javascript', 'typescript',
    'csharp', 'java', 'go', 'rust', 'cpp', 'php', 'ruby', 'dockerfile', 'nginx', 'markdown'];
  const EXPIRY_SEC = { '10m': 600, '1h': 3600, '1d': 86400, '7d': 604800, '30d': 2592000 };
  const HIGHLIGHT_LIMIT = 200 * 1024;
  const MARKDOWN_LIMIT = 512 * 1024;
  const isWindows = /Win/.test(navigator.platform || navigator.userAgent);
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const el = {
    part: $('part'), partId: $('part-id'), partHost: $('part-host'),
    metaLang: $('meta-lang'), metaSize: $('meta-size'), metaLines: $('meta-lines'), status: $('status'),
    editor: $('editor'), paste: $('paste'), editGutter: $('edit-gutter'),
    viewer: $('viewer'), viewGutter: $('view-gutter'), code: $('code'),
    notice: $('notice'), noticeIcon: $('notice-icon'), noticeTitle: $('notice-title'), noticeBody: $('notice-body'),
    noticeForm: $('notice-form'), noticePw: $('notice-pw'), unlockPw: $('unlock-pw'), noticeGo: $('notice-go'),
    noticeNew: $('notice-new'), noticeError: $('notice-error'), noticeGoLabel: $('notice-go-label'),
    specGate: $('spec-gate'), gProtect: $('g-protect'), gProtectNote: $('g-protect-note'), gSize: $('g-size'),
    gLang: $('g-lang'), gProtectLabel: $('g-protect-label'), gSizeLabel: $('g-size-label'), gExpiresCell: $('g-expires-cell'), gExpires: $('g-expires'), gExpiresIn: $('g-expires-in'),
    fetchCell: $('fetch-cell'), fetchCopy: $('fetch-copy'), fetchText: $('fetch-text'), fetchNote: $('fetch-note'),
    specCreate: $('spec-create'), lang: $('lang'), langNote: $('lang-note'), expiryNote: $('expiry-note'),
    burn: $('burn'), burnState: $('burn-state'), burnNote: $('burn-note'), pw: $('pw'), pwNote: $('pw-note'),
    create: $('create'), goKey: $('go-key'),
    specView: $('spec-view'), linkCopy: $('link-copy'), linkText: $('link-text'), linkNote: $('link-note'),
    vCreated: $('v-created'), vFlags: $('v-flags'), vExpires: $('v-expires'), vExpiresIn: $('v-expires-in'),
    copyCode: $('copy-code'), rawLink: $('raw-link'), editNew: $('edit-new'),
    viewerScroll: $('viewer-scroll'), mdScroll: $('md-scroll'), md: $('md'),
    viewMode: $('view-mode'), modeRendered: $('mode-rendered'), modeSource: $('mode-source'),
  };

  let current = null; // paste being viewed: { id, content, language, expiresAt, createdAt, burn, locked, burned }
  let detected = 'plaintext';
  let statusTimer = 0;
  let tickTimer = 0;

  // ---------- formatting ----------

  const nf = new Intl.NumberFormat('en-US');
  function bytes(n) {
    if (n < 1024) return `${nf.format(n)} ${n === 1 ? 'byte' : 'bytes'}`;
    return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  }
  const lineCount = (s) => (s ? s.split('\n').length : 0);
  const dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const when = (ms) => dateFmt.format(new Date(ms)).replace(',', '');
  function span(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return `${s} s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(s / 3600);
    if (h < 24) return `${h} h ${Math.floor((s % 3600) / 60)} min`;
    const d = Math.floor(s / 86400);
    return `${d} ${d === 1 ? 'day' : 'days'} ${Math.floor((s % 86400) / 3600)} h`;
  }
  const langName = (k) => LANG_NAME[k] || k;

  function setStatus(text, kind = 'ok', ms = 4000) {
    clearTimeout(statusTimer);
    el.status.textContent = text;
    el.status.className = `meta-status ${text ? 'is-' + kind : ''}`;
    if (ms) statusTimer = setTimeout(() => { el.status.textContent = ''; el.status.className = 'meta-status'; }, ms);
  }

  function setMeta(content, language) {
    el.metaLang.textContent = langName(language);
    el.metaSize.textContent = bytes(new TextEncoder().encode(content).length);
    const n = lineCount(content);
    el.metaLines.textContent = `${nf.format(n)} ${n === 1 ? 'line' : 'lines'}`;
  }

  function gutterText(n) {
    let out = '';
    for (let i = 1; i <= Math.max(1, n); i++) out += i + '\n';
    return out;
  }

  // ---------- part number (the short code in the band) ----------

  // On bin.x99.no the wordmark is the subdomain, so the link reads as one
  // line: bin + .x99.no/ + code. Elsewhere (local dev) only the slash follows.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hostTail = location.host.startsWith('bin.') ? location.host.slice(3) : '';

  function setPart(id, animate) {
    for (const a of el.part.getAnimations({ subtree: true })) a.cancel();
    el.part.hidden = !id;
    el.partId.textContent = '';
    if (!id) {
      el.part.setAttribute('aria-label', 'No link yet');
      return;
    }
    el.partHost.textContent = `${hostTail}/`;
    for (const c of id) {
      const s = document.createElement('span');
      s.textContent = c;
      el.partId.appendChild(s);
    }
    el.part.setAttribute('aria-label', `Copy link ${location.host}/${id}`);
    el.part.title = 'Copy link';
    if (animate && !reduceMotion.matches) unfurl();
  }

  // The host wipes out from behind the wordmark, then the code stamps in.
  function unfurl() {
    const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
    el.partHost.animate([
      { clipPath: 'inset(-0.2em 100% -0.3em 0)', transform: 'translateX(-0.4em)', opacity: 0.2 },
      { clipPath: 'inset(-0.2em 0 -0.3em 0)', transform: 'none', opacity: 1 },
    ], { duration: 460, easing: ease, fill: 'backwards' });
    [...el.partId.children].forEach((s, i) => s.animate([
      { opacity: 0, transform: 'translateY(-0.4em) scale(1.3)', filter: 'blur(6px)' },
      { opacity: 1, filter: 'blur(0)', offset: 0.6 },
      { opacity: 1, transform: 'none', filter: 'none' },
    ], { duration: 520, delay: 240 + i * 70, easing: ease, fill: 'backwards' }));
    el.part.animate([
      { backgroundColor: 'rgb(255 255 255 / 0.16)' },
      { backgroundColor: 'rgb(255 255 255 / 0)' },
    ], { duration: 900, delay: 240 + el.partId.children.length * 70 + 200, easing: 'ease-out' });
  }

  // ---------- clipboard ----------

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const t = document.createElement('textarea');
      t.value = text;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch {}
      t.remove();
      return ok;
    }
  }
  const linkFor = (id) => `${location.origin}/${id}`;

  // ---------- states ----------

  function show(state) {
    body.dataset.state = state;
    if (state !== 'view') el.viewMode.hidden = true;
    el.editor.hidden = state !== 'create';
    el.specCreate.hidden = state !== 'create';
    el.viewer.hidden = state !== 'view';
    el.specView.hidden = state !== 'view';
    el.notice.hidden = state !== 'notice' && state !== 'gate';
    el.specGate.hidden = state !== 'gate';
  }

  function enterCreate(prefill = '', language = 'auto') {
    current = null;
    clearInterval(tickTimer);
    document.title = 'bin';
    setPart(null);
    el.paste.value = prefill;
    el.lang.value = LANG_NAME[language] ? language : 'auto';
    show('create');
    onPasteInput();
    updateExpiryNote();
    tickTimer = setInterval(updateExpiryNote, 30_000);
    el.paste.focus();
    el.paste.setSelectionRange(0, 0);
    el.paste.scrollTop = 0;
  }

  // ---------- create ----------

  // Cheap, decisive signals for the formats people paste most; highlight.js scoring is the fallback.
  const SIGNALS = [
    // Verb-Noun is case-sensitive so prose like "GET-kall" doesn't count; the rest is case-insensitive.
    ['powershell', /\b(Get|Set|New|Remove|Invoke|Write|Start|Stop|Restart|Import|Export|Test|Add|ConvertTo|ConvertFrom|Select|Where|ForEach)-[A-Z][a-z][A-Za-z]*\b/m, 3],
    ['powershell', /\$(?:null|true|false|_|PSScriptRoot|env:)|\s-(?:eq|ne|gt|lt|like|match|notmatch)\s|^\s*param\s*\(/mi, 3],
    ['python', /^\s*(def|class)\s+\w+.*:\s*$|^\s*(import \w+|from [\w.]+ import)|^if __name__ == |\bprint\(|^\s*elif\b.*:\s*$/m, 2],
    ['bash', /^#!.*\b(ba|z)?sh\b|^\s*(sudo|apt(-get)?|echo|export|cd|chmod|grep|systemctl) |\$\{?\w+\}?|\bfi\s*$|\bdone\s*$/m, 1],
    ['dockerfile', /^\s*FROM\s+\S+.*\n[\s\S]*^\s*(RUN|COPY|CMD|ENTRYPOINT|WORKDIR|ENV)\s/m, 4],
    ['sql', /\b(SELECT\s[\s\S]+?\sFROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|CREATE\s+(TABLE|INDEX|VIEW)|ALTER\s+TABLE)\b/i, 3],
    ['yaml', /^(---\s*$|[\w.-]+:\s*(\S.*)?$)(\n(\s*-\s|\s+[\w.-]+:|[\w.-]+:))/m, 1],
    ['markdown', /^```[\w-]*\s*$|^\s*[-*] \[[ xX]\] |^\|?(\s*:?-{3,}:?\s*\|)+|\[[^\]\n]+\]\((https?:|#|\.?\/)[^)\s]*\)|^#{2,6} \S/m, 2],
    ['markdown', /^\s*(?:[-*+]|\d+\.) .*`[^`\n]+`/m, 2], // list item with inline code
  ];
  function detect(text) {
    const t = text.trim();
    if (!t) return 'plaintext';
    if (/^[{[]/.test(t)) { try { JSON.parse(t); return 'json'; } catch {} }
    if (/^<(\?xml|!DOCTYPE|[a-zA-Z][\w:-]*[\s>/])/.test(t)) return 'xml';
    const sample = t.length > 20000 ? t.slice(0, 20000) : t;
    const scores = new Map();
    for (const [lang, re, weight] of SIGNALS) {
      const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      const hits = (sample.match(g) || []).length;
      scores.set(lang, (scores.get(lang) || 0) + hits * weight);
    }
    let best = null;
    let bestScore = 0;
    for (const [lang, score] of scores) if (score > bestScore) { best = lang; bestScore = score; }
    if (best && bestScore >= 3) return best;
    if (!window.hljs) return best || 'plaintext';
    const r = window.hljs.highlightAuto(sample, DETECT);
    return r.relevance >= 8 && r.language ? r.language : best || 'plaintext';
  }

  let detectTimer = 0;
  function onPasteInput() {
    const v = el.paste.value;
    el.editGutter.textContent = gutterText(lineCount(v));
    syncGutter();
    clearTimeout(detectTimer);
    detectTimer = setTimeout(() => {
      detected = detect(v);
      updateLangNote();
      setMeta(v, effectiveLang());
    }, 180);
    setMeta(v, effectiveLang());
  }

  const effectiveLang = () => (el.lang.value === 'auto' ? detected : el.lang.value);

  function updateLangNote() {
    if (el.lang.value !== 'auto') el.langNote.textContent = 'Set by you';
    else if (!el.paste.value.trim()) el.langNote.textContent = 'Detected when you paste';
    else el.langNote.textContent = `Detected: ${langName(detected)}`;
  }

  function syncGutter() {
    el.editGutter.style.transform = `translateY(${-el.paste.scrollTop}px)`;
  }

  const selectedExpiry = () => el.specCreate.querySelector('input[name="expires"]:checked').value;

  function updateExpiryNote() {
    const at = Date.now() + EXPIRY_SEC[selectedExpiry()] * 1000;
    el.expiryNote.textContent = `Until ${when(at)}`;
  }

  function updateBurn() {
    const on = el.burn.checked;
    el.burnState.textContent = on ? 'On' : 'Off';
    el.burnNote.textContent = on ? 'Deleted after the first view' : 'Readable until it expires';
    el.burnNote.classList.toggle('is-burn', on);
  }

  function updatePw() {
    el.pwNote.textContent = el.pw.value ? 'Reader needs this password' : 'Optional. Encrypts the paste.';
  }

  let creating = false;
  async function create(e) {
    if (e) e.preventDefault();
    if (creating) return;
    const content = el.paste.value;
    if (!content.trim()) {
      setStatus('Paste something first.', 'burn');
      el.paste.focus();
      return;
    }
    creating = true;
    el.create.disabled = true;
    el.create.querySelector('.go-label').textContent = 'Creating…';
    const language = effectiveLang();
    const payload = {
      content,
      language,
      expires: selectedExpiry(),
      burn: el.burn.checked,
      password: el.pw.value || undefined,
    };
    try {
      const res = await fetch('/api/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Could not create the paste (${res.status}).`);
      history.pushState({ id: data.id }, '', `/${data.id}`);
      el.pw.value = '';
      enterView({
        id: data.id, content, language, expiresAt: data.expiresAt, createdAt: Date.now(),
        burn: data.burn, locked: data.locked, own: true,
      }, true);
    } catch (err) {
      setStatus(err.message || 'Network error. Try again.', 'burn', 8000);
    } finally {
      creating = false;
      el.create.disabled = false;
      el.create.querySelector('.go-label').textContent = 'Create link';
    }
  }

  // ---------- view ----------

  function render(content, language) {
    el.viewGutter.textContent = gutterText(lineCount(content));
    if (window.hljs && content.length <= HIGHLIGHT_LIMIT && language !== 'plaintext') {
      try {
        const lang = window.hljs.getLanguage(language) ? language : null;
        const r = lang ? window.hljs.highlight(content, { language: lang, ignoreIllegals: true })
                       : window.hljs.highlightAuto(content, DETECT);
        el.code.innerHTML = r.value; // highlight.js escapes the source text
        return lang || r.language || 'plaintext';
      } catch {}
    }
    el.code.textContent = content;
    return language;
  }

  // Markdown pastes open rendered; the choice of Rendered/Source is remembered per browser.
  let mdMode = 'rendered';
  try { if (localStorage.getItem('bin.md') === 'source') mdMode = 'source'; } catch {}

  function highlightBlock(code, lang) {
    if (!window.hljs || !lang || !window.hljs.getLanguage(lang)) return null;
    try { return window.hljs.highlight(code, { language: lang, ignoreIllegals: true }).value; } catch { return null; }
  }

  function applyViewMode() {
    const md = !!current && current.shownLang === 'markdown' &&
      window.renderMarkdown && current.content.length <= MARKDOWN_LIMIT;
    el.viewMode.hidden = !md;
    const rendered = md && mdMode === 'rendered';
    if (rendered && !current.mdHtml) current.mdHtml = window.renderMarkdown(current.content, { highlight: highlightBlock });
    if (rendered) el.md.innerHTML = current.mdHtml; // renderMarkdown escapes all source text
    else el.md.textContent = '';
    el.mdScroll.hidden = !rendered;
    el.viewerScroll.hidden = rendered;
    el.modeRendered.setAttribute('aria-pressed', String(rendered));
    el.modeSource.setAttribute('aria-pressed', String(!rendered));
  }

  function setViewMode(mode) {
    if (mode === mdMode) return;
    mdMode = mode;
    try { localStorage.setItem('bin.md', mode); } catch {}
    applyViewMode();
    (mode === 'rendered' ? el.mdScroll : el.viewerScroll).scrollTo(0, 0);
  }

  function enterView(p, fresh) {
    current = p;
    clearInterval(tickTimer);
    document.title = `bin/${p.id}`;
    setPart(p.id, fresh);
    const shownLang = render(p.content, p.language || 'plaintext');
    p.shownLang = shownLang;
    setMeta(p.content, shownLang);
    show('view');
    applyViewMode();
    el.viewerScroll.scrollTo(0, 0);
    el.mdScroll.scrollTo(0, 0);

    el.linkText.textContent = `${location.host}/${p.id}`;
    el.linkNote.textContent = 'Click to copy';
    el.vCreated.textContent = when(p.createdAt);
    const flags = [];
    if (p.locked) flags.push('Password protected');
    if (p.burn) flags.push(p.own ? 'Burns on first view' : 'Burned on this view');
    el.vFlags.textContent = flags.join(' · ') || 'Anyone with the link';
    el.vFlags.classList.toggle('is-burn', !!p.burn);
    el.vExpires.textContent = p.burned ? 'Deleted' : when(p.expiresAt);
    const unreachable = p.burned;
    el.rawLink.hidden = unreachable || p.locked;
    el.rawLink.href = `/raw/${p.id}`;
    el.fetchCell.hidden = unreachable || p.locked;
    const rawUrl = `${location.origin}/raw/${p.id}`;
    el.fetchText.textContent = isWindows ? `irm ${rawUrl}` : `curl -s ${rawUrl}`;
    el.fetchNote.textContent = isWindows ? 'PowerShell, prints plain text' : 'Plain text. In PowerShell: irm';
    tickExpiry();
    tickTimer = setInterval(tickExpiry, 15_000);

    if (p.burned) setStatus('This paste is now deleted. Copy what you need before leaving.', 'burn', 0);
  }

  function tickExpiry() {
    if (!current) return;
    if (current.burned) { el.vExpiresIn.textContent = 'No longer on the server'; el.vExpiresIn.classList.add('is-burn'); return; }
    const left = current.expiresAt - Date.now();
    el.vExpiresIn.classList.toggle('is-burn', left < 600_000);
    el.vExpiresIn.textContent = left > 0 ? `In ${span(left)}` : 'Expired';
  }

  function notice({ kind, title, html, action, password, newLink = true }) {
    show(action ? 'gate' : 'notice');
    el.notice.classList.toggle('is-burn', kind === 'burn');
    el.specGate.classList.toggle('is-burn', kind === 'burn');
    el.noticeIcon.querySelector('use').setAttribute('href', kind === 'burn' ? '#i-flame' : kind === 'lock' ? '#i-lock' : '#i-link');
    el.noticeTitle.textContent = title;
    el.noticeBody.innerHTML = html;
    el.noticePw.hidden = !password;
    el.noticeGoLabel.textContent = action || '';
    el.noticeNew.hidden = !newLink;
    el.noticeError.textContent = '';
    el.unlockPw.value = '';
    if (password) el.unlockPw.focus();
    else if (action) el.noticeGo.focus();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function missing(id) {
    document.title = 'bin: not found';
    setPart(null);
    el.metaLang.textContent = `bin/${id}`;
    el.metaSize.textContent = 'Not on this server';
    el.metaLines.textContent = '';
    el.gProtectLabel.textContent = 'Link';
    el.gProtect.textContent = `bin/${id}`;
    el.gProtectNote.textContent = 'Checked just now';
    el.gSizeLabel.textContent = 'Status';
    el.gSize.textContent = 'Gone';
    el.gLang.textContent = 'Expired, burned or never created';
    el.gExpiresCell.hidden = true;
    notice({
      kind: 'missing',
      title: `Nothing at bin/${id}`,
      html: 'This paste has <strong>expired</strong>, was <strong>burned after reading</strong>, or never existed. Ask the sender for a new link.',
      action: 'New paste',
      newLink: false,
    });
  }

  let pendingId = null;
  async function load(id) {
    show('loading');
    body.dataset.state = 'loading';
    setPart(id);
    let res, data;
    try {
      res = await fetch(`/api/paste/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } });
      data = await res.json().catch(() => ({}));
    } catch {
      return notice({ kind: 'missing', title: 'Could not reach bin', html: 'Check your connection and reload the page.', action: '' });
    }
    if (res.status === 404) return missing(id);
    if (!res.ok) return notice({ kind: 'missing', title: 'Something went wrong', html: esc(data.error || `Error ${res.status}.`), action: '' });

    if (data.content !== undefined) return enterView(data, false);

    pendingId = id;
    document.title = `bin/${id}`;
    const lang = data.language === 'auto' ? 'Plain text' : langName(data.language);
    el.metaLang.textContent = lang;
    el.metaSize.textContent = bytes(data.size);
    el.metaLines.textContent = 'Sealed until opened';
    el.gProtectLabel.textContent = 'Protection';
    el.gSizeLabel.textContent = 'Size';
    el.gExpiresCell.hidden = false;
    el.gProtect.textContent = data.burn ? (data.locked ? 'Password + burn' : 'Burn after reading') : 'Password';
    el.gProtectNote.textContent = data.burn ? 'Deleted when opened' : 'Encrypted at rest';
    el.gSize.textContent = bytes(data.size);
    el.gLang.textContent = lang;
    el.gExpires.textContent = when(data.expiresAt);
    el.gExpiresIn.textContent = `In ${span(data.expiresAt - Date.now())}`;
    if (data.burn && data.locked) {
      notice({
        kind: 'burn', title: 'Locked, and burns on reading',
        html: `Enter the password to open it. <strong>It will be deleted from the server as soon as it opens</strong>, so copy what you need.`,
        action: 'Unlock and open', password: true, newLink: false,
      });
    } else if (data.burn) {
      notice({
        kind: 'burn', title: 'Burns after reading',
        html: `This paste can be opened <strong>once</strong>. It is deleted from the server the moment you open it, so copy what you need.`,
        action: 'Open and delete', newLink: false,
      });
    } else {
      notice({
        kind: 'lock', title: 'Password protected',
        html: 'The sender protected this paste with a password. It is stored encrypted and unlocked only with it.',
        action: 'Unlock', password: true, newLink: false,
      });
    }
  }

  async function openPending(e) {
    e.preventDefault();
    if (!pendingId) {
      history.pushState({}, '', '/');
      return enterCreate();
    }
    const password = el.unlockPw.value;
    if (!el.noticePw.hidden && !password) {
      el.noticeError.textContent = 'Enter the password.';
      el.unlockPw.focus();
      return;
    }
    el.noticeGo.disabled = true;
    try {
      const res = await fetch(`/api/paste/${encodeURIComponent(pendingId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) return missing(pendingId);
      if (!res.ok) {
        el.noticeError.textContent = data.error || `Error ${res.status}.`;
        el.unlockPw.select();
        return;
      }
      const id = pendingId;
      pendingId = null;
      enterView({ ...data, id }, false);
    } catch {
      el.noticeError.textContent = 'Network error. Try again.';
    } finally {
      el.noticeGo.disabled = false;
    }
  }

  // ---------- routing ----------

  function route() {
    const id = location.pathname.slice(1);
    if (!id) return enterCreate();
    if (current && current.id === id) return enterView(current, false);
    load(id);
  }

  // ---------- wiring ----------

  for (const [value, label] of LANGS) {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    el.lang.appendChild(o);
  }
  el.goKey.textContent = isMac ? '⌘ + Enter' : 'Ctrl + Enter';

  el.paste.addEventListener('input', onPasteInput);
  el.paste.addEventListener('scroll', syncGutter, { passive: true });
  el.lang.addEventListener('change', () => { updateLangNote(); setMeta(el.paste.value, effectiveLang()); });
  el.specCreate.addEventListener('change', (e) => { if (e.target.name === 'expires') updateExpiryNote(); });
  el.burn.addEventListener('change', updateBurn);
  el.pw.addEventListener('input', updatePw);
  el.specCreate.addEventListener('submit', create);
  el.noticeForm.addEventListener('submit', openPending);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && body.dataset.state === 'create') create(e);
  });

  async function copyLink(note) {
    if (!current) return;
    const ok = await copy(linkFor(current.id));
    setStatus(ok ? `Link copied: ${location.host}/${current.id}` : 'Copy failed. Select the link manually.', ok ? 'ok' : 'burn');
    if (note && ok) {
      el.linkNote.textContent = 'Copied';
      setTimeout(() => { el.linkNote.textContent = 'Click to copy'; }, 2000);
    }
  }
  el.part.addEventListener('click', () => copyLink(false));
  el.fetchCopy.addEventListener('click', async () => {
    const ok = await copy(el.fetchText.textContent);
    setStatus(ok ? 'Command copied' : 'Copy failed.', ok ? 'ok' : 'burn');
  });
  const narrow = window.matchMedia('(max-width: 640px)');
  const setPlaceholder = () => {
    el.paste.placeholder = narrow.matches ? 'Paste anything…' : 'Paste anything: PowerShell, Python, JSON, XML, logs, plain text…';
  };
  narrow.addEventListener('change', setPlaceholder);
  setPlaceholder();
  el.linkCopy.addEventListener('click', () => copyLink(true));
  el.modeRendered.addEventListener('click', () => setViewMode('rendered'));
  el.modeSource.addEventListener('click', () => setViewMode('source'));
  el.copyCode.addEventListener('click', async () => {
    if (!current) return;
    const ok = await copy(current.content);
    setStatus(ok ? `Code copied (${bytes(new TextEncoder().encode(current.content).length)})` : 'Copy failed.', ok ? 'ok' : 'burn');
  });
  el.editNew.addEventListener('click', () => {
    if (!current) return;
    const { content, language } = current;
    history.pushState({}, '', '/');
    enterCreate(content, language);
    setStatus('Editing a copy. Creating it gives a new link.', 'ok', 5000);
  });
  document.querySelector('.brand').addEventListener('click', (e) => {
    if (body.dataset.state === 'create') { e.preventDefault(); el.paste.focus(); return; }
    e.preventDefault();
    history.pushState({}, '', '/');
    enterCreate();
  });

  window.addEventListener('popstate', route);

  updateBurn();
  updatePw();
  route();
})();
