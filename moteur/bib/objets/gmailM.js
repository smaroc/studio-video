function gmailM(c, s) { // logo Gmail centré sur l origine courante (faire un translate avant)
  c.save(); c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = s * 0.16;
  const L = -s * 0.34, R = s * 0.34, Tp = -s * 0.22, B = s * 0.26;
  c.strokeStyle = "#4285F4"; c.beginPath(); c.moveTo(L, B); c.lineTo(L, Tp); c.stroke();
  c.strokeStyle = "#34A853"; c.beginPath(); c.moveTo(R, B); c.lineTo(R, Tp); c.stroke();
  c.strokeStyle = "#EA4335"; c.beginPath(); c.moveTo(L, Tp); c.lineTo(0, s * 0.06); c.lineTo(R * 0.72, Tp * 0.62); c.stroke();
  c.strokeStyle = "#FBBC04"; c.beginPath(); c.moveTo(R * 0.72, Tp * 0.62); c.lineTo(R, Tp); c.stroke(); c.restore(); }
