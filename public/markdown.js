'use strict';

// Small GitHub-flavoured Markdown renderer. Every piece of source text is escaped; raw HTML in a
// paste is shown as text, never parsed. Only http(s), mailto, relative and #fragment links survive.
// Images are shown as links, because the CSP (img-src 'self') would block remote images anyway.
window.renderMarkdown = (() => {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

  const RE = {
    fence: /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)[^`]*$/,
    heading: /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/,
    hr: /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/,
    quote: /^ {0,3}> ?/,
    item: /^( {0,3})([-*+]|\d{1,9}[.)])([ \t]+|$)/,
    setext: /^ {0,3}(=+|-+)[ \t]*$/,
    tableSep: /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/,
    indented: /^(?: {4}|\t)/,
    blank: /^[ \t]*$/,
  };

  function safeUrl(raw) {
    const url = raw.trim().replace(/[\u0000-\u001f\u007f]/g, '');
    if (!url) return null;
    if (url.startsWith('#')) return `#md-${slugify(decodeSafe(url.slice(1)))}`;
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url);
    if (scheme && !/^(https?|mailto)$/i.test(scheme[1])) return null;
    return url;
  }
  function decodeSafe(s) { try { return decodeURIComponent(s); } catch { return s; } }
  function slugify(s) {
    return s.toLowerCase().trim().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s+/g, '-');
  }

  // ---------- inline ----------

  const PUNCT = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;

  function findClose(s, from, delim) {
    for (let j = s.indexOf(delim, from); j !== -1; j = s.indexOf(delim, j + 1)) {
      if (s[j - 1] === '\\' || /\s/.test(s[j - 1])) continue;
      if (delim[0] === '_' && /[\p{L}\p{N}]/u.test(s[j + delim.length] || '')) continue;
      if (delim.length === 1 && s[j + 1] === delim) { j++; continue; }
      return j;
    }
    return -1;
  }

  // [text](url "title") starting at s[i] === '['; returns { text, url, end } or null.
  function parseLink(s, i) {
    let depth = 0;
    let j = i;
    for (; j < s.length; j++) {
      const c = s[j];
      if (c === '\\') { j++; continue; }
      if (c === '`') { const k = s.indexOf('`', j + 1); if (k !== -1) j = k; continue; }
      if (c === '[') depth++;
      else if (c === ']' && --depth === 0) break;
    }
    if (depth !== 0 || s[j + 1] !== '(') return null;
    const m = /^\(\s*(<[^>\n]*>|[^\s()]*(?:\([^\s()]*\)[^\s()]*)*)(?:\s+("[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/.exec(s.slice(j + 1));
    if (!m) return null;
    const url = m[1].startsWith('<') ? m[1].slice(1, -1) : m[1];
    return { text: s.slice(i + 1, j), url: url.replace(/\\([^\w\s])/g, '$1'), end: j + 1 + m[0].length };
  }

  function inline(s) {
    let out = '';
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      const rest = s.slice(i);

      if (c === '\\' && PUNCT.test(s[i + 1] || '')) { out += esc(s[i + 1]); i += 2; continue; }
      if (c === '\\' && s[i + 1] === '\n') { out += '<br>\n'; i += 2; continue; }

      if (c === '`') {
        const run = /^`+/.exec(rest)[0];
        const close = new RegExp(`(?<!\`)${run}(?!\`)`, 'g');
        close.lastIndex = i + run.length;
        const m = close.exec(s);
        if (m) {
          let code = s.slice(i + run.length, m.index).replace(/\n/g, ' ');
          if (/^ .*[^ ].* $/.test(code)) code = code.slice(1, -1);
          out += `<code>${esc(code)}</code>`;
          i = m.index + run.length;
          continue;
        }
        out += esc(run);
        i += run.length;
        continue;
      }

      if (c === '[' || (c === '!' && s[i + 1] === '[')) {
        const img = c === '!';
        const l = parseLink(s, img ? i + 1 : i);
        if (l) {
          const url = safeUrl(l.url);
          const label = img ? esc(l.text || l.url) : inline(l.text);
          if (url) {
            const ext = /^(https?:|mailto:)/i.test(url);
            out += `<a href="${esc(url)}"${ext ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''}${img ? ' class="md-img"' : ''}>${label}</a>`;
          } else out += label;
          i = l.end;
          continue;
        }
      }

      if (c === '<') {
        const m = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i.exec(rest);
        if (m) {
          out += `<a href="${esc(m[1])}" target="_blank" rel="noopener noreferrer nofollow">${esc(m[1])}</a>`;
          i += m[0].length;
          continue;
        }
      }

      if ((c === 'h' || c === 'H') && !/[\p{L}\p{N}]/u.test(s[i - 1] || '')) {
        const m = /^https?:\/\/[^\s<]*[^\s<.,:;"')\]!?*_~]/i.exec(rest);
        if (m) {
          out += `<a href="${esc(m[0])}" target="_blank" rel="noopener noreferrer nofollow">${esc(m[0])}</a>`;
          i += m[0].length;
          continue;
        }
      }

      if (c === '*' || c === '_' || c === '~') {
        const delim = s[i + 1] === c ? c + c : c;
        const canOpen = !/\s/.test(s[i + delim.length] || ' ') &&
          !(c === '_' && /[\p{L}\p{N}]/u.test(s[i - 1] || '')) && !(c === '~' && delim.length === 1);
        if (canOpen) {
          const j = findClose(s, i + delim.length + 1, delim);
          if (j > i + delim.length) {
            const tag = c === '~' ? 'del' : delim.length === 2 ? 'strong' : 'em';
            out += `<${tag}>${inline(s.slice(i + delim.length, j))}</${tag}>`;
            i = j + delim.length;
            continue;
          }
        }
        out += esc(delim);
        i += delim.length;
        continue;
      }

      if (c === '\n') {
        if (/ {2,}$/.test(out)) out = `${out.replace(/ +$/, '')}<br>\n`;
        else out += '\n';
        i++;
        continue;
      }

      // plain run up to the next character that could start something
      const m = /^[^\\`[!<hH*_~\n]+/.exec(rest);
      const take = m ? m[0] : c;
      out += esc(take);
      i += take.length;
    }
    return out;
  }

  // ---------- blocks ----------

  function splitRow(line) {
    let t = line.trim();
    if (t.startsWith('|')) t = t.slice(1);
    if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
    const cells = [];
    let cur = '';
    let inCode = false;
    for (let k = 0; k < t.length; k++) {
      const ch = t[k];
      if (ch === '\\' && t[k + 1] === '|') { cur += '|'; k++; continue; }
      if (ch === '`') inCode = !inCode;
      if (ch === '|' && !inCode) { cells.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }

  function startsBlock(line) {
    return RE.fence.test(line) || RE.heading.test(line) || RE.hr.test(line) || RE.quote.test(line) ||
      (RE.item.test(line) && !RE.blank.test(line.replace(RE.item, '')));
  }

  // tight: paragraphs directly inside a tight list item are not wrapped in <p>
  function blocks(lines, ctx, tight = false) {
    let out = '';
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      let m;

      if (RE.blank.test(line)) { i++; continue; }

      if ((m = RE.fence.exec(line))) {
        const fence = m[1];
        const lang = m[2].toLowerCase();
        const indent = /^ */.exec(line)[0].length;
        const body = [];
        i++;
        while (i < lines.length && !new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`).test(lines[i])) {
          body.push(lines[i].replace(new RegExp(`^ {0,${indent}}`), ''));
          i++;
        }
        i++;
        out += codeBlock(body.join('\n'), lang, ctx);
        continue;
      }

      if ((m = RE.heading.exec(line))) {
        out += heading(m[1].length, m[2] || '', ctx);
        i++;
        continue;
      }

      if (RE.hr.test(line)) { out += '<hr>\n'; i++; continue; }

      if (RE.quote.test(line)) {
        const body = [];
        while (i < lines.length && !RE.blank.test(lines[i])) {
          body.push(lines[i].replace(RE.quote, ''));
          i++;
        }
        out += `<blockquote>\n${blocks(body, ctx)}</blockquote>\n`;
        continue;
      }

      if ((m = RE.item.exec(line))) {
        const res = list(lines, i, ctx);
        out += res.html;
        i = res.end;
        continue;
      }

      if (RE.indented.test(line)) {
        const body = [];
        while (i < lines.length && (RE.indented.test(lines[i]) || RE.blank.test(lines[i]))) {
          body.push(lines[i].replace(RE.indented, ''));
          i++;
        }
        while (body.length && RE.blank.test(body[body.length - 1])) body.pop();
        out += codeBlock(body.join('\n'), '', ctx);
        continue;
      }

      if (line.includes('|') && i + 1 < lines.length && RE.tableSep.test(lines[i + 1]) && lines[i + 1].includes('-')) {
        const head = splitRow(line);
        const align = splitRow(lines[i + 1]).map((a) =>
          a.startsWith(':') && a.endsWith(':') ? 'center' : a.endsWith(':') ? 'right' : a.startsWith(':') ? 'left' : '');
        if (align.length === head.length) {
          i += 2;
          const cell = (tag, txt, k) => `<${tag}${align[k] ? ` class="md-${align[k]}"` : ''}>${inline(txt || '')}</${tag}>`;
          let t = `<div class="md-table"><table>\n<thead><tr>${head.map((h, k) => cell('th', h, k)).join('')}</tr></thead>\n<tbody>\n`;
          while (i < lines.length && !RE.blank.test(lines[i]) && lines[i].includes('|') && !startsBlock(lines[i])) {
            const row = splitRow(lines[i]);
            t += `<tr>${head.map((_, k) => cell('td', row[k], k)).join('')}</tr>\n`;
            i++;
          }
          out += `${t}</tbody></table></div>\n`;
          continue;
        }
      }

      // paragraph (or setext heading)
      const para = [line];
      i++;
      while (i < lines.length && !RE.blank.test(lines[i])) {
        if (RE.setext.test(lines[i])) {
          const level = lines[i].trim()[0] === '=' ? 1 : 2;
          out += heading(level, para.join(' '), ctx);
          para.length = 0;
          i++;
          break;
        }
        if (startsBlock(lines[i])) break;
        para.push(lines[i]);
        i++;
      }
      if (para.length) {
        const text = inline(para.map((l) => l.replace(/^[ \t]+/, '')).join('\n'));
        out += tight ? `${text}\n` : `<p>${text}</p>\n`;
      }
    }
    return out;
  }

  function list(lines, start, ctx) {
    const first = RE.item.exec(lines[start]);
    const ordered = /\d/.test(first[2]);
    const marker = ordered ? first[2].slice(-1) : first[2];
    const startNum = ordered ? parseInt(first[2], 10) : 1;
    const items = [];
    let loose = false;
    let gap = false; // blank line after the previous item
    let i = start;
    while (i < lines.length) {
      const m = RE.item.exec(lines[i]);
      if (!m || /\d/.test(m[2]) !== ordered || (ordered ? m[2].slice(-1) : m[2]) !== marker) break;
      if (RE.hr.test(lines[i]) && !ordered) break;
      if (gap) loose = true;
      const contentIndent = m[1].length + m[2].length + Math.min(Math.max(m[3].length, 1), 4);
      const body = [lines[i].slice(m[0].length)];
      i++;
      let sawBlank = false;
      while (i < lines.length) {
        const l = lines[i];
        if (RE.blank.test(l)) { sawBlank = true; body.push(''); i++; continue; }
        const indent = /^ */.exec(l.replace(/\t/g, '    '))[0].length;
        if (indent >= contentIndent) {
          if (sawBlank) loose = true;
          body.push(l.replace(/\t/g, '    ').slice(contentIndent));
          sawBlank = false;
          i++;
          continue;
        }
        if (sawBlank) break;
        if (RE.item.test(l) || startsBlock(l)) break;
        body.push(l.trim()); // lazy continuation
        i++;
      }
      while (body.length && body[body.length - 1] === '') body.pop();
      items.push(body);
      gap = sawBlank;
    }

    let html = ordered ? `<ol${startNum !== 1 ? ` start="${startNum}"` : ''}>\n` : '<ul>\n';
    for (const body of items) {
      let task = '';
      const tm = /^\[([ xX])\][ \t]+/.exec(body[0]);
      if (tm) {
        body[0] = body[0].slice(tm[0].length);
        task = `<input type="checkbox" disabled${tm[1] === ' ' ? '' : ' checked'}> `;
      }
      const inner = blocks(body, ctx, !loose);
      html += `<li${task ? ' class="md-task"' : ''}>${task}${inner.trimEnd()}</li>\n`;
    }
    return { html: html + (ordered ? '</ol>\n' : '</ul>\n'), end: i };
  }

  function heading(level, text, ctx) {
    let slug = slugify(text.replace(/[`*_~[\]]/g, '')) || 'section';
    const n = ctx.slugs.get(slug) || 0;
    ctx.slugs.set(slug, n + 1);
    if (n) slug += `-${n}`;
    return `<h${level} id="md-${esc(slug)}">${inline(text.trim())}</h${level}>\n`;
  }

  function codeBlock(code, lang, ctx) {
    let body = null;
    if (ctx.highlight) body = ctx.highlight(code, lang);
    return `<pre class="md-code"><code>${body ?? esc(code)}</code></pre>\n`;
  }

  return function renderMarkdown(src, { highlight } = {}) {
    const lines = src.replace(/\r\n?/g, '\n').replace(/^﻿/, '').split('\n');
    return blocks(lines, { highlight, slugs: new Map() });
  };
})();
