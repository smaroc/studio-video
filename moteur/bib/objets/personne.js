function personne(c, x, y, s, col) { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); c.arc(0, -s * 0.32, s * 0.22, 0, 7); c.fill();
  c.beginPath(); c.arc(0, s * 0.42, s * 0.42, Math.PI, 0); c.fill(); c.restore(); }
