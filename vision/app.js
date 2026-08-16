// corewise · vision — the one interactive move: dumb camera ⇄ smart camera over the same frame.
document.documentElement.classList.add('js');

// reveal feature cards as they enter (no-JS / no-IO: everything simply stays visible)
(() => {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
})();

/* Detection-box captions live in a data-l attribute (CSS content: attr(data-l)), which the
   shared i18n engine cannot reach. The English sits beside it in data-l-en; swap on demand.
   Boxes with a purely numeric label (the people-counting frame) carry no data-l-en and stay put. */
(() => {
  const boxes = [...document.querySelectorAll('[data-l-en]')];
  const paint = () => {
    const en = document.documentElement.lang === 'en';
    boxes.forEach((b) => {
      if (!b.dataset.lHe) b.dataset.lHe = b.dataset.l;
      b.dataset.l = en ? b.dataset.lEn : b.dataset.lHe;
    });
  };
  paint();
  addEventListener('cw:langchange', paint);
})();

(() => {
  const cam = document.getElementById('cam');
  if (!cam) return;
  const toggle = cam.querySelector('.toggle');
  const buttons = [...toggle.querySelectorAll('button[data-set]')];
  const status = cam.querySelector('[data-status]');
  const count = cam.querySelector('[data-count]');
  const chip = cam.querySelector('[data-chip]');
  const detections = cam.querySelectorAll('.det .box, .det .line').length;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The camera-status readout is written by JS, so its copy cannot live in data-en.
     One table per language, picked off document.documentElement.lang and repainted
     whenever the shared engine fires cw:langchange. */
  const LABELS = {
    he: {
      dumb: { status: 'מקליטה בלבד', count: '0', chip: 'RAW' },
      smart: { status: 'מזהה אירועים', count: String(detections), chip: 'AI · ON' },
    },
    en: {
      dumb: { status: 'recording only', count: '0', chip: 'RAW' },
      smart: { status: 'detecting events', count: String(detections), chip: 'AI · ON' },
    },
  };
  const strings = () => LABELS[document.documentElement.lang === 'en' ? 'en' : 'he'];

  let userTouched = false;

  const setMode = (mode) => {
    cam.dataset.mode = mode;
    toggle.dataset.mode = mode;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === mode)));
    const s = strings()[mode];
    status.textContent = s.status;
    count.textContent = s.count;
    chip.textContent = s.chip;
  };

  // the engine restores markup values on a switch back to Hebrew; re-assert the live state
  addEventListener('cw:langchange', () => setMode(cam.dataset.mode));
  if (document.documentElement.lang === 'en') setMode(cam.dataset.mode);

  buttons.forEach((b) => b.addEventListener('click', () => { userTouched = true; setMode(b.dataset.set); }));

  // keyboard: arrows flip the toggle when a toggle button is focused
  toggle.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    userTouched = true;
    const next = cam.dataset.mode === 'dumb' ? 'smart' : 'dumb';
    setMode(next);
    buttons.find((b) => b.dataset.set === next)?.focus();
  });

  // one orchestrated demo: flip to smart once, when the frame is actually on screen
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((en) => en.isIntersecting)) return;
      io.disconnect();
      window.setTimeout(() => { if (!userTouched) setMode('smart'); }, 1400);
    }, { threshold: 0.45 });
    io.observe(cam.querySelector('.frame'));
  } else {
    setMode('smart');
  }
})();
