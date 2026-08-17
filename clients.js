/* Corewise client strip.
   Shared verbatim by every site that shows it; copy, do not fork.

   The markup is generated here rather than written into seven HTML files so
   that adding a client is a one-line edit in CLIENTS below.

   Two tracks are emitted, identical, because the CSS animation translates by
   exactly one track width. One track would show a gap for half the loop; three
   would just cost more.

   The pause button exists because WCAG 2.2.2 requires a way to stop content
   that moves on its own for more than five seconds, and we publish an
   accessibility statement that says we meet AA. Hover and focus pausing are a
   convenience; the button is the compliance.

   Logos are decorative repetitions of the link text, so each img is
   aria-hidden and the accessible name comes from the link itself. Otherwise a
   screen reader reads every client twice, once per track. */
(() => {
  const CLIENTS = [
    { name: 'המכללה האקדמית ספיר', img: 'clients/sapir.svg',  url: 'https://www.sapir.ac.il' },
    { name: 'אולמדע',              img: 'clients/olmeda.webp', url: 'https://www.olmeda.co.il' },
    { name: 'ירחג שיווק' },        /* no logo file yet, renders as a wordmark */
    { name: 'נכון מאיר חן' },
  ];

  const STR = {
    he: { title: 'עסקים וארגונים שליווינו', pause: 'עצירת התנועה', play: 'הפעלת התנועה' },
    en: { title: 'Businesses and organisations we have worked with', pause: 'Pause the motion', play: 'Resume the motion' },
  };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* `linked` is false for the duplicate track. That track is aria-hidden, and
     a focusable element inside aria-hidden is a real defect: keyboard focus
     lands somewhere a screen reader has been told does not exist. So the
     repeat renders as inert spans, never as links. */
  function trackHTML(base, linked) {
    return CLIENTS.map(c => {
      const inner = c.img
        /* eager on purpose: the whole strip is a couple of dozen KB, and a
           lazy image inside a continuously transformed track does not
           reliably trigger its own load */
        ? '<img src="' + base + esc(c.img) + '" alt="" aria-hidden="true" decoding="async" width="190" height="34">'
        : '<span class="cw-clients__word">' + esc(c.name) + '</span>';
      return (c.url && linked)
        ? '<a class="cw-clients__item" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '<span class="cw-a11y-live">' + esc(c.name) + '</span></a>'
        : '<span class="cw-clients__item">' + inner + '</span>';
    }).join('');
  }

  function build(host) {
    const base = host.dataset.base || '';
    const lang = document.documentElement.lang === 'en' ? 'en' : 'he';
    const t = STR[lang];

    host.classList.add('cw-clients');
    if (host.dataset.theme === 'dark') host.classList.add('is-dark');

    /* the second track is a pure visual repeat, so it is hidden from the
       accessibility tree entirely */
    host.innerHTML =
      '<div class="cw-clients__head">'
      + '<h2 class="cw-clients__title">' + t.title + '</h2>'
      + '<button type="button" class="cw-clients__pause" aria-pressed="false">'
      + '<i aria-hidden="true">II</i><span>' + t.pause + '</span></button>'
      + '</div>'
      + '<div class="cw-clients__view">'
      + '<div class="cw-clients__track">' + trackHTML(base, true) + '</div>'
      + '<div class="cw-clients__track" aria-hidden="true">' + trackHTML(base, false) + '</div>'
      + '</div>';

    const cur = () => (document.documentElement.lang === 'en' ? 'en' : 'he');
    const btn = host.querySelector('.cw-clients__pause');
    btn.addEventListener('click', () => {
      const paused = host.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.querySelector('span').textContent = paused ? STR[cur()].play : STR[cur()].pause;
      btn.querySelector('i').textContent = paused ? '▶' : 'II';
    });

    /* follow whichever language switch this page happens to own */
    new MutationObserver(() => {
      const s = STR[cur()];
      host.querySelector('.cw-clients__title').textContent = s.title;
      btn.querySelector('span').textContent = host.classList.contains('is-paused') ? s.play : s.pause;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  const start = () => document.querySelectorAll('[data-cw-clients]').forEach(build);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start);
  else start();

  window.cwClients = { list: () => CLIENTS.slice() };
})();
