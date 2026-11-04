function courbe(c, x, y, w, h, pts, t, t0, t1, d = {}) { // courbe de vues qui se trace de t0 à t1 ; pts : valeurs ; d : { col, max, etiquette (fn valeur -> texte), grille }
  const col = d.col || C.org, max = d.max || Math.max(...pts) * 1.12, n = pts.length - 1, p = t0 == null ? 1 : eio((t - t0) / Math.max(0.01, t1 - t0)); if (p <= 0) return;
  const X = (i) => x + (i / n) * w, Y = (v) => y + h - (v / max) * h, fin = p * n, ki = Math.floor(fin), fr = fin - ki;
  if (d.grille !== false) { c.strokeStyle = C.line; c.lineWidth = 1.5; for (let g = 0; g <= 4; g++) { c.beginPath(); c.moveTo(x, y + (g * h) / 4); c.lineTo(x + w, y + (g * h) / 4); c.stroke(); } }
  const vx = X(fin), vv = ki >= n ? pts[n] : lerp(pts[ki], pts[ki + 1], fr), vy = Y(vv);
  c.beginPath(); c.moveTo(X(0), Y(pts[0])); for (let i = 1; i <= ki; i++) c.lineTo(X(i), Y(pts[i])); c.lineTo(vx, vy);
  c.save(); c.lineTo(vx, y + h); c.lineTo(x, y + h); c.closePath(); const gr = c.createLinearGradient(0, y, 0, y + h); c.globalAlpha *= 0.35; gr.addColorStop(0, col); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fill(); c.restore();
  c.beginPath(); c.moveTo(X(0), Y(pts[0])); for (let i = 1; i <= ki; i++) c.lineTo(X(i), Y(pts[i])); c.lineTo(vx, vy);
  c.lineWidth = 6; c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = col; c.stroke();
  c.beginPath(); c.arc(vx, vy, 11, 0, 7); c.fillStyle = "#fff"; c.fill(); c.lineWidth = 5; c.stroke();
  const s = d.etiquette ? d.etiquette(vv) : compte(vv); c.font = font(800, 26, SANS); const lw = c.measureText(s).width + 32, lx = clamp(vx - lw / 2, x, x + w - lw);
  rrect(c, lx, vy - 74, lw, 46, 23); c.fillStyle = C.ink; c.fill(); txt(c, s, lx + lw / 2, vy - 42, font(800, 26, SANS), "#fff", "center"); }
