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
  const els = document.querySelectorAll('.dcard, .lcard, .card, .person, .door');
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
