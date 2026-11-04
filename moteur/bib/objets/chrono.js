function chrono(c, x, y, r, p, d = {}) { // chronomètre centré sur x, y ; p de 0 à 1 = part du tour écoulée (secteur rempli + aiguille) ; d : { col, temps (texte sous le cadran), max (graduation haute, 60) }
  const col = d.col || C.org, max = d.max || 60, a0 = -Math.PI / 2, a = a0 + p * Math.PI * 2;
  c.save(); c.translate(x, y);
  c.fillStyle = C.ink; rrect(c, -r * 0.16, -r * 1.22, r * 0.32, r * 0.1, r * 0.03); c.fill(); c.fillRect(-r * 0.05, -r * 1.14, r * 0.1, r * 0.14);
  c.save(); c.shadowColor = "rgba(31,27,22,0.18)"; c.shadowBlur = r * 0.25; c.shadowOffsetY = r * 0.06; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = "#fff"; c.fill(); c.restore();
  if (p > 0) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r * 0.92, a0, a); c.closePath(); c.fillStyle = teinte(col, 0.82); c.fill();
    c.beginPath(); c.arc(0, 0, r * 1.1, a0, a); c.lineWidth = r * 0.035; c.lineCap = "round"; c.strokeStyle = col; c.stroke(); }
  c.lineWidth = r * 0.045; c.strokeStyle = C.ink; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke();
  for (let i = 0; i < 60; i++) { const g = i % 5 === 0, an = (i / 60) * Math.PI * 2; c.beginPath(); c.moveTo(Math.sin(an) * r * 0.9, -Math.cos(an) * r * 0.9);
    c.lineTo(Math.sin(an) * r * (g ? 0.78 : 0.84), -Math.cos(an) * r * (g ? 0.78 : 0.84)); c.lineWidth = r * (g ? 0.025 : 0.01); c.stroke(); }
  [0, 15, 30, 45].forEach((v, i) => { const an = (i / 4) * Math.PI * 2; txt(c, String(v === 0 ? 0 : (v * max) / 60), Math.sin(an) * r * 0.62, -Math.cos(an) * r * 0.62 + r * 0.07, font(700, r * 0.18, SANS), C.ink, "center"); });
  c.save(); c.rotate(p * Math.PI * 2); c.beginPath(); c.moveTo(0, r * 0.12); c.lineTo(0, -r * 0.8); c.lineWidth = r * 0.03; c.strokeStyle = C.ink; c.stroke(); c.restore();
  c.beginPath(); c.arc(0, 0, r * 0.05, 0, 7); c.fillStyle = C.ink; c.fill();
  if (d.temps) txt(c, d.temps, 0, r * 1.3, font(700, r * 0.16, MONO), C.ink, "center");
  c.restore(); }
