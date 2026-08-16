// Corewise · pedagogy — tiny progressive enhancements. No dependencies.
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  // sticky bar: hairline only once the page has scrolled
  var top = document.querySelector('.top');
  var onScroll = function () { top.classList.toggle('is-stuck', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // reveal on view (content is visible without JS / without IO)
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // desktop rail: larva → butterfly, fill follows page progress
  var rail = document.querySelector('.rail');
  if (rail) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      rail.style.setProperty('--p', p.toFixed(4));
      rail.classList.toggle('is-on', window.scrollY > 200);
      rail.classList.toggle('is-done', p > 0.97);
    };
    var request = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
    // English copy is longer, so the page gets taller: re-measure after a switch
    window.addEventListener('cw:langchange', request);
  }

  // this page generates no user-facing strings in JS; the only language-dependent
  // work is re-measuring the layout once the copy has been swapped
  window.addEventListener('cw:langchange', onScroll);
})();
