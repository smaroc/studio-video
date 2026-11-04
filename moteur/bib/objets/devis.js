function devis(c, x, y, w, d, t, t0 = -1) { // ticket de devis penché ; d : { numero, titre, sous, lignes: [[libellé, montant]], total, angle } ; les lignes tombent une à une après t0 ; renvoie la hauteur
  const L = d.lignes || [], h = 250 + L.length * 44, k = t0 < 0 ? 1 : step(t - t0, 3, 0.8); if (k <= 0) return h;
  c.save(); c.globalAlpha *= clamp(k * 2); c.translate(x + w / 2, y + h / 2); c.rotate((d.angle ?? -0.03) + (1 - k) * 0.12); c.translate(-w / 2, -h / 2 + (1 - k) * 40);
  c.save(); c.shadowColor = "rgba(31,27,22,0.22)"; c.shadowBlur = 40; c.shadowOffsetY = 18; c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, h); c.restore();
  label(c, d.numero || "DEVIS N° 2026-118", 36, 50, C.mut, 15); label(c, "PRODUCTION", w - 36, 50, C.dim, 15, "right");
  txt(c, d.titre || "Devis", 36, 100, font(800, 34, SANS), C.ink); if (d.sous) txt(c, d.sous, 36, 130, font(500, 16, SANS), C.mut);
  c.fillStyle = C.line; c.fillRect(36, 152, w - 72, 2);
  L.forEach(([lib, m], i) => { const li = t0 < 0 ? 1 : clamp((t - t0 - 0.3 - i * 0.18) / 0.2); if (li <= 0) return; c.save(); c.globalAlpha *= li;
    txt(c, lib, 36, 196 + i * 44, font(500, 21, SANS), C.ink); txt(c, m, w - 36, 196 + i * 44, font(600, 21, SANS), C.ink, "right"); c.restore(); });
  const ty = 196 + L.length * 44 + 30; c.fillStyle = C.line; c.fillRect(36, ty - 34, w - 72, 2);
  label(c, "TOTAL HT", 36, ty + 10, C.mut, 15); if (d.total) txt(c, d.total, w - 36, ty + 16, font(800, 40, SANS), C.ink, "right");
  c.restore(); return h; }
