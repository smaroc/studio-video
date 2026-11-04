function ombreSol(c, x, y, rx, ry, al = 0.22) { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(10,10,10,${al})`); g.addColorStop(1, "rgba(10,10,10,0)"); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, 7); c.fill(); c.restore(); }
