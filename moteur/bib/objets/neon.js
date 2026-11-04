function neon(c, s, x, y, sz, t, d = {}) { // texte néon centré : halo, léger scintillement, allumage à d.t0 avec deux clignements ; d : { col, t0, italique, police }
  const col = d.col || "#FFB054", t0 = d.t0 ?? -1; let on = 1;
  if (t0 >= 0) { const u = t - t0; if (u < 0) return; on = u < 0.08 ? 1 : u < 0.14 ? 0.15 : u < 0.22 ? 1 : u < 0.27 ? 0.3 : 1; }
  on *= 0.94 + 0.06 * Math.sin(t * 37) * Math.sin(t * 13);
  const f = d.police ? font(400, sz, d.police) : font(700, sz, SANS, d.italique !== false);
  c.save(); c.globalAlpha *= on; c.textAlign = "center"; c.textBaseline = "middle"; c.font = f;
  for (const [b, a] of [[sz * 0.9, 0.35], [sz * 0.35, 0.6], [sz * 0.12, 0.9]]) { c.shadowColor = col; c.shadowBlur = b; c.fillStyle = col; c.globalAlpha = on * a; c.fillText(s, x, y); }
  c.shadowBlur = 0; c.globalAlpha = on; c.fillStyle = teinte(col, 0.6); c.fillText(s, x, y); c.restore(); }
