function polaroid(c, x, y, w, img, legende, angle = 0, t, t0 = -1) { // photo instantanée centrée sur x, y, penchée de angle ; img : image chargée ou null (fond gris) ; tombe en tournant à t0
  const h = w * 1.18, k = t0 < 0 ? 1 : step(t - t0, 3.2, 0.7); if (k <= 0) return;
  c.save(); c.globalAlpha *= clamp(k * 2); c.translate(x, y - (1 - k) * 80); c.rotate(angle + (1 - k) * 0.35); c.scale(lerp(1.15, 1, k), lerp(1.15, 1, k));
  c.save(); c.shadowColor = "rgba(31,27,22,0.25)"; c.shadowBlur = 30; c.shadowOffsetY = 14; c.fillStyle = "#FBFAF7"; c.fillRect(-w / 2, -h / 2, w, h); c.restore();
  const m = w * 0.06, ph = w - 2 * m; c.save(); c.beginPath(); c.rect(-w / 2 + m, -h / 2 + m, ph, ph); c.clip();
  if (img && img.naturalWidth) { const s = Math.max(ph / img.naturalWidth, ph / img.naturalHeight); c.drawImage(img, -img.naturalWidth * s / 2, -h / 2 + m + ph / 2 - img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s); }
  else { c.fillStyle = C.dim; c.fill(); } c.restore();
  if (legende) label(c, legende, -w / 2 + m, h / 2 - m * 1.4, C.ink, Math.max(10, w * 0.05));
  c.restore(); }
