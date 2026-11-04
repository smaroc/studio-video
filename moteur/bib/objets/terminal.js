function terminal(c, x, y, w, h, lignes, t, dossier = "~/projet") { // lignes : [texte, couleur, t0]
  fenetre(c, x, y, w, h, null, true); label(c, "claude · " + dossier, x + w / 2, y + 36, "rgba(255,255,255,0.55)", 17, "center");
  rrect(c, x + 30, y + 82, w - 60, 104, 14); c.lineWidth = 2.5; c.strokeStyle = C.claude; c.stroke();
  claude(c, x + 66, y + 120, 26, C.claude); txt(c, "Welcome to Claude Code!", x + 94, y + 129, font(700, 24, MONO), "#fff");
  txt(c, "/help pour l'aide · cwd: " + dossier, x + 94, y + 166, font(500, 18, MONO), "rgba(255,255,255,0.5)");
  lignes.forEach(([s, col, t0], i) => { if (t < t0) return; c.save(); c.globalAlpha *= clamp((t - t0) / 0.15); fitTxt(c, s, x + 36, y + 246 + i * 54, 27, w - 72, MONO, col, "left", 600); c.restore(); });
}
