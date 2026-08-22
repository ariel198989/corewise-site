/* The campus is no longer embedded. One address reads the company, another
 * shows what it can build, and a door between them beats an iframe that only
 * half-opens the experience. What is left here is the reveal. */

/* Reveal on scroll.
 *
 * The class goes on <html> from JavaScript, so the hidden state only ever
 * exists in a document that is definitely able to reveal it again. Without
 * JavaScript, or if this file fails to load, every card is simply visible. */
(() => {
  if (!('IntersectionObserver' in window)) return;
  const els = document.querySelectorAll('.dcard, .lcard, .fig, .person, .door, .strip figure');
  if (!els.length) return;
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver((entries, ob) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      ob.unobserve(e.target);              /* reveal once, never re-hide */
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
  els.forEach(el => io.observe(el));

  /* The failsafe removes the GATE, it does not just flip the class.
     A CSS transition that is mid-flight when the tab gets throttled stays in
     playState "running" indefinitely, and the element sits at opacity 0 for as
     long as the visitor is away. Dropping .js-reveal deletes the hidden rule
     outright, so visibility stops depending on an animation finishing. */
  const release = () => document.documentElement.classList.remove('js-reveal');
  setTimeout(release, 4000);
  addEventListener('pagehide', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
})();

/* The campus door plays the hall itself.
 *
 * The clip is a megabyte, so it is not fetched until the door is near the
 * viewport, and it is paused again the moment it leaves — a loop running
 * behind three screens of scroll costs battery and buys nothing. The poster
 * is a frame of the loop, so there is no flash when playback starts. */
(() => {
  const door = document.querySelector('.door');
  const vid = door && door.querySelector('.door__bg');
  if (!vid || !vid.dataset.src) return;

  const calm = () =>
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('a11y-reduce-motion');

  let wanted = !calm();          /* what the visitor last asked for */
  let near = false;

  /* WCAG 2.2.2. The control is created here rather than in the markup so it
     can never be shown by a page whose script failed to load — a pause button
     that does nothing is worse than motion with no button at all. */
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'door__pause';
  door.appendChild(btn);

  const EN = () => document.documentElement.lang === 'en';
  function paint() {
    const playing = wanted;
    btn.textContent = playing ? '❚❚' : '▶';
    btn.setAttribute('aria-label', playing
      ? (EN() ? 'Pause the campus preview' : 'השהיית תצוגת הקמפוס')
      : (EN() ? 'Play the campus preview' : 'הפעלת תצוגת הקמפוס'));
  }
  /* Not aria-pressed: the label already changes with the action, and a toggle
     that renames itself must not also claim a pressed state. */
  new MutationObserver(paint).observe(document.documentElement,
    { attributes: true, attributeFilter: ['lang'] });

  /* The door is 1088 CSS px at most, so a desktop at 2x wants the 1080p file
     and a phone at 3x is already oversupplied by the 720p one. Choosing here
     rather than in markup keeps it to a single request: <source media> was
     dropped from the spec and browsers ignore it. */
  const pick = () => (innerWidth <= 820 && vid.dataset.srcSm) ? vid.dataset.srcSm : vid.dataset.src;

  function sync() {
    if (wanted && near) {
      if (!vid.src) vid.src = pick();
      const p = vid.play();
      if (p && p.catch) p.catch(() => {});   /* autoplay refused: poster stands */
    } else {
      vid.pause();
    }
    paint();
  }

  btn.addEventListener('click', () => { wanted = !wanted; sync(); });

  new IntersectionObserver(es => {
    near = es[0].isIntersecting;
    sync();
  }, { rootMargin: '200px 0px' }).observe(door);

  document.addEventListener('visibilitychange', () => { if (document.hidden) vid.pause(); else sync(); });
  paint();
})();
