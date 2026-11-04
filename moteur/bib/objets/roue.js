function roue(c, x, y, r, rot) { rond(c, x, y, r, "#1A1A1A"); const g = c.createLinearGradient(x, y - r, x, y + r); g.addColorStop(0, "#E8E8E8"); g.addColorStop(1, "#8C8C8C");
  rond(c, x, y, r * 0.58, g); c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = "#6A6A6A"; c.lineWidth = r * 0.1;
  for (let i = 0; i < 5; i++) { c.rotate(Math.PI * 2 / 5); c.beginPath(); c.moveTo(0, r * 0.14); c.lineTo(0, r * 0.5); c.stroke(); } c.restore(); rond(c, x, y, r * 0.16, "#4A4A4A"); }
