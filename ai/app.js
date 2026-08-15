// Corewise · AI — tiny progressive enhancements. No dependencies.
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

  // day strip: narrow-screen toggle "לפני / אחרי"
  var grid = document.querySelector('.day__grid');
  var tabs = document.querySelectorAll('.day__toggle [role="tab"]');
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
      grid.setAttribute('data-show', btn.getAttribute('data-col'));
    });
  });
})();
