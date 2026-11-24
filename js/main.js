'use strict';

/* boot */
genSold(); renderPickers(); renderMap(); updateBar();
window.SeatView = { sightCheck: fillAll => (T ? T.sightCheck(fillAll) : null) };
paintPoster();
if (reduce) { paintHero(); addEventListener('resize', paintHero); } else requestAnimationFrame(heroLoop);
