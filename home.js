/* The campus, embedded but asleep.
 *
 * The 3D hall is three.js plus a multi-megabyte panorama. Loading it on arrival
 * meant every visitor paid for the experience before reading a single word,
 * which is the whole reason people left saying "beautiful, but what do you do".
 * So the section is a photograph until someone asks for it, and only then does
 * the iframe get a src.
 *
 * It is an iframe rather than an inlined canvas on purpose: the hall keeps its
 * own fixed-position layout, its own wheel handling and its own state machine,
 * and none of it leaks into this page. In particular the hall zooms on wheel,
 * which would trap the page scroll if the two shared a document.
 */
(() => {
  const stage = document.querySelector('[data-campus]');
  if (!stage) return;

  const go = stage.querySelector('[data-campus-go]');
  const close = stage.querySelector('[data-campus-close]');
  let frame = null;

  function wake() {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.src = stage.dataset.src;
    frame.title = document.documentElement.lang === 'en'
      ? 'The Corewise virtual campus' : 'הקמפוס הווירטואלי של קורוויז';
    /* the hall asks for motion sensors on phones for the look-around gyro */
    frame.allow = 'accelerometer; gyroscope; fullscreen';
    frame.loading = 'eager';
    stage.appendChild(frame);
    stage.classList.add('is-live');
    go.hidden = true;
    close.hidden = false;
    close.focus();
  }

  function sleep() {
    if (!frame) return;
    frame.remove();                 /* frees the WebGL context, not just hides it */
    frame = null;
    stage.classList.remove('is-live');
    go.hidden = false;
    close.hidden = true;
    go.focus();
  }

  go.addEventListener('click', wake);
  close.addEventListener('click', sleep);
  addEventListener('keydown', e => { if (e.key === 'Escape' && frame) sleep(); });

  /* a visitor who scrolls the campus far out of view is done with it; letting a
     WebGL context idle behind them costs battery for nothing */
  new IntersectionObserver(e => {
    if (frame && !e[0].isIntersecting) sleep();
  }, { threshold: 0 }).observe(stage);
})();

/* Reveal on scroll.
 *
 * The class goes on <html> from JavaScript, so the hidden state only ever
 * exists in a document that is definitely able to reveal it again. Without
 * JavaScript, or if this file fails to load, every card is simply visible. */
(() => {
  if (!('IntersectionObserver' in window)) return;
  const els = document.querySelectorAll('.card, .person, .campus');
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
