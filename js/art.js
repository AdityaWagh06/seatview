'use strict';

/* ---------------- illustrated art (original drawing, not official) ---------------- */
const TAU = Math.PI * 2;
const CITY = (() => { const r = rng(42), b = []; let x = -0.01; while (x < 1) { const w = 0.02 + r() * 0.05; b.push({ x, w, h: (0.12 + r() * 0.36) * (r() < 0.15 ? 1.5 : 1), cut: r() < 0.35 ? (r() - 0.5) * 0.08 : 0, win: r() }); x += w + r() * 0.006; } return b; })();
function drawCity(g, W, H, t) {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0e0503'); sky.addColorStop(0.55, '#4e1607'); sky.addColorStop(0.8, '#b8481a'); sky.addColorStop(1, '#160502');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const fg = g.createRadialGradient(W * 0.5, H * 0.82, 10, W * 0.5, H * 0.82, W * 0.5);
  fg.addColorStop(0, `rgba(255,150,60,${0.42 + 0.1 * Math.sin(t * 3)})`); fg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {
    const sx = ((i * 0.17 + t * 0.01 * (1 + i % 3)) % 1.2 - 0.1) * W, sy = H * (0.35 + 0.08 * Math.sin(i + t * 0.2));
    const sm = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.45); sm.addColorStop(0, 'rgba(18,9,7,.6)'); sm.addColorStop(1, 'rgba(18,9,7,0)');
    g.fillStyle = sm; g.fillRect(0, 0, W, H);
  }
  const gy = H * 0.86, ws = Math.max(1.5, H / 200);
  for (const b of CITY) {
    const bx = b.x * W, bw = b.w * W, bh = b.h * H;
    g.fillStyle = '#0a0504';
    g.beginPath(); g.moveTo(bx, gy); g.lineTo(bx, gy - bh); g.lineTo(bx + bw, gy - bh + b.cut * H); g.lineTo(bx + bw, gy); g.fill();
    if (b.win > 0.4) { g.fillStyle = 'rgba(255,140,60,.5)'; for (let wy = gy - bh + 4 * ws; wy < gy - 3 * ws; wy += 4.5 * ws) for (let wx = bx + 2 * ws; wx < bx + bw - 2 * ws; wx += 3.5 * ws) if ((((wx * 7 + wy * 13) | 0) % 5) === 0) g.fillRect(wx, wy, ws, ws * 1.4); }
  }
  g.fillStyle = '#050302'; g.fillRect(0, gy, W, H - gy);
  for (let i = 0; i < 90; i++) {
    const ex = ((i * 137.5 + t * 18 * (1 + i % 3) + Math.sin(t + i) * 10) % W + W) % W, ey = H - ((i * 53.7 + t * 36 * (1 + i % 4)) % H);
    g.fillStyle = `rgba(255,${120 + (i % 5) * 20},40,${0.35 + (i % 3) * 0.2})`; g.fillRect(ex, ey, ws, ws);
  }
}
function drawFigure(g, cx, by, u, t, glow) {
  const metal = (x0, x1) => { const m = g.createLinearGradient(x0, 0, x1, 0); m.addColorStop(0, '#24292c'); m.addColorStop(0.45, '#8d979d'); m.addColorStop(0.55, '#c3cbcf'); m.addColorStop(1, '#2a3033'); return m; };
  const ar = g.createRadialGradient(cx, by - 220 * u, 10 * u, cx, by - 220 * u, 300 * u);
  ar.addColorStop(0, `rgba(60,255,150,${0.22 * glow})`); ar.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = ar; g.fillRect(cx - 320 * u, by - 520 * u, 640 * u, 560 * u);
  const cloak = g.createLinearGradient(0, by - 350 * u, 0, by); cloak.addColorStop(0, '#12301f'); cloak.addColorStop(1, '#020504');
  const rim = `rgba(110,255,190,${0.45 * glow})`;
  g.beginPath(); g.moveTo(cx - 72 * u, by - 210 * u);
  g.quadraticCurveTo(cx - 160 * u, by - 110 * u, cx - 200 * u, by);
  g.quadraticCurveTo(cx, by + 14 * u, cx + 200 * u, by);
  g.quadraticCurveTo(cx + 160 * u, by - 110 * u, cx + 72 * u, by - 210 * u); g.closePath();
  g.fillStyle = cloak; g.fill(); g.strokeStyle = rim; g.lineWidth = 2 * u; g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3 * u;
  for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + k * 22 * u, by - 150 * u); g.quadraticCurveTo(cx + k * 40 * u, by - 70 * u, cx + k * 70 * u, by); g.stroke(); }
  g.beginPath(); g.moveTo(cx - 55 * u, by - 212 * u); g.lineTo(cx + 55 * u, by - 212 * u); g.lineTo(cx + 45 * u, by - 140 * u); g.quadraticCurveTo(cx, by - 115 * u, cx - 45 * u, by - 140 * u); g.closePath();
  g.fillStyle = metal(cx - 55 * u, cx + 55 * u); g.fill();
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx - 2 * u, by - 205 * u, 4 * u, 70 * u);
  [-1, 1].forEach(s => { g.beginPath(); g.ellipse(cx + s * 72 * u, by - 205 * u, 36 * u, 20 * u, s * 0.25, 0, TAU); g.fillStyle = metal(cx + s * 36 * u, cx + s * 108 * u); g.fill(); });
  g.beginPath(); g.moveTo(cx - 64 * u, by - 200 * u);
  g.quadraticCurveTo(cx - 78 * u, by - 335 * u, cx, by - 352 * u);
  g.quadraticCurveTo(cx + 78 * u, by - 335 * u, cx + 64 * u, by - 200 * u);
  g.quadraticCurveTo(cx, by - 228 * u, cx - 64 * u, by - 200 * u);
  g.fillStyle = cloak; g.fill(); g.strokeStyle = rim; g.lineWidth = 2 * u; g.stroke();
  g.beginPath(); g.ellipse(cx, by - 262 * u, 38 * u, 56 * u, 0, 0, TAU); g.fillStyle = '#010201'; g.fill();
  g.beginPath(); g.moveTo(cx - 28 * u, by - 300 * u); g.quadraticCurveTo(cx, by - 314 * u, cx + 28 * u, by - 300 * u);
  g.lineTo(cx + 24 * u, by - 238 * u); g.quadraticCurveTo(cx, by - 222 * u, cx - 24 * u, by - 238 * u); g.closePath();
  g.fillStyle = metal(cx - 28 * u, cx + 28 * u); g.fill();
  g.fillStyle = 'rgba(0,0,0,.6)'; for (let i = -2; i <= 2; i++) g.fillRect(cx + i * 7 * u - u, by - 252 * u, 2 * u, 12 * u);
  g.shadowColor = '#4dffa0'; g.shadowBlur = 20 * u * glow; g.fillStyle = `rgba(160,255,210,${0.5 + 0.5 * glow})`;
  g.fillRect(cx - 21 * u, by - 282 * u, 14 * u, 4 * u); g.fillRect(cx + 7 * u, by - 282 * u, 14 * u, 4 * u);
  const hx = cx + 120 * u, hy = by - 100 * u, pr = (18 + 6 * Math.sin(t * 5)) * u;
  const eg = g.createRadialGradient(hx, hy, 0, hx, hy, pr * 3); eg.addColorStop(0, `rgba(220,255,235,${glow})`); eg.addColorStop(0.3, `rgba(70,255,160,${0.7 * glow})`); eg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = eg; g.beginPath(); g.arc(hx, hy, pr * 3, 0, TAU); g.fill();
  g.shadowBlur = 0;
}
function drawFigureScene(g, W, H, t, p) {
  const bg = g.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, W * 0.7); bg.addColorStop(0, '#0f2318'); bg.addColorStop(1, '#010302');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) { const sx = W * (0.1 + i * 0.16) + Math.sin(t * 0.4 + i) * 30, sy = H * (0.3 + (i % 3) * 0.2); const sm = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.5); sm.addColorStop(0, 'rgba(40,90,60,.16)'); sm.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sm; g.fillRect(0, 0, W, H); }
  if (Math.random() < 0.06) { g.fillStyle = 'rgba(180,255,220,.12)'; g.fillRect(0, 0, W, H); }
  const u = H / 400 * (0.9 + 0.22 * p);
  drawFigure(g, W / 2, H * 1.02, u, t, 0.6 + 0.4 * Math.sin(t * 2.2) ** 2);
}
function paintHero() {
  const c = $('heroArt'); if (!c) return;
  const w = c.clientWidth, h = c.clientHeight, dpr = Math.min(devicePixelRatio, 2);
  if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const g = c.getContext('2d'), W = c.width, H = c.height, t = performance.now() / 1000;
  drawCity(g, W, H, t);
  const narrow = w < 700;
  drawFigure(g, narrow ? W * 0.62 : W * 0.76, H * 1.04, H / 400 * (narrow ? 0.85 : 1), t, 0.7 + 0.3 * Math.sin(t * 2) ** 2);
}
function paintPoster() {
  const c = document.createElement('canvas'); c.width = 300; c.height = 450; const g = c.getContext('2d');
  drawCity(g, 300, 450, 3);
  g.fillStyle = 'rgba(4,20,12,.55)'; g.fillRect(0, 0, 300, 450);
  drawFigure(g, 150, 440, 0.95, 0, 1);
  const p = document.querySelector('.poster'); if (p) p.style.background = `linear-gradient(0deg,rgba(0,0,0,.85),transparent 45%), url(${c.toDataURL('image/jpeg', 0.85)}) center/cover`;
}
let heroLast = 0;
function heroLoop(now) { requestAnimationFrame(heroLoop); if (now - heroLast < 40 || ($('pv') && !$('pv').hidden)) return; heroLast = now; paintHero(); }
