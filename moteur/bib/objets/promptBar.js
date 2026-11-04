function promptBar(c, x, y, w, texte, t, t0, t1, d = {}) { // barre de prompt sombre en verre : étincelle, texte tapé de t0 à t1 avec curseur, bouton d'envoi qui s'allume à la fin ; d : { clair }
  const h = 76, s = typed(texte, t, t0, t1), fini = t >= t1, cl = d.clair;
  c.save(); c.shadowColor = "rgba(0,0,0,0.35)"; c.shadowBlur = 30; c.shadowOffsetY = 10; rrect(c, x, y, w, h, 18); c.fillStyle = cl ? "#fff" : "rgba(28,29,34,0.92)"; c.fill(); c.restore();
  rrect(c, x, y, w, h, 18); c.lineWidth = 1.5; c.strokeStyle = cl ? C.line : "rgba(255,255,255,0.12)"; c.stroke();
  const ink = cl ? C.ink : "#fff"; txt(c, "✦", x + 30, y + 48, font(700, 26, SANS), ink);
  txt(c, s, x + 70, y + 48, font(500, 26, SANS), ink); c.font = font(500, 26, SANS);
  if (!fini || Math.floor(t * 2.5) % 2 === 0) { c.fillStyle = ink; c.fillRect(x + 74 + c.measureText(s).width, y + 24, 2.5, 30); }
  const k = fini ? step(t - t1, 4, 0.6) : 0; c.beginPath(); c.arc(x + w - 42, y + h / 2, 22, 0, 7); c.fillStyle = k > 0.05 ? (cl ? C.ink : "#fff") : (cl ? C.line : "rgba(255,255,255,0.25)"); c.fill();
  c.save(); c.translate(x + w - 42, y + h / 2); c.scale(1 + k * 0.08, 1 + k * 0.08); c.strokeStyle = k > 0.05 ? (cl ? "#fff" : C.ink) : (cl ? C.mut : "#fff"); c.lineWidth = 3; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(0, 9); c.lineTo(0, -9); c.moveTo(-7, -2); c.lineTo(0, -9); c.lineTo(7, -2); c.stroke(); c.restore(); }
