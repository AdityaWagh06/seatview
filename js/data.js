'use strict';

/* ---------------- data ---------------- */
const ROWS = 'ABCDEFGHIJKL';
const PER_ROW = 16;                     // 4 | 8 | 4
const TIERS = { recliner:{name:'Recliner',price:650}, prime:{name:'Prime',price:380}, classic:{name:'Classic',price:250} };
const tierOf = ri => ri >= 10 ? 'recliner' : ri >= 4 ? 'prime' : 'classic';
const blockOf = n => n <= 4 ? 0 : n <= 12 ? 1 : 2;
const idOf = (ri, n) => ROWS[ri] + n;
const parseId = id => [ROWS.indexOf(id[0]), +id.slice(1)];
const DATES = [['Fri',18],['Sat',19],['Sun',20],['Mon',21],['Tue',22],['Wed',23],['Thu',24]];
const SHOWS = ['09:40','13:10','16:45','20:15','23:35'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- auditorium geometry (metres) ---------------- */
const SEAT_W = 0.62, AISLE = 1.3, HALF_SPAN = (15 * SEAT_W + 2 * AISLE) / 2;
const HALF_W = 9, RD = 21.4, RH = 11;
const SCR = { w: 13.2, h: 5.52, bottom: 1.9, z: 0.42 }; SCR.cy = SCR.bottom + SCR.h / 2;
const seatX = n => (n - 1) * SEAT_W + blockOf(n) * AISLE - HALF_SPAN;
const rowZ = ri => 6 + ri * 1.25;
const rowFloor = ri => ri < 2 ? ri * 0.15 : 0.3 + (ri - 2) * 0.52;
const eyeOf = (ri, n) => ({ x: seatX(n), y: rowFloor(ri) + 1.15, z: rowZ(ri) + 0.16 });
const deg = r => r * 180 / Math.PI;

function metrics(ri, n) {
  const e = eyeOf(ri, n), dz = e.z - SCR.z;
  const fill = deg(2 * Math.atan(SCR.w / 2 / dz));
  const tilt = deg(Math.atan((SCR.cy - e.y) / dz));
  const off = deg(Math.atan(Math.abs(e.x) / dz));
  const dist = Math.hypot(e.x, e.y - SCR.cy, dz);
  let s = 100;
  if (fill > 55) s -= (fill - 55) * 1.0;
  if (fill < 38) s -= (38 - fill) * 1.5;
  s -= Math.max(0, tilt - 6) * 2.2;
  s -= Math.max(0, -tilt - 8) * 1.5;
  s -= Math.max(0, off - 5) * 1.0;
  s = Math.round(Math.max(5, Math.min(99, s)));
  let verdict, tip;
  if (s >= 90) { verdict = 'Sweet spot'; tip = 'The screen fills your view without moving your head. This is where the sound mix is tuned.'; }
  else if (s >= 78) { verdict = 'Great view'; tip = off > 14 ? 'Slightly to the side, but the whole screen stays comfortably in view.' : 'Immersive and comfortable for a long film.'; }
  else if (s >= 60) { verdict = 'Good'; tip = tilt > 10 ? 'You\'ll look up a little. Fine for most people.' : 'Watchable, but a few rows back would feel better.'; }
  else if (s >= 40) { verdict = 'Fair'; tip = tilt > 14 ? 'Noticeable upward tilt and you\'ll turn your head to follow action at the edges.' : 'Strong side angle; the far edge of the screen looks squeezed.'; }
  else { verdict = 'Neck strain'; tip = 'Very close to the screen. Expect to tilt your head up and turn it to see the edges.'; }
  return { s, fill, tilt, off, dist, verdict, tip };
}
const scoreColor = s => `hsl(${Math.round(Math.max(0, Math.min(1, (s - 25) / 70)) * 140)} 62% 56%)`;

/* seeded random numbers, so the same show always has the same sold seats */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const $ = id => document.getElementById(id);
