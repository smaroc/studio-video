function titreEdito(c, x, y, d, t, t0 = -1) { // bloc titre éditorial ferré à gauche : petit sur-titre orange espacé, amorce en italique, mot géant, sous-ligne avec un mot coloré ; d : { kicker, amorce, gros, sous, accent, col, taille }
  const col = d.col || C.org, T = d.taille || 120, pk = (i) => (t0 < 0 ? 1 : step(t - t0 - i * 0.12, 3.2, 0.8)); let yy = y;
  const ligne = (i, fn) => { const k = pk(i); if (k <= 0) return; c.save(); c.globalAlpha *= clamp(k * 2); c.translate(0, (1 - k) * 24); fn(); c.restore(); };
  if (d.kicker) { ligne(0, () => label(c, d.kicker.toUpperCase().split("").join(" "), x, yy, col, 15)); yy += 50; }
  if (d.amorce) { const a = yy; ligne(1, () => txt(c, d.amorce, x, a, font(800, T * 0.33, SANS, true), C.ink)); yy += T * 0.95; }
  if (d.gros) { const a = yy; ligne(2, () => { c.save(); c.font = font(400, T, TITLE); c.fillStyle = C.ink; c.textAlign = "left"; c.letterSpacing = `${-T * 0.04}px`; c.fillText(d.gros, x, a); c.restore(); }); yy += T * 0.55; }
  if (d.sous) { const a = yy; ligne(3, () => { const parts = d.accent ? d.sous.split(d.accent) : [d.sous]; let cx = x; c.font = font(800, T * 0.27, SANS, true);
    parts.forEach((p, i) => { txt(c, p, cx, a, c.font, C.ink); cx += c.measureText(p).width; if (i < parts.length - 1) { txt(c, d.accent, cx, a, c.font, col); cx += c.measureText(d.accent).width; } }); }); }
}
