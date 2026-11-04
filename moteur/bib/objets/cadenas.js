function cadenas(c, x, y, s, col) { c.save(); c.translate(x, y); c.strokeStyle = col; c.lineWidth = s * 0.14; c.beginPath(); c.arc(0, -s * 0.12, s * 0.26, Math.PI, 0); c.stroke();
  rrect(c, -s * 0.4, -s * 0.12, s * 0.8, s * 0.6, s * 0.12); c.fillStyle = col; c.fill(); c.restore(); }
