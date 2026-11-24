'use strict';

/* boot */
genSold(); renderPickers(); renderMap(); updateBar();
paintPoster();
if (reduce) { paintHero(); addEventListener('resize', paintHero); } else requestAnimationFrame(heroLoop);
