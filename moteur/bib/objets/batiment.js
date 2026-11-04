function batiment(c, x, y, w, h, col = C.ink) { c.save(); const d = w * 0.2, fx = x - w / 2 - d / 2, top = y - h;
  ombreSol(c, x + d * 0.6, y + 2, w * 0.75, w * 0.1, 0.25);
  c.beginPath(); c.moveTo(fx + w, y); c.lineTo(fx + w + d, y - d * 0.55); c.lineTo(fx + w + d, top - d * 0.55); c.lineTo(fx + w, top); c.closePath();
  let g = c.createLinearGradient(fx + w, 0, fx + w + d, 0); g.addColorStop(0, teinte(col, -0.35)); g.addColorStop(1, teinte(col, -0.15)); c.fillStyle = g; c.fill();
  c.beginPath(); c.moveTo(fx, top); c.lineTo(fx + d, top - d * 0.55); c.lineTo(fx + w + d, top - d * 0.55); c.lineTo(fx + w, top); c.closePath(); c.fillStyle = teinte(col, 0.32); c.fill();
  g = c.createLinearGradient(0, top, 0, y); g.addColorStop(0, teinte(col, 0.2)); g.addColorStop(1, col); c.fillStyle = g; c.fillRect(fx, top, w, h);
  c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(fx, top, w, 4);
  const cols = w > 90 ? 4 : 3, pw = (w - 20) / cols, rows = Math.max(1, Math.floor((h - 50) / 34));
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const wx = fx + 10 + i * pw + 3, wy = top + 14 + j * 34, ww = pw - 6, wh = 22, lit = ((i * 7 + j * 13 + Math.round(x)) % 5) === 0;
    g = c.createLinearGradient(wx, wy, wx + ww, wy + wh); if (lit) { g.addColorStop(0, "#FFE3A3"); g.addColorStop(1, "#F2A65A"); } else { g.addColorStop(0, "#C9DCEF"); g.addColorStop(1, "#6E8299"); }
    c.fillStyle = g; c.fillRect(wx, wy, ww, wh); c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + ww * 0.45, wy); c.lineTo(wx, wy + wh * 0.7); c.closePath(); c.fill();
    c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(wx, wy + wh, ww, 2); }
  if (h > 70) { const dw = Math.min(26, w * 0.26), dx = fx + w / 2 - dw / 2; c.fillStyle = "#1C1C1C"; c.fillRect(dx, y - 28, dw, 28);
    g = c.createLinearGradient(dx, y - 26, dx, y); g.addColorStop(0, "#9DB7D3"); g.addColorStop(1, "#4F6378"); c.fillStyle = g; c.fillRect(dx + 3, y - 25, dw - 6, 25);
    c.beginPath(); c.moveTo(dx - 8, y - 30); c.lineTo(dx + dw + 8, y - 30); c.lineTo(dx + dw + 4, y - 38); c.lineTo(dx - 4, y - 38); c.closePath(); c.fillStyle = C.org; c.fill(); }
  c.restore(); }
