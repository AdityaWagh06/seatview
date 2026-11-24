'use strict';

/* ---------------- booking state ---------------- */
const state = { date: 0, show: 3, sold: new Set(), selected: [], heat: false };
function genSold() {
  const r = rng(state.date * 97 + state.show * 13 + 7);
  const base = [0.15, 0.24, 0.32, 0.45, 0.28][state.show] * (state.date === 0 || state.date === 1 || state.date === 2 ? 1.15 : 0.85);
  state.sold = new Set();
  for (let ri = 0; ri < 12; ri++) for (let n = 1; n <= PER_ROW; n++) {
    const centre = 1 - Math.abs(seatX(n)) / HALF_SPAN, back = ri / 11;
    if (r() < base * (0.45 + 0.6 * centre + 0.5 * back)) state.sold.add(idOf(ri, n));
  }
  state.selected = state.selected.filter(id => !state.sold.has(id));
}

let T = null; // 3D theater, built on first preview

/* ---------------- pickers ---------------- */
function renderPickers() {
  $('dates').innerHTML = DATES.map(([d, n], i) => `<button class="date" data-i="${i}" aria-pressed="${i === state.date}"><small>${d}</small><strong>${n}</strong><small>Dec</small></button>`).join('');
  $('shows').innerHTML = SHOWS.map((t, i) => `<button class="show" data-i="${i}" aria-pressed="${i === state.show}">${t}<small>${i === 4 ? 'Late night' : 'Laser · Atmos'}</small></button>`).join('');
}
$('dates').addEventListener('click', e => { const b = e.target.closest('.date'); if (!b) return; state.date = +b.dataset.i; state.selected = []; refreshAll(); });
$('shows').addEventListener('click', e => { const b = e.target.closest('.show'); if (!b) return; state.show = +b.dataset.i; state.selected = []; refreshAll(); });
function refreshAll() { genSold(); renderPickers(); renderMap(); hidePop(); updateBar(); if (T) T.refreshSeats(); }
