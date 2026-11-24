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

/* ---------------- seat map ---------------- */
function renderMap() {
  let h = '';
  for (let ri = 11; ri >= 0; ri--) {
    const tr = tierOf(ri);
    if (ri === 11 || ri === 9 || ri === 3) h += `<div class="tier"><span>${TIERS[tr].name}</span><b>₹${TIERS[tr].price}</b></div>`;
    h += `<div class="srow"><span class="rl">${ROWS[ri]}</span>`;
    for (let n = 1; n <= PER_ROW; n++) {
      if (n === 5 || n === 13) h += '<span class="aisle"></span>';
      const id = idOf(ri, n), sold = state.sold.has(id), sel = state.selected.includes(id);
      const q = scoreColor(metrics(ri, n).s);
      h += `<button class="seat${tr === 'recliner' ? ' rec' : ''}${sold ? ' sold' : ''}${sel ? ' sel' : ''}" style="--q:${q}" data-id="${id}" ${sold ? 'disabled' : ''} aria-label="Row ${ROWS[ri]} seat ${n}, ${TIERS[tr].name} ₹${TIERS[tr].price}${sold ? ', sold' : sel ? ', selected' : ''}">${n}</button>`;
    }
    h += `<span class="rl">${ROWS[ri]}</span></div>`;
  }
  h += '<div class="screen">All eyes this way</div>';
  $('map').innerHTML = h;
  $('mapWrap').classList.toggle('heat', state.heat);
}
$('heatBtn').addEventListener('click', () => { state.heat = !state.heat; $('heatBtn').setAttribute('aria-pressed', state.heat); $('mapWrap').classList.toggle('heat', state.heat); });

function toggleSeat(id) {
  if (state.sold.has(id)) return false;
  const i = state.selected.indexOf(id);
  if (i >= 0) state.selected.splice(i, 1);
  else { if (state.selected.length >= 10) state.selected.shift(); state.selected.push(id); }
  document.querySelectorAll('.seat').forEach(b => b.classList.toggle('sel', state.selected.includes(b.dataset.id)));
  updateBar(); if (T) T.refreshSeats();
  return state.selected.includes(id);
}
$('map').addEventListener('click', e => {
  const b = e.target.closest('.seat'); if (!b || b.disabled) return;
  const on = toggleSeat(b.dataset.id);
  if (on) showPop(b); else hidePop();
});

const pop = $('pop');
function showPop(btn) {
  const id = btn.dataset.id, [ri, n] = parseId(id), tr = TIERS[tierOf(ri)], m = metrics(ri, n);
  pop.style.setProperty('--q', scoreColor(m.s));
  pop.innerHTML = `<button class="x" aria-label="Close">×</button>
    <div class="pt"><strong>Row ${ROWS[ri]} · ${n}</strong><span>₹${tr.price}</span></div>
    <div class="ps">${tr.name} · view score <b>${m.s}</b> · ${m.verdict}</div>
    <button class="btn primary full" data-preview="${id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>Preview view from here</button>`;
  pop.hidden = false;
  const wrap = $('mapWrap'), wr = wrap.getBoundingClientRect(), br = btn.getBoundingClientRect();
  const w = pop.offsetWidth, ph = pop.offsetHeight;
  const cx = br.left - wr.left + wrap.scrollLeft + br.width / 2;
  let left = Math.max(8, Math.min(cx - w / 2, wrap.scrollWidth - w - 8));
  let top = br.top - wr.top + wrap.scrollTop - ph - 10;
  pop.style.left = left + 'px'; pop.style.top = Math.max(4, top) + 'px';
  pop.style.setProperty('--ax', (cx - left) + 'px');
  pop._btn = btn;
}
function hidePop() { pop.hidden = true; }
pop.addEventListener('click', e => {
  if (e.target.closest('.x')) return hidePop();
  const p = e.target.closest('[data-preview]');
  if (p) openPreview(p.dataset.preview, pop._btn.getBoundingClientRect());
});
document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.seat')) hidePop(); });

function updateBar() {
  const sel = state.selected;
  $('bar').classList.toggle('on', sel.length > 0);
  const total = sel.reduce((a, id) => a + TIERS[tierOf(parseId(id)[0])].price, 0);
  $('barCount').textContent = `${sel.length} seat${sel.length === 1 ? '' : 's'} · ${DATES[state.date][0]} ${DATES[state.date][1]} Dec, ${SHOWS[state.show]}`;
  $('barSeats').textContent = sel.length ? sel.join(', ') : '—';
  $('barTotal').textContent = '₹' + total.toLocaleString('en-IN');
  if (T) T.updateBookBtn();
}

$('barPay').addEventListener('click', () => {
  $('dlgText').textContent = `${state.selected.join(', ')} for Avengers: Doomsday, ${DATES[state.date][0]} ${DATES[state.date][1]} Dec at ${SHOWS[state.show]}. Total ${$('barTotal').textContent}. This is a demo, so no payment was taken.`;
  $('dlg').hidden = false;
});
$('dlgOk').addEventListener('click', () => { $('dlg').hidden = true; });
