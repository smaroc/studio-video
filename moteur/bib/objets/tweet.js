function tweet(c, x, y, w, d, t, t0 = 0) { // d : { nom, pseudo, date, img (image chargée ou null), lignes: [texte], surligne: [indices], stats } ; renvoie la hauteur
  const L = d.lignes || [], h = 160 + L.length * 46 + (d.stats ? 50 : 0);
  card(c, x, y, w, h, 28, C.card, C.line);
  c.save(); c.beginPath(); c.arc(x + 70, y + 70, 36, 0, 7); c.clip(); if (d.img && d.img.naturalWidth) c.drawImage(d.img, x + 34, y + 34, 72, 72); else { c.fillStyle = C.dim; c.fill(); } c.restore();
  if (!d.img) txt(c, (d.nom || "?")[0].toUpperCase(), x + 70, y + 81, font(800, 30, SANS), "#fff", "center");
  txt(c, d.nom || "", x + 122, y + 64, font(800, 28, SANS), C.ink); txt(c, `${d.pseudo || ""}${d.date ? " · " + d.date : ""}`, x + 122, y + 96, font(600, 21, SANS), C.mut);
  xlogo(c, x + w - 62, y + 66, 32, C.ink);
  L.forEach((s, i) => { const hl = t0 + i * 0.25;
    if ((d.surligne || []).includes(i) && t > hl) { const p = eio((t - hl) / 0.35); c.fillStyle = "rgba(255,213,128,0.55)"; c.fillRect(x + 36, y + 136 + i * 46, (w - 72) * p, 38); }
    txt(c, s, x + 40, y + 164 + i * 46, font(600, 26, SANS), C.ink); });
  if (d.stats) txt(c, d.stats, x + 40, y + h - 32, font(600, 20, SANS), C.mut);
  return h; }
