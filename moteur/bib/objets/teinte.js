function teinte(hex, k) { const n = parseInt(hex.slice(1), 16), f = (v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
