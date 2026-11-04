function badge(c, x, y, s, kind) { // logo d'app carré, centré sur x, y
  c.save(); c.translate(x, y); c.shadowColor = "rgba(31,27,22,0.18)"; c.shadowBlur = 24; c.shadowOffsetY = 8; rrect(c, -s / 2, -s / 2, s, s, s * 0.24);
  if (kind === "ig") { const g = c.createLinearGradient(-s / 2, s / 2, s / 2, -s / 2); g.addColorStop(0, "#FEDA75"); g.addColorStop(0.35, "#FA7E1E"); g.addColorStop(0.65, "#D62976"); g.addColorStop(1, "#4F5BD5"); c.fillStyle = g; }
  else c.fillStyle = kind === "claude" ? C.claude : C.card;
  c.fill(); c.shadowColor = "transparent";
  if (kind === "ig") { c.strokeStyle = "#fff"; c.lineWidth = s * 0.075; rrect(c, -s * 0.28, -s * 0.28, s * 0.56, s * 0.56, s * 0.16); c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.13, 0, 7); c.stroke(); c.beginPath(); c.arc(s * 0.155, -s * 0.155, s * 0.035, 0, 7); c.fillStyle = "#fff"; c.fill(); }
  else if (kind === "claude") claude(c, 0, 0, s * 0.62, "#fff");
  else ghlogo(c, 0, 0, s * 0.6, C.gh);
  c.restore(); }
