function timeline(c, x, y, w, h, pistes, t, d = {}) { // timeline de montage sombre : pistes de clips colorés, tête de lecture qui avance ; pistes : [{ nom, col, clips: [[début, fin]] (0 à 1) }] ; d : { tete (0 à 1), titre }
  c.save(); rrect(c, x, y, w, h, 18); c.fillStyle = "#141518"; c.fill(); c.clip();
  if (d.titre) label(c, d.titre, x + w / 2, y + 36, "rgba(255,255,255,0.45)", 14, "center");
  const top = y + 70, lh = (h - 110) / pistes.length, gx = x + 90, gw = w - 120;
  c.fillStyle = "rgba(255,255,255,0.08)"; for (let i = 0; i <= 10; i++) c.fillRect(gx + (i * gw) / 10, top - 14, 1.5, 8);
  pistes.forEach((p, i) => { const py = top + i * lh; label(c, p.nom || "", x + 24, py + lh * 0.6, "rgba(255,255,255,0.35)", 12);
    p.clips.forEach(([a, b], j) => { const k = clamp((t - (d.t0 ?? -9) - (i * 0.08 + j * 0.04)) / 0.25); if (k <= 0) return;
      rrect(c, gx + a * gw + 2, py + 4, Math.max(4, (b - a) * gw * k - 4), lh - 8, 5); c.fillStyle = p.col; c.fill(); }); });
  const th = d.tete ?? 0; if (th > 0) { const hx = gx + th * gw; c.fillStyle = "#E8913A"; c.fillRect(hx - 1.5, top - 20, 3, h - 80); c.beginPath(); c.moveTo(hx - 9, top - 26); c.lineTo(hx + 9, top - 26); c.lineTo(hx, top - 14); c.fill(); }
  c.restore(); }
