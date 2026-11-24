'use strict';

/* ================= 3D preview ================= */
const pv = $('pv');

function openPreview(id, rect) {
  hidePop();
  const cx = rect ? rect.left + rect.width / 2 : innerWidth / 2, cy = rect ? rect.top + rect.height / 2 : innerHeight / 2;
  pv.style.setProperty('--cx', cx + 'px'); pv.style.setProperty('--cy', cy + 'px');
  pv.hidden = false; document.body.style.overflow = 'hidden';
  if (!T) {
    try { T = build3D(); }
    catch (err) { console.error(err); pv.insertAdjacentHTML('beforeend', '<div class="nogl">3D preview needs WebGL, which this browser has turned off.</div>'); }
  }
  requestAnimationFrame(() => requestAnimationFrame(() => pv.classList.add('open')));
  if (T) T.enter(id);
}
function closePreview() {
  if (T) T.exit();
  const b = T && document.querySelector(`.seat[data-id="${T.current}"]`);
  if (b) { const r = b.getBoundingClientRect(); pv.style.setProperty('--cx', r.left + r.width / 2 + 'px'); pv.style.setProperty('--cy', r.top + r.height / 2 + 'px'); }
  pv.classList.remove('open');
  setTimeout(() => { pv.hidden = true; document.body.style.overflow = ''; if (T) T.stop(); }, reduce ? 0 : 760);
}
$('pvClose').addEventListener('click', closePreview);
