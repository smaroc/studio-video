function camion(c, x, y, s, col = C.org, rot = 0) { c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  ombreSol(c, 0, 21, 58, 5, 0.22);
  let g = c.createLinearGradient(0, -38, 0, 10); g.addColorStop(0, teinte(col, 0.18)); g.addColorStop(1, teinte(col, -0.18));
  rrect(c, -54, -38, 68, 48, 5); c.fillStyle = g; c.fill();
  c.strokeStyle = teinte(col, -0.28); c.lineWidth = 1.4; for (let u = -42; u < 12; u += 11) { c.beginPath(); c.moveTo(u, -33); c.lineTo(u, 5); c.stroke(); }
  rrect(c, -54, -38, 68, 6, 3); c.fillStyle = "rgba(255,255,255,0.28)"; c.fill();
  rrect(c, -46, -20, 34, 9, 4.5); c.fillStyle = "rgba(255,255,255,0.9)"; c.fill();
  g = c.createLinearGradient(0, -24, 0, 12); g.addColorStop(0, "#3A3A3E"); g.addColorStop(1, "#0A0A0A");
  c.beginPath(); c.moveTo(16, 12); c.lineTo(16, -22); c.lineTo(36, -22); c.quadraticCurveTo(44, -21, 47, -8); c.lineTo(50, 2); c.lineTo(50, 12); c.closePath(); c.fillStyle = g; c.fill();
  g = c.createLinearGradient(24, -18, 44, -4); g.addColorStop(0, "#DCEBFF"); g.addColorStop(1, "#7FA6D6");
  c.beginPath(); c.moveTo(23, -6); c.lineTo(23, -17); c.lineTo(35, -17); c.quadraticCurveTo(40, -16, 43, -6); c.closePath(); c.fillStyle = g; c.fill();
  c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(27, -8); c.lineTo(32, -15); c.stroke();
  rrect(c, 46, -14, 4, 8, 2); c.fillStyle = "#2A2A2A"; c.fill(); rrect(c, 46, 0, 5, 4, 2); c.fillStyle = "#FFD27A"; c.fill();
  rrect(c, 14, 9, 38, 4, 2); c.fillStyle = "#5A5A5A"; c.fill();
  [-38, -14, 34].forEach((u) => roue(c, u, 14, 10, rot)); c.restore(); }
