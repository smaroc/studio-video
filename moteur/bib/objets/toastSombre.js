function toastSombre(c, x, y, d, t, t0 = -1) { // pastille sombre en verre posée sur la vidéo : icône, sur-titre espacé, titre, détail ; d : { sur, titre, detail, icone (texte court) } ; glisse à t0
  const k = t0 < 0 ? 1 : step(t - t0, 3.4, 0.75); if (k <= 0) return; c.font = font(700, 22, SANS); const w = Math.max(280, c.measureText(d.titre).width + 110), h = d.detail ? 96 : 78;
  c.save(); c.globalAlpha *= clamp(k * 2); c.translate((1 - k) * -30, 0);
  c.save(); c.shadowColor = "rgba(0,0,0,0.4)"; c.shadowBlur = 24; rrect(c, x, y, w, h, 14); c.fillStyle = "rgba(24,25,29,0.88)"; c.fill(); c.restore();
  rrect(c, x, y, w, h, 14); c.strokeStyle = "rgba(255,255,255,0.12)"; c.lineWidth = 1.5; c.stroke();
  rrect(c, x + 16, y + h / 2 - 22, 44, 44, 10); c.fillStyle = "rgba(255,255,255,0.08)"; c.fill(); txt(c, d.icone || "✦", x + 38, y + h / 2 + 8, font(700, 20, SANS), "#E8913A", "center");
  if (d.sur) label(c, d.sur, x + 76, y + 30, "rgba(255,255,255,0.4)", 11);
  txt(c, d.titre, x + 76, y + (d.sur ? 58 : 48), font(700, 22, SANS), "#fff"); if (d.detail) label(c, d.detail, x + 76, y + 82, "rgba(255,255,255,0.35)", 11);
  c.restore(); }
