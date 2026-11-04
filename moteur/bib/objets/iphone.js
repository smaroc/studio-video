function iphone(c, x, y, w, h) {
  c.save(); c.shadowColor = "rgba(31,27,22,0.16)"; c.shadowBlur = 50; c.shadowOffsetY = 16; rrect(c, x, y, w, h, 56); c.fillStyle = C.card; c.fill(); c.restore();
  rrect(c, x, y, w, h, 56); c.lineWidth = 7; c.strokeStyle = C.ink; c.stroke();
  txt(c, "9:41", x + 62, y + 58, font(700, 24, SANS), C.ink);
  for (let i = 0; i < 4; i++) { rrect(c, x + w - 118 + i * 9, y + 54 - 6 - i * 4, 6, 6 + i * 4, 1.5); c.fillStyle = C.ink; c.fill(); }
  rrect(c, x + w - 72, y + 38, 34, 18, 5); c.lineWidth = 2.5; c.strokeStyle = C.ink; c.stroke(); rrect(c, x + w - 69, y + 41, 24, 12, 3); c.fillStyle = C.ink; c.fill(); }
