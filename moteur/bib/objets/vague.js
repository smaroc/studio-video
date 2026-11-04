function vague(c, x, y, w, amp, t, d = {}) { // ligne orange ondulante en décor de fond, qui glisse doucement ; d : { col, epaisseur, longueur (période en px), vitesse, alpha }
  const L = d.longueur || w * 0.9, v = d.vitesse ?? 0.15; c.save(); c.globalAlpha *= d.alpha ?? 0.8; c.beginPath();
  for (let i = 0; i <= 80; i++) { const px = x + (i / 80) * w, py = y + Math.sin(((px - x) / L) * Math.PI * 2 + t * v * Math.PI * 2) * amp; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.lineWidth = d.epaisseur || 4; c.strokeStyle = d.col || "#E8A33A"; c.lineCap = "round"; c.stroke(); c.restore(); }
