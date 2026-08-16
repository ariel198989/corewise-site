/* videoevents, two behaviours only.
   1. the "becoming" strip: scroll drives a 0..1 progress that closes the gaps between five prints
      until they are one continuous frame. It never runs backwards, because a film does not
      turn back into a pile of photographs.
   2. the Hollow player: a facade. Nothing is requested from YouTube until the visitor presses play. */
(() => {
  'use strict';

  /* ---------------- the strip ---------------- */
  const strip = document.querySelector('[data-strip]');
  if (strip) {
    const calm = matchMedia('(prefers-reduced-motion: reduce)');
    let peak = 0, queued = false;

    const measure = () => {
      const r = strip.getBoundingClientRect();
      const vh = innerHeight || 1;
      /* starts as the strip enters from the bottom, completes once it sits in the middle of the screen */
      const p = (vh * 0.92 - r.top) / (vh * 0.62 + r.height * 0.35);
      peak = Math.min(1, Math.max(peak, p));
      strip.style.setProperty('--p', peak.toFixed(3));
      queued = false;
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(measure); } };

    if (calm.matches) {
      strip.style.setProperty('--p', '1');
    } else {
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll, { passive: true });
      measure();
    }
  }

  /* ---------------- the Hollow player ---------------- */
  const screen = document.querySelector('[data-screen]');
  const eps = [...document.querySelectorAll('.ep')];
  if (screen && eps.length) {
    const btn = screen.querySelector('[data-play]');
    const num = screen.querySelector('[data-epnum]');
    const poster = screen.querySelector('[data-poster]');
    let current = eps[0];

    /* the still is a real frame of the episode. If YouTube ever stops serving the large one,
       fall back to the small size rather than leaving a hole in the screen. */
    if (poster) poster.addEventListener('error', () => {
      if (poster.src.includes('maxresdefault')) poster.src = poster.src.replace('maxresdefault', 'hqdefault');
    }, true);

    const label = () => {
      const n = current.dataset.n;
      const en = document.documentElement.lang === 'en';
      if (btn) btn.setAttribute('aria-label', en ? 'Play The Hollow, episode ' + n : 'נגן את פרק ' + n + ' של The Hollow');
      if (poster) poster.alt = en ? 'A frame from episode ' + n + ' of the series The Hollow' : 'פריים מתוך פרק ' + n + ' של הסדרה The Hollow';
    };

    const select = el => {
      current = el;
      eps.forEach(e => {
        const on = e === el;
        e.classList.toggle('is-on', on);
        e.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (num) num.textContent = String(el.dataset.n).padStart(2, '0');
      if (poster) poster.src = 'https://i.ytimg.com/vi/' + el.dataset.ep + '/maxresdefault.jpg';
      /* choosing an episode never starts playback, it only re-arms the facade */
      const frame = screen.querySelector('iframe');
      if (frame) { frame.remove(); if (btn) btn.hidden = false; if (poster) poster.hidden = false; }
      label();
    };

    eps.forEach(e => e.addEventListener('click', () => select(e)));

    if (btn) btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + current.dataset.ep + '?autoplay=1&rel=0';
      f.title = 'The Hollow ' + current.dataset.n;
      f.allow = 'accelerometer; encrypted-media; picture-in-picture; fullscreen';
      f.setAttribute('allowfullscreen', '');
      f.loading = 'lazy';
      screen.appendChild(f);
      btn.hidden = true;
      if (poster) poster.hidden = true;
    });

    addEventListener('cw:langchange', label);
    label();
  }
})();
