function notifIOS(c, x, y, w, d, t, t0 = -1) { // d : { app: "claude" | "ig" | "gmail" | autre, appNom, titre, texte, quand } ; descend du haut à partir de t0 (t0 < 0 : posée) ; renvoie la hauteur
  const h = 150, k = t0 < 0 ? 1 : step(t - t0, 3.2, 0.75); if (k <= 0) return h;
  c.save(); c.globalAlpha *= clamp(k * 2); c.translate(0, (1 - k) * -180);
  c.save(); c.shadowColor = "rgba(31,27,22,0.18)"; c.shadowBlur = 40; c.shadowOffsetY = 12; rrect(c, x, y, w, h, 34); c.fillStyle = "rgba(250,248,245,0.97)"; c.fill(); c.restore();
  if (d.app === "gmail") { c.save(); rrect(c, x + 22, y + 32, 84, 84, 20); c.fillStyle = "#fff"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = C.line; c.stroke(); c.translate(x + 64, y + 74); gmailM(c, 64); c.restore(); }
  else badge(c, x + 64, y + 74, 84, d.app);
  txt(c, d.titre || d.appNom || "", x + 126, y + 62, font(800, 26, SANS), C.ink); txt(c, d.quand || "maintenant", x + w - 26, y + 62, font(500, 21, SANS), C.mut, "right");
  fitTxt(c, d.texte || "", x + 126, y + 104, 25, w - 160, SANS, "#3A332C", "left", 500);
  c.restore(); return h; }
