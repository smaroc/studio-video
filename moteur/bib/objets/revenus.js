function revenus(c, x, y, w, h, d, t, t0, t1) { // tableau de revenus sombre : titre, montant qui compte, courbe en aire, paiements qui tombent à droite ; d : { titre, sous, de, a, pts, paiements: [[libellé, détail, montant]], devise }
  const p = eio((t - t0) / Math.max(0.01, t1 - t0)), col = d.col || "#E8913A", dev = d.devise || "€";
  c.save(); rrect(c, x, y, w, h, 26); c.fillStyle = "#16171B"; c.fill(); c.clip();
  const gx = c.createRadialGradient(x + w * 0.2, y, 0, x + w * 0.2, y, w * 0.8); gx.addColorStop(0, "rgba(255,255,255,0.06)"); gx.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gx; c.fillRect(x, y, w, h);
  txt(c, d.titre || "", x + 40, y + 70, font(800, 32, SANS, true), "#fff"); label(c, d.sous || "REVENUS · 30 DERNIERS JOURS", x + 40, y + 108, "rgba(255,255,255,0.4)", 14);
  const v = lerp(d.de || 0, d.a, p), s = v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, " ");
  txt(c, s, x + 40, y + 180, font(500, 70, SANS), "#fff"); c.font = font(500, 70, SANS); txt(c, dev, x + 48 + c.measureText(s).width, y + 180, font(500, 34, SANS), "#fff");
  txt(c, "▲ en hausse", x + 40, y + 216, font(600, 18, SANS), "#4ADE80");
  const pts = d.pts || [1, 2, 2, 3, 3, 4, 5, 5, 6, 7, 8], cx = x + 40, cw = w * 0.56, cy = y + h - 70, ch = h * 0.42, mx = Math.max(...pts), n = pts.length - 1, fin = p * n;
  const X = (i) => cx + (i / n) * cw, Y = (u) => cy - (u / mx) * ch; c.beginPath(); c.moveTo(X(0), Y(pts[0]));
  for (let i = 1; i <= Math.floor(fin); i++) c.lineTo(X(i), Y(pts[i])); const ki = Math.floor(fin), vy = ki >= n ? pts[n] : lerp(pts[ki], pts[ki + 1], fin - ki); c.lineTo(X(fin), Y(vy));
  c.save(); c.lineTo(X(fin), cy); c.lineTo(cx, cy); c.closePath(); const ga = c.createLinearGradient(0, cy - ch, 0, cy); ga.addColorStop(0, "rgba(232,145,58,0.45)"); ga.addColorStop(1, "rgba(232,145,58,0)"); c.fillStyle = ga; c.fill(); c.restore();
  c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,0.85)"; c.stroke(); c.beginPath(); c.arc(X(fin), Y(vy), 7, 0, 7); c.fillStyle = col; c.fill();
  (d.paiements || []).forEach(([lib, det, m], i) => { const k = clamp((p * (d.paiements.length + 1) - i) * 1.5); if (k <= 0) return; const py = y + 110 + i * 84, px = x + w * 0.64, pw = w * 0.32;
    c.save(); c.globalAlpha *= k; c.translate((1 - k) * 40, 0); rrect(c, px, py, pw, 70, 12); c.fillStyle = "rgba(255,255,255,0.05)"; c.fill(); c.strokeStyle = "rgba(255,255,255,0.08)"; c.lineWidth = 1.5; c.stroke();
    rrect(c, px + 14, py + 19, 32, 32, 8); c.fillStyle = col; c.fill(); txt(c, dev, px + 30, py + 42, font(800, 18, SANS), "#fff", "center");
    txt(c, lib, px + 58, py + 32, font(700, 16, SANS), "#fff"); if (det) txt(c, det, px + 58, py + 54, font(500, 13, SANS), "rgba(255,255,255,0.45)");
    txt(c, m, px + pw - 14, py + 54, font(700, 15, MONO), "#4ADE80", "right"); c.restore(); });
  c.restore(); }
