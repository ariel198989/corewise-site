// ar site — tiny, no framework. Replays the hero information-layer once when the figure re-enters view.
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var frame = document.querySelector('.ar-frame');
  if (!frame) return;
  var seen = false;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) { seen = true; return; }
      if (!seen) return;
      // re-run the settle animation for the callouts
      frame.querySelectorAll('.co').forEach(function (el) {
        el.style.animation = 'none';
        void el.offsetWidth; // reflow
        el.style.animation = '';
      });
    });
  }, { threshold: .4 });
  io.observe(frame);
})();
