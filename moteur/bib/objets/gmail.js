function gmail(c, x, y, w, h, mails, t) { // boîte de réception ; mails : [{ de, objet, extrait, heure, nonLu, t0 }] ; chaque mail glisse à son t0
  fenetre(c, x, y, w, h, "mail.google.com");
  c.save(); c.translate(x + 50, y + 100); gmailM(c, 46); c.restore(); txt(c, "Gmail", x + 84, y + 112, font(600, 28, SANS), "#5F6368");
  rrect(c, x + 200, y + 76, w - 230, 48, 24); c.fillStyle = "#EEF1F6"; c.fill(); fitTxt(c, "Rechercher dans les messages", x + 226, y + 108, 20, w - 280, SANS, "#5F6368", "left", 500);
  c.save(); c.beginPath(); c.rect(x, y + 146, w, h - 146); c.clip();
  mails.forEach((m, i) => { const ly = y + 150 + i * 92, k = m.t0 == null ? 1 : step(t - m.t0, 3.4, 0.8); if (k <= 0) return;
    c.save(); c.globalAlpha *= clamp(k * 2); c.translate((1 - k) * 60, 0);
    c.fillStyle = m.nonLu ? "#FFFFFF" : "#F6F8FC"; c.fillRect(x + 1, ly, w - 2, 90); c.fillStyle = C.line; c.fillRect(x + 20, ly + 90, w - 40, 1.5);
    const g = m.nonLu ? 800 : 500; txt(c, m.de, x + 30, ly + 38, font(g, 23, SANS), C.ink); txt(c, m.heure || "", x + w - 30, ly + 38, font(g, 19, SANS), m.nonLu ? C.ink : C.mut, "right");
    fitTxt(c, m.objet + (m.extrait ? "  " : ""), x + 30, ly + 72, 21, w * 0.45, SANS, C.ink, "left", g);
    c.font = font(g, 21, SANS); const ow = Math.min(c.measureText(m.objet + "  ").width, w * 0.45);
    if (m.extrait) fitTxt(c, "· " + m.extrait, x + 30 + ow, ly + 72, 21, w - 90 - ow, SANS, C.mut, "left", 500);
    c.restore(); });
  c.restore(); }
