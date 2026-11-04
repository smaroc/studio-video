function editeur(c, x, y, w, nom, L, t, hi = -1, hp = 0, n0 = 12) { // L : [[segments [texte, couleur, flou?]], ...] ; ligne hi surlignée en rouge selon hp ; renvoie la hauteur
  const h = 96 + L.length * 52 + 30;
  fenetre(c, x, y, w, h, null, true); label(c, nom, x + w / 2, y + 36, "rgba(255,255,255,0.6)", 17, "center");
  L.forEach((segs, i) => { const ly = y + 108 + i * 52;
    if (i === hi && hp > 0) { c.save(); c.globalAlpha *= clamp(hp * 2); rrect(c, x + 14, ly - 34, w - 28, 50, 10); c.fillStyle = "rgba(229,72,77,0.22)"; c.fill(); c.fillStyle = C.red; c.fillRect(x + 14, ly - 34, 6, 50); c.restore(); }
    txt(c, String(n0 + i), x + 56, ly, font(500, 22, MONO), "rgba(255,255,255,0.3)", "right");
    let cx = x + 80; segs.forEach(([s, col, flou]) => { c.font = font(500, 25, MONO); const sw = c.measureText(s).width;
      if (flou) { c.save(); c.filter = "blur(7px)"; txt(c, s, cx, ly, font(500, 25, MONO), col); c.restore(); } else txt(c, s, cx, ly, font(500, 25, MONO), col); cx += sw; }); });
  return h; }
