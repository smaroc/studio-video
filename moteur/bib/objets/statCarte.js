function statCarte(c, x, y, lignes, t, t0 = -1) { // petite carte blanche flottante de chiffres ; lignes : [[sur-titre, valeur, légende, couleur?]] ; monte et se pose à t0
  const k = t0 < 0 ? 1 : step(t - t0, 3, 0.75); if (k <= 0) return; const w = 200, h = 40 + lignes.length * 110;
  c.save(); c.globalAlpha *= clamp(k * 2); c.translate(0, (1 - k) * 40); card(c, x, y, w, h, 18, C.card);
  lignes.forEach(([sur, v, leg, col], i) => { const ly = y + 30 + i * 110; label(c, sur, x + 24, ly + 10, C.dim, 12); txt(c, v, x + 24, ly + 62, font(800, 46, SANS), col || C.ink); if (leg) label(c, leg, x + 24, ly + 84, col ? teinte(col, 0.2) : C.mut, 11); });
  c.restore(); }
