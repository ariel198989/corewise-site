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

  const LABELS = {
    dumb: { status: 'מקליטה בלבד', count: '0', chip: 'RAW' },
    smart: { status: 'מזהה אירועים', count: String(detections), chip: 'AI · ON' },
  };

  let userTouched = false;

  const setMode = (mode) => {
    cam.dataset.mode = mode;
    toggle.dataset.mode = mode;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === mode)));
    status.textContent = LABELS[mode].status;
    count.textContent = LABELS[mode].count;
    chip.textContent = LABELS[mode].chip;
  };

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
