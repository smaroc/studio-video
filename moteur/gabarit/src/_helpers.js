  // ---------- outils ----------
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const lerp = (x, y, p) => x + (y - x) * p;
  const eio = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const eo = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const step = (tau, f, z) => { if (tau <= 0) return 0; const w = 2 * Math.PI * f;
    if (z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
    const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau)); };
  const font = (w, sz, fam, it) => `${it ? "italic " : ""}${w} ${sz}px "${fam}"`;
  function rrect(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function txt(c, s, x, y, f, col, align = "left") { c.font = f; c.fillStyle = col; c.textAlign = align; c.textBaseline = "alphabetic"; c.fillText(s, x, y); }
  function typed(s, t, t0, t1) { return s.slice(0, Math.floor(clamp((t - t0) / Math.max(0.01, t1 - t0)) * s.length)); }
  function card(c, x, y, w, h, r = 28, fill = C.card, stroke) { c.save(); c.shadowColor = "rgba(31,27,22,0.10)"; c.shadowBlur = 40; c.shadowOffsetY = 12; rrect(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); c.restore();
    if (stroke) { c.save(); rrect(c, x, y, w, h, r); c.lineWidth = 3; c.strokeStyle = stroke; c.stroke(); c.restore(); } }
  function label(c, s, x, y, col = C.mut, sz = 22, align = "left") { c.save(); c.font = font(700, sz, MONO); c.fillStyle = col; c.textAlign = align; c.textBaseline = "alphabetic"; c.letterSpacing = "3px"; c.fillText(s, x, y); c.restore(); }
  function chip(c, s, cx, cy, fill, col, sz = 26, f = SANS, w8 = 700) { c.font = font(w8, sz, f); const w = c.measureText(s).width + sz * 1.6; rrect(c, cx - w / 2, cy - sz * 0.95, w, sz * 1.9, sz * 0.95); c.fillStyle = fill; c.fill(); txt(c, s, cx, cy + sz * 0.36, font(w8, sz, f), col, "center"); return w; }
  function check(c, x, y, s, col) { c.save(); c.strokeStyle = col; c.lineWidth = s * 0.16; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.moveTo(x - s * 0.4, y); c.lineTo(x - s * 0.1, y + s * 0.32); c.lineTo(x + s * 0.45, y - s * 0.35); c.stroke(); c.restore(); }
  const pop = (t, t0, t1) => { const k = t0 < 0 ? 1 : step(t - t0, 3.0, 0.9), out = t1 ? eio((t - t1) / 0.22) : 0;
    return [clamp(k * 1.8) * (1 - out), (1 - k) * 30, lerp(0.92, 1, clamp(k)) - out * 0.04]; };
  function P(c, t, t0, x, y, fn, t1) { if (t0 >= 0 && t < t0) return; const [al, dy, s] = pop(t, t0, t1); if (al <= 0.002) return;
    c.save(); c.globalAlpha *= al; c.translate(x, y + dy); c.scale(s, s); fn(); c.restore(); }
  function layer(c, t, t0, t1, fn) { if (t < t0 - 0.01 || t > t1 + 0.3) return;
    const i = t0 <= 0 ? 1 : eo((t - t0) / 0.3), out = eio((t - t1) / 0.28), al = i * (1 - out); if (al <= 0.002) return;
    c.save(); c.globalAlpha = al; c.translate(0, (1 - i) * 36 - out * 36); fn(); c.restore(); }
  const bump = (t, t0, d = 0.32) => { const u = (t - t0) / d; return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };
  function barre(c, x0, y0, x1, y1, p, col = C.org, lw = 12) { if (p <= 0) return; c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = "round"; c.beginPath(); c.moveTo(x0, y0); c.lineTo(lerp(x0, x1, p), lerp(y0, y1, p)); c.stroke(); c.restore(); }
  function lignes(c, x, y, w, n, col = "rgba(31,27,22,0.10)", gap = 30, hh = 12) { const L = [1, 0.84, 0.66, 0.92, 0.58, 0.78]; for (let i = 0; i < n; i++) { rrect(c, x, y + i * gap, w * L[i % 6], hh, hh / 2); c.fillStyle = col; c.fill(); } }
  function curseur(c, x, y, t, clic, s0 = 1.4) {
    let s = s0; for (const k of [].concat(clic)) { const d = t - k; if (d > -0.05 && d < 0.26) s = s0 * (1 - 0.15 * Math.sin(clamp((d + 0.05) / 0.31) * Math.PI)); }
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 30); c.lineTo(7.5, 22.5); c.lineTo(13, 35); c.lineTo(18, 33); c.lineTo(13, 21); c.lineTo(22.5, 21); c.closePath();
    c.fillStyle = C.ink; c.strokeStyle = "#fff"; c.lineWidth = 2.6; c.lineJoin = "round"; c.fill(); c.stroke(); c.restore(); }
  function fitTxt(c, s, x, y, maxSz, maxw, f, col, align = "center", w8 = 400) { let sz = maxSz; c.font = font(w8, sz, f); const w = c.measureText(s).width; if (w > maxw) sz = Math.floor(sz * maxw / w); txt(c, s, x, y, font(w8, sz, f), col, align); return sz; }
  function titreMots(c, mots, y, sz, maxw = 960) {
    c.font = font(400, sz, TITLE); const gap = sz * 0.26; let ws = mots.map(([s]) => c.measureText(s).width), tw = ws.reduce((p, q) => p + q, 0) + gap * (mots.length - 1);
    if (tw > maxw) { sz = Math.floor(sz * maxw / tw); c.font = font(400, sz, TITLE); ws = mots.map(([s]) => c.measureText(s).width); tw = ws.reduce((p, q) => p + q, 0) + sz * 0.26 * (mots.length - 1); }
    let x = 540 - tw / 2; mots.forEach(([s, col], i) => { txt(c, s, x, y, font(400, sz, TITLE), col || C.ink); x += ws[i] + sz * 0.26; }); }
  // bulle de prompt (toi → Claude Code)
  function bulle(c, s, full, y, t, caret) {
    c.font = font(700, 32, SANS); const w = Math.max(220, Math.min(900, c.measureText(full).width + 70));
    rrect(c, 990 - w, y, w, 92, 30); c.fillStyle = C.ink; c.fill(); txt(c, s, 990 - w + 34, y + 57, font(700, 32, SANS), "#fff");
    if (caret && Math.floor(t * 2.4) % 2 === 0) { const w2 = c.measureText(s).width; c.fillStyle = C.org; c.fillRect(990 - w + 38 + w2, y + 28, 4, 38); }
    label(c, "TOI → CLAUDE CODE", 990 - w, y - 16, C.mut, 17); }

  // ---------- mascotte : l'étincelle Claude avec des yeux ----------
  function mascotte(c, x, y, s, t, chapeau, regard = 0) {
    const resp = 1 + Math.sin(t * 2.4) * 0.025, rot = Math.sin(t * 1.1) * 0.06;
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(resp, resp);
    claude(c, 0, 0, s);
    c.beginPath(); c.arc(0, s * 0.02, s * 0.2, 0, 7); c.fillStyle = C.claude; c.fill();
    const cl = (t % 3.3) < 0.12 ? 0.15 : 1;
    [-1, 1].forEach((k) => { c.save(); c.translate(k * s * 0.085, 0); c.scale(1, cl);
      c.beginPath(); c.ellipse(0, 0, s * 0.055, s * 0.075, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(regard * s * 0.02, s * 0.012, s * 0.032, 0, 7); c.fillStyle = C.ink; c.fill(); c.restore(); });
    if (chapeau === "chef") { c.save(); c.translate(0, -s * 0.5); c.fillStyle = "#fff"; c.strokeStyle = C.ink; c.lineWidth = s * 0.03;
      c.beginPath(); c.arc(-s * 0.13, -s * 0.06, s * 0.13, 0, 7); c.arc(s * 0.13, -s * 0.06, s * 0.13, 0, 7); c.arc(0, -s * 0.14, s * 0.15, 0, 7); c.fill();
      rrect(c, -s * 0.2, -s * 0.04, s * 0.4, s * 0.16, s * 0.03); c.fill(); c.stroke(); c.restore(); }
    if (chapeau === "hack") { c.save(); c.translate(0, -s * 0.02); c.fillStyle = C.ink; rrect(c, -s * 0.2, -s * 0.07, s * 0.4, s * 0.12, s * 0.05); c.fill(); c.restore(); }
    c.restore(); }
