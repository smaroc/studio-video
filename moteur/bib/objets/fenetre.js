function fenetre(c, x, y, w, h, url, sombre) { // le contenu commence à y + 58
  c.save(); c.shadowColor = "rgba(31,27,22,0.16)"; c.shadowBlur = 50; c.shadowOffsetY = 16; rrect(c, x, y, w, h, 20); c.fillStyle = sombre ? "#1E1F24" : C.card; c.fill(); c.restore();
  c.save(); rrect(c, x, y, w, h, 20); c.clip(); c.fillStyle = sombre ? "#2A2B31" : "#F3F1EE"; c.fillRect(x, y, w, 56); c.fillStyle = sombre ? "rgba(255,255,255,0.08)" : C.line; c.fillRect(x, y + 56, w, 2); c.restore();
  const k = w < 300 ? 0.6 : 1; ["#FF5F57", "#FEBC2E", "#28C840"].forEach((col, i) => { c.beginPath(); c.arc(x + 26 * k + i * 22 * k, y + 28, 7.5 * k, 0, 7); c.fillStyle = col; c.fill(); });
  if (url) { const uw = Math.min(w - 180, 560); rrect(c, x + w / 2 - uw / 2 + 30, y + 12, uw, 32, 10); c.fillStyle = sombre ? "#1E1F24" : "#fff"; c.fill();
    fitTxt(c, url, x + w / 2 + 30, y + 34, 17, uw - 30, SANS, sombre ? "rgba(255,255,255,0.75)" : C.mut, "center", 600); } }
